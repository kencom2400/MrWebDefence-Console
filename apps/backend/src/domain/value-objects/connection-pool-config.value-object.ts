/**
 * ConnectionPoolConfig Value Object
 *
 * 接続プール設定の値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { BadRequestException } from '@nestjs/common';

/**
 * 接続プール設定の値オブジェクト
 */
export class ConnectionPoolConfig {
  public readonly maxConnections: number;
  public readonly minConnections: number;
  public readonly connectionTimeout: number;
  public readonly idleTimeout: number;
  public readonly maxLifetime: number;
  public readonly retryAttempts: number;
  public readonly retryDelay: number;
  public readonly monitorInterval: number;
  public readonly dbHost: string;
  public readonly dbPort: number;
  public readonly dbUser: string;
  public readonly dbPassword: string;
  public readonly dbName: string;

  private constructor(
    maxConnections: number,
    minConnections: number,
    connectionTimeout: number,
    idleTimeout: number,
    maxLifetime: number,
    retryAttempts: number,
    retryDelay: number,
    monitorInterval: number,
    dbHost: string,
    dbPort: number,
    dbUser: string,
    dbPassword: string,
    dbName: string,
  ) {
    this.maxConnections = maxConnections;
    this.minConnections = minConnections;
    this.connectionTimeout = connectionTimeout;
    this.idleTimeout = idleTimeout;
    this.maxLifetime = maxLifetime;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
    this.monitorInterval = monitorInterval;
    this.dbHost = dbHost;
    this.dbPort = dbPort;
    this.dbUser = dbUser;
    this.dbPassword = dbPassword;
    this.dbName = dbName;
  }

  /**
   * 接続プール設定を作成する
   * @param maxConnections 最大接続数（1以上、必須）
   * @param minConnections 最小接続数（0以上、maxConnections以下、必須）
   * @param connectionTimeout 接続取得タイムアウト（ミリ秒、1以上、必須）
   * @param idleTimeout アイドル接続のタイムアウト（ミリ秒、1以上、必須）
   * @param maxLifetime 接続の最大生存時間（ミリ秒、1以上、必須）
   * @param retryAttempts リトライ回数（0以上、必須）
   * @param retryDelay リトライ間隔（ミリ秒、1以上、必須）
   * @param monitorInterval 監視間隔（ミリ秒、1以上、必須）
   * @param dbHost データベースホスト（必須）
   * @param dbPort データベースポート（1以上65535以下、必須）
   * @param dbUser データベースユーザー（必須）
   * @param dbPassword データベースパスワード（必須）
   * @param dbName データベース名（必須）
   * @returns ConnectionPoolConfig Value Object
   * @throws BadRequestException バリデーション失敗時
   */
  public static create(
    maxConnections: number,
    minConnections: number,
    connectionTimeout: number,
    idleTimeout: number,
    maxLifetime: number,
    retryAttempts: number,
    retryDelay: number,
    monitorInterval: number,
    dbHost: string,
    dbPort: number,
    dbUser: string,
    dbPassword: string,
    dbName: string,
  ): ConnectionPoolConfig {
    // バリデーション
    if (maxConnections < 1) {
      throw new BadRequestException('maxConnections must be at least 1');
    }

    if (minConnections < 0) {
      throw new BadRequestException('minConnections must be at least 0');
    }

    if (minConnections > maxConnections) {
      throw new BadRequestException('minConnections must not exceed maxConnections');
    }

    if (connectionTimeout < 1) {
      throw new BadRequestException('connectionTimeout must be at least 1');
    }

    if (idleTimeout < 1) {
      throw new BadRequestException('idleTimeout must be at least 1');
    }

    if (maxLifetime < 1) {
      throw new BadRequestException('maxLifetime must be at least 1');
    }

    if (retryAttempts < 0) {
      throw new BadRequestException('retryAttempts must be at least 0');
    }

    if (retryDelay < 1) {
      throw new BadRequestException('retryDelay must be at least 1');
    }

    if (monitorInterval < 1) {
      throw new BadRequestException('monitorInterval must be at least 1');
    }

    if (!dbHost || dbHost.trim().length === 0) {
      throw new BadRequestException('dbHost is required');
    }

    if (dbPort < 1 || dbPort > 65535) {
      throw new BadRequestException('dbPort must be between 1 and 65535');
    }

    if (!dbUser || dbUser.trim().length === 0) {
      throw new BadRequestException('dbUser is required');
    }

    if (!dbPassword || dbPassword.trim().length === 0) {
      throw new BadRequestException('dbPassword is required');
    }

    if (!dbName || dbName.trim().length === 0) {
      throw new BadRequestException('dbName is required');
    }

    return new ConnectionPoolConfig(
      maxConnections,
      minConnections,
      connectionTimeout,
      idleTimeout,
      maxLifetime,
      retryAttempts,
      retryDelay,
      monitorInterval,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbName,
    );
  }

  /**
   * 環境変数から接続プール設定を作成する
   * @returns ConnectionPoolConfig Value Object
   * @throws BadRequestException DB_PASSWORDが設定されていない場合
   */
  public static fromEnvironment(): ConnectionPoolConfig {
    const maxConnections = parseInt(process.env.DB_POOL_MAX_CONNECTIONS ?? '5', 10);
    const minConnections = parseInt(process.env.DB_POOL_MIN_CONNECTIONS ?? '1', 10);
    const connectionTimeout = parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT ?? '30000', 10);
    const idleTimeout = parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '600000', 10);
    const maxLifetime = parseInt(process.env.DB_POOL_MAX_LIFETIME ?? '3600000', 10);
    const retryAttempts = parseInt(process.env.DB_POOL_RETRY_ATTEMPTS ?? '3', 10);
    const retryDelay = parseInt(process.env.DB_POOL_RETRY_DELAY ?? '1000', 10);
    const monitorInterval = parseInt(process.env.DB_POOL_MONITOR_INTERVAL ?? '5000', 10);
    const dbHost = process.env.DB_HOST ?? 'localhost';
    const dbPort = parseInt(process.env.DB_PORT ?? '3306', 10);
    const dbUser = process.env.DB_USER ?? 'root';
    const dbName = process.env.DB_NAME ?? 'mrwebdefence';

    // DB_PASSWORDは必須のため、設定されていない場合は明確にエラーをスロー
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.trim().length === 0) {
      throw new BadRequestException(
        'DB_PASSWORD environment variable is required. Please set DB_PASSWORD in your environment.',
      );
    }
    const dbPassword = process.env.DB_PASSWORD;

    return ConnectionPoolConfig.create(
      maxConnections,
      minConnections,
      connectionTimeout,
      idleTimeout,
      maxLifetime,
      retryAttempts,
      retryDelay,
      monitorInterval,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbName,
    );
  }

  /**
   * 別の設定オブジェクトと等しいかどうかを判定します
   * @param other 比較対象の設定オブジェクト
   * @returns 等しい場合true、そうでない場合false
   */
  public equals(other: ConnectionPoolConfig): boolean {
    return (
      this.maxConnections === other.maxConnections &&
      this.minConnections === other.minConnections &&
      this.connectionTimeout === other.connectionTimeout &&
      this.idleTimeout === other.idleTimeout &&
      this.maxLifetime === other.maxLifetime &&
      this.retryAttempts === other.retryAttempts &&
      this.retryDelay === other.retryDelay &&
      this.monitorInterval === other.monitorInterval &&
      this.dbHost === other.dbHost &&
      this.dbPort === other.dbPort &&
      this.dbUser === other.dbUser &&
      this.dbPassword === other.dbPassword &&
      this.dbName === other.dbName
    );
  }
}
