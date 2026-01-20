/**
 * ConnectionPoolFactory Unit Tests
 *
 * 接続プールファクトリーのユニットテスト
 */

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

import { ConnectionPoolFactory } from './connection-pool-factory';
import { DatabaseConnectionPool } from './database-connection-pool';
import { ConnectionPoolConfig } from '../../domain/value-objects/connection-pool-config.value-object';

describe('ConnectionPoolFactory', () => {
  describe('create', () => {
    it('正常系: 接続プールを作成できる', () => {
      const config = ConnectionPoolConfig.create(
        5, // maxConnections
        1, // minConnections
        30000, // connectionTimeout
        600000, // idleTimeout
        3600000, // maxLifetime
        3, // retryAttempts
        1000, // retryDelay
        5000, // monitorInterval
        'localhost', // dbHost
        3306, // dbPort
        'root', // dbUser
        'password', // dbPassword
        'testdb', // dbName
      );

      const factory = new ConnectionPoolFactory();
      const pool = factory.create(config);

      expect(pool).toBeInstanceOf(DatabaseConnectionPool);
    });
  });

  describe('createFromEnvironment', () => {
    it('正常系: 環境変数から接続プールを作成できる', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DB_POOL_MAX_CONNECTIONS: '10',
        DB_POOL_MIN_CONNECTIONS: '2',
        DB_POOL_CONNECTION_TIMEOUT: '60000',
        DB_POOL_IDLE_TIMEOUT: '1200000',
        DB_POOL_MAX_LIFETIME: '7200000',
        DB_POOL_RETRY_ATTEMPTS: '5',
        DB_POOL_RETRY_DELAY: '2000',
        DB_PASSWORD: 'test-password', // DB_PASSWORDは必須
      };

      const factory = new ConnectionPoolFactory();
      const config = ConnectionPoolConfig.fromEnvironment();
      const pool = factory.create(config);

      expect(pool).toBeInstanceOf(DatabaseConnectionPool);

      process.env = originalEnv;
    });

    it('正常系: 環境変数が設定されていない場合、デフォルト値で接続プールを作成できる', () => {
      const originalEnv = process.env;
      delete process.env.DB_POOL_MAX_CONNECTIONS;
      delete process.env.DB_POOL_MIN_CONNECTIONS;
      delete process.env.DB_POOL_CONNECTION_TIMEOUT;
      delete process.env.DB_POOL_IDLE_TIMEOUT;
      delete process.env.DB_POOL_MAX_LIFETIME;
      delete process.env.DB_POOL_RETRY_ATTEMPTS;
      delete process.env.DB_POOL_RETRY_DELAY;
      // DB_PASSWORDは必須のため設定
      process.env.DB_PASSWORD = 'test-password';

      const factory = new ConnectionPoolFactory();
      const config = ConnectionPoolConfig.fromEnvironment();
      const pool = factory.create(config);

      expect(pool).toBeInstanceOf(DatabaseConnectionPool);

      process.env = originalEnv;
    });
  });
});
