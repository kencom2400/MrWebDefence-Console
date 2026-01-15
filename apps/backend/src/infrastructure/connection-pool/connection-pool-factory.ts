/**
 * ConnectionPoolFactory
 *
 * 接続プールのファクトリー
 * Infrastructure Layerに位置
 */

import { Injectable } from '@nestjs/common';
import { DatabaseConnectionPool } from './database-connection-pool';
import { ConnectionPoolConfig } from '../../domain/value-objects/connection-pool-config.value-object';

/**
 * 接続プールのファクトリー
 */
@Injectable()
export class ConnectionPoolFactory {
  /**
   * 接続プールを作成します
   * @param config 接続プール設定
   * @returns DatabaseConnectionPoolインスタンス
   */
  create(config: ConnectionPoolConfig): DatabaseConnectionPool {
    return new DatabaseConnectionPool(config);
  }
}
