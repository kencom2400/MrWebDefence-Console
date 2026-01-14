/**
 * ConnectionPoolMonitor
 *
 * 接続プールの監視プロセス
 * Infrastructure Layerに位置
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseConnectionPool } from './database-connection-pool';
import { ConnectionPoolConfig } from '../../domain/value-objects/connection-pool-config.value-object';

/**
 * 接続プールの監視プロセス
 * 定期的にアイドル接続のクリーンアップ、期限切れ接続のクリーンアップ、最小接続数の確保を実行
 */
@Injectable()
export class ConnectionPoolMonitor {
  private readonly logger = new Logger(ConnectionPoolMonitor.name);
  private readonly pool: DatabaseConnectionPool;
  private readonly config: ConnectionPoolConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly MONITOR_INTERVAL_MS = 5000; // 5秒ごとに監視

  constructor(pool: DatabaseConnectionPool, config: ConnectionPoolConfig) {
    this.pool = pool;
    this.config = config;
  }

  /**
   * 監視プロセスを開始します
   */
  start(): void {
    if (this.intervalId !== null) {
      this.logger.warn('Monitor is already running');
      return;
    }

    this.logger.log('Starting connection pool monitor...');
    this.intervalId = setInterval(() => {
      this.monitor().catch((error) => {
        this.logger.error('Error in connection pool monitor', error);
      });
    }, this.MONITOR_INTERVAL_MS);
  }

  /**
   * 監視プロセスを停止します
   */
  stop(): void {
    if (this.intervalId === null) {
      this.logger.warn('Monitor is not running');
      return;
    }

    this.logger.log('Stopping connection pool monitor...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 監視処理を実行します
   * @private
   */
  private async monitor(): Promise<void> {
    try {
      // アイドル接続のクリーンアップ
      await this.pool.cleanupIdleConnections();

      // 期限切れ接続のクリーンアップ
      await this.pool.cleanupExpiredConnections();

      // 最小接続数の確保
      await this.pool.ensureMinConnections();
    } catch (error) {
      this.logger.error('Error during monitoring', error);
    }
  }
}
