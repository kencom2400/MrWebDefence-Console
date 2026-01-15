/**
 * DatabaseConnectionPool
 *
 * データベース接続プールの実装
 * Infrastructure Layerに位置し、IConnectionPoolインターフェースを実装
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { IConnectionPool } from '../../domain/repositories/connection-pool.repository.interface';
import { IConnection } from '../../domain/entities/connection.entity';
import { ConnectionPoolConfig } from '../../domain/value-objects/connection-pool-config.value-object';
import { ConnectionPoolStatus } from '../../domain/value-objects/connection-pool-status.value-object';
import { Connection } from '../connections/connection';
import { ConnectionPoolMonitor } from './connection-pool-monitor';

/**
 * 接続取得タイムアウトエラー
 */
export class ConnectionTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Connection acquisition timeout after ${timeout}ms`);
    this.name = 'ConnectionTimeoutError';
  }
}

/**
 * 接続作成エラー
 */
export class ConnectionError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ConnectionError';
    this.cause = cause;
  }
}

/**
 * 無効な接続エラー
 */
export class InvalidConnectionError extends Error {
  constructor() {
    super('Invalid connection object');
    this.name = 'InvalidConnectionError';
  }
}

/**
 * 初期化エラー
 */
export class InitializationError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(`Failed to initialize connection pool: ${message}`);
    this.name = 'InitializationError';
    this.cause = cause;
  }
}

/**
 * 終了処理エラー
 */
export class DestructionError extends Error {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(`Failed to destroy connection pool: ${message}`);
    this.name = 'DestructionError';
    this.cause = cause;
  }
}

/**
 * データベース接続プールの実装
 */
@Injectable()
export class DatabaseConnectionPool implements IConnectionPool, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseConnectionPool.name);
  private readonly config: ConnectionPoolConfig;
  private readonly connections: Connection[] = [];
  private readonly idleConnections: Connection[] = [];
  private readonly waitingQueue: Array<{
    resolve: (connection: IConnection) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private monitor: ConnectionPoolMonitor | null = null;
  private _isInitialized: boolean = false;
  private _isDestroyed: boolean = false;

  constructor(config: ConnectionPoolConfig) {
    this.config = config;
  }

  /**
   * モジュール初期化時に接続プールを初期化
   */
  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  /**
   * モジュール終了時に接続プールを終了
   */
  async onModuleDestroy(): Promise<void> {
    await this.destroy();
  }

  /**
   * 接続プールを初期化します
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger.warn('Connection pool is already initialized');
      return;
    }

    try {
      this.logger.log('Initializing connection pool...');

      // 最小接続数分の接続を作成
      for (let i = 0; i < this.config.minConnections; i++) {
        const connection = await this.createConnection();
        this.idleConnections.push(connection);
        this.connections.push(connection);
      }

      // 監視プロセスを開始
      this.monitor = new ConnectionPoolMonitor(this, this.config);
      this.monitor.start();

      this._isInitialized = true;
      this.logger.log(`Connection pool initialized with ${this.config.minConnections} connections`);
    } catch (error) {
      this.logger.error('Failed to initialize connection pool', error);
      throw new InitializationError(
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * データベース接続を取得します
   */
  async getConnection(): Promise<IConnection> {
    if (!this._isInitialized) {
      throw new ConnectionError('Connection pool is not initialized');
    }

    if (this._isDestroyed) {
      throw new ConnectionError('Connection pool is destroyed');
    }

    // アイドル接続を取得（有効な接続が見つかるまでループ）
    while (true) {
      const idleConnection = this.getIdleConnection();
      if (!idleConnection) {
        break; // アイドル接続が存在しない場合はループを抜ける
      }

      const isValid = await idleConnection.isValid();
      if (isValid) {
        this.removeFromIdle(idleConnection);
        this.addToActive(idleConnection);
        idleConnection.updateLastUsedAt();
        return idleConnection;
      } else {
        // 無効な接続を破棄して次の接続を試す
        await this.removeInvalidConnection(idleConnection);
        // ループを継続して次のアイドル接続を確認
      }
    }

    // アイドル接続が存在しない場合、最大接続数未満であれば新規作成
    if (this.connections.length < this.config.maxConnections) {
      try {
        const connection = await this.createConnection();
        this.addToActive(connection);
        this.connections.push(connection);
        return connection;
      } catch (error) {
        this.logger.error('Failed to create connection', error);
        throw new ConnectionError(
          error instanceof Error ? error.message : 'Failed to create connection',
          error instanceof Error ? error : undefined,
        );
      }
    }

    // 最大接続数に達している場合、タイムアウトまで待機
    return this.waitForConnection();
  }

  /**
   * データベース接続をプールに返却します
   */
  async releaseConnection(connection: IConnection): Promise<void> {
    if (!this._isInitialized) {
      throw new InvalidConnectionError();
    }

    if (this._isDestroyed) {
      throw new InvalidConnectionError();
    }

    // 接続がこのプールに属しているか確認
    const poolConnection = this.connections.find((c) => c.id === connection.id);
    if (!poolConnection) {
      throw new InvalidConnectionError();
    }

    const isValid = await connection.isValid();
    if (isValid) {
      // 接続の有効期限をチェック
      const now = Date.now();
      const connectionAge = now - poolConnection.createdAt.getTime();
      if (connectionAge > this.config.maxLifetime) {
        // 最大生存時間を超過している場合は破棄
        await this.removeInvalidConnection(poolConnection);
        // 待機中のリクエストを処理
        this.processWaitingQueue();
        return;
      }

      this.addToIdle(poolConnection);
      poolConnection.updateLastUsedAt();
      // 待機中のリクエストを処理
      this.processWaitingQueue();
    } else {
      // 無効な接続を破棄
      await this.removeInvalidConnection(poolConnection);
      // 無効な接続を破棄した後も、待機中のリクエストを処理
      this.processWaitingQueue();
    }
  }

  /**
   * 接続プールの現在の状態を取得します
   */
  getStatus(): ConnectionPoolStatus {
    const activeConnections = this.connections.filter((c) => this.isActive(c)).length;
    const idleConnections = this.idleConnections.length;
    const waitingRequests = this.waitingQueue.length;

    return ConnectionPoolStatus.create(
      activeConnections,
      idleConnections,
      waitingRequests,
      this.config.minConnections,
      this.config.maxConnections,
    );
  }

  /**
   * 接続プールを終了し、すべての接続を閉じます
   */
  async destroy(): Promise<void> {
    if (this._isDestroyed) {
      this.logger.warn('Connection pool is already destroyed');
      return;
    }

    try {
      this.logger.log('Destroying connection pool...');

      // 監視プロセスを停止
      if (this.monitor) {
        this.monitor.stop();
        this.monitor = null;
      }

      // 待機中のリクエストをキャンセル
      for (const request of this.waitingQueue) {
        clearTimeout(request.timeout);
        request.reject(new ConnectionError('Connection pool is being destroyed'));
      }
      this.waitingQueue.length = 0;

      // すべての接続を閉じる
      const closePromises = this.connections.map((connection) => connection.close());
      await Promise.all(closePromises);

      this.connections.length = 0;
      this.idleConnections.length = 0;

      this._isDestroyed = true;
      this.logger.log('Connection pool destroyed');
    } catch (error) {
      this.logger.error('Failed to destroy connection pool', error);
      throw new DestructionError(
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * 新しい接続を作成します
   * @private
   */
  private async createConnection(): Promise<Connection> {
    // リトライロジック
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          await this.delay(this.config.retryDelay);
        }

        // スタブ実装: 新しい接続を作成
        // 将来的に実際のデータベース接続を作成する実装に置き換える
        const connection = new Connection();
        return connection;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Failed to create connection (attempt ${attempt + 1}/${this.config.retryAttempts + 1})`,
          lastError,
        );
      }
    }

    throw new ConnectionError(
      `Failed to create connection after ${this.config.retryAttempts + 1} attempts`,
      lastError,
    );
  }

  /**
   * アイドル接続を取得します
   * @private
   */
  private getIdleConnection(): Connection | null {
    return this.idleConnections.length > 0 ? this.idleConnections[0] : null;
  }

  /**
   * アイドル接続リストから接続を削除します
   * @private
   */
  private removeFromIdle(connection: Connection): void {
    const index = this.idleConnections.indexOf(connection);
    if (index !== -1) {
      this.idleConnections.splice(index, 1);
    }
  }

  /**
   * アクティブ接続リストに接続を追加します
   * @private
   */
  private addToActive(connection: Connection): void {
    // 接続が既にconnectionsに含まれていることを確認
    if (!this.connections.includes(connection)) {
      this.connections.push(connection);
    }
  }

  /**
   * アイドル接続リストに接続を追加します
   * @private
   */
  private addToIdle(connection: Connection): void {
    if (!this.idleConnections.includes(connection)) {
      this.idleConnections.push(connection);
    }
  }

  /**
   * 接続がアクティブかどうかを確認します
   * @private
   */
  private isActive(connection: Connection): boolean {
    return !this.idleConnections.includes(connection);
  }

  /**
   * 無効な接続を削除します
   * @private
   */
  private async removeInvalidConnection(connection: Connection): Promise<void> {
    await connection.close();
    this.removeFromIdle(connection);
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  /**
   * 接続が利用可能になるまで待機します
   * @private
   */
  private waitForConnection(): Promise<IConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex((req) => req.timeout === timeout);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new ConnectionTimeoutError(this.config.connectionTimeout));
      }, this.config.connectionTimeout);

      this.waitingQueue.push({ resolve, reject, timeout });

      // 接続が利用可能になった場合の処理は、releaseConnectionで実行される
      this.processWaitingQueue();
    });
  }

  /**
   * 待機中のリクエストを処理します
   * @private
   */
  private processWaitingQueue(): void {
    if (this.waitingQueue.length === 0 || this.idleConnections.length === 0) {
      return;
    }

    const request = this.waitingQueue.shift();
    if (!request) {
      return;
    }

    const idleConnection = this.idleConnections.shift();
    if (!idleConnection) {
      // アイドル接続がなかったのでリクエストをキューに戻す
      this.waitingQueue.unshift(request);
      return;
    }

    clearTimeout(request.timeout);

    // 非同期で接続の有効性を確認し、リクエストを解決
    (async (): Promise<void> => {
      try {
        if (await idleConnection.isValid()) {
          this.addToActive(idleConnection);
          idleConnection.updateLastUsedAt();
          request.resolve(idleConnection);
          // 次の待機リクエストを処理するために再帰的に呼び出す
          this.processWaitingQueue();
        } else {
          // 無効な接続だったので破棄し、リクエストをキューに戻して再試行
          await this.removeInvalidConnection(idleConnection);
          this.waitingQueue.unshift(request);
          // 次の待機リクエストを処理するために再帰的に呼び出す
          this.processWaitingQueue();
        }
      } catch (error) {
        request.reject(error);
        await this.removeInvalidConnection(idleConnection).catch((e) =>
          this.logger.error('Failed to remove connection on error', e),
        );
        // エラーが発生した場合も、次の待機リクエストを処理するために再帰的に呼び出す
        this.processWaitingQueue();
      }
    })();
  }

  /**
   * アイドル接続をクリーンアップします
   * @internal
   */
  async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToRemove: Connection[] = [];

    for (const connection of this.idleConnections) {
      const idleTime = now - connection.lastUsedAt.getTime();
      if (idleTime > this.config.idleTimeout) {
        connectionsToRemove.push(connection);
      }
    }

    for (const connection of connectionsToRemove) {
      await this.removeInvalidConnection(connection);
    }

    if (connectionsToRemove.length > 0) {
      this.logger.log(`Cleaned up ${connectionsToRemove.length} idle connections`);
    }
  }

  /**
   * 期限切れ接続をクリーンアップします
   * @internal
   */
  async cleanupExpiredConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToRemove: Connection[] = [];

    for (const connection of this.connections) {
      const connectionAge = now - connection.createdAt.getTime();
      if (connectionAge > this.config.maxLifetime) {
        // アクティブな接続は次回releaseConnection時に破棄される
        // アイドル接続のみ即座に破棄
        if (this.idleConnections.includes(connection)) {
          connectionsToRemove.push(connection);
        }
      }
    }

    for (const connection of connectionsToRemove) {
      await this.removeInvalidConnection(connection);
    }

    if (connectionsToRemove.length > 0) {
      this.logger.log(`Cleaned up ${connectionsToRemove.length} expired connections`);
    }
  }

  /**
   * 最小接続数を確保します
   * @internal
   */
  async ensureMinConnections(): Promise<void> {
    const currentConnections = this.connections.length;
    if (currentConnections < this.config.minConnections) {
      const connectionsToCreate = this.config.minConnections - currentConnections;
      for (let i = 0; i < connectionsToCreate; i++) {
        try {
          const connection = await this.createConnection();
          this.idleConnections.push(connection);
          this.connections.push(connection);
        } catch (error) {
          this.logger.error('Failed to create connection for min pool size', error);
        }
      }
    }
  }

  /**
   * 遅延処理
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
