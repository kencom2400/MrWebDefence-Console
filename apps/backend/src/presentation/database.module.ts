/**
 * Database Module
 *
 * データベース接続プール機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { DatabaseConnectionPool } from '../infrastructure/connection-pool/database-connection-pool';
import { ConnectionPoolConfig } from '../domain/value-objects/connection-pool-config.value-object';
import { ConnectionPoolFactory } from '../infrastructure/connection-pool/connection-pool-factory';

@Module({
  controllers: [],
  providers: [
    {
      provide: ConnectionPoolConfig,
      useFactory: (): ConnectionPoolConfig => {
        return ConnectionPoolConfig.fromEnvironment();
      },
    },
    ConnectionPoolFactory,
    {
      provide: 'IConnectionPool',
      useFactory: (
        config: ConnectionPoolConfig,
        factory: ConnectionPoolFactory,
      ): DatabaseConnectionPool => {
        return factory.create(config);
      },
      inject: [ConnectionPoolConfig, ConnectionPoolFactory],
    },
    {
      provide: DatabaseConnectionPool,
      useFactory: (
        config: ConnectionPoolConfig,
        factory: ConnectionPoolFactory,
      ): DatabaseConnectionPool => {
        return factory.create(config);
      },
      inject: [ConnectionPoolConfig, ConnectionPoolFactory],
    },
  ],
  exports: ['IConnectionPool', ConnectionPoolConfig, DatabaseConnectionPool, ConnectionPoolFactory],
})
export class DatabaseModule {}
