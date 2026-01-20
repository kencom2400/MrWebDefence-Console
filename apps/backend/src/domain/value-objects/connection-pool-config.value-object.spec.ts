/**
 * ConnectionPoolConfig Value Object テスト
 */

import { ConnectionPoolConfig } from './connection-pool-config.value-object';
import { BadRequestException } from '@nestjs/common';

describe('ConnectionPoolConfig', () => {
  describe('create', () => {
    it('有効な値で接続プール設定を作成できる', () => {
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
        'mrwebdefence', // dbName
      );

      expect(config.maxConnections).toBe(5);
      expect(config.minConnections).toBe(1);
      expect(config.connectionTimeout).toBe(30000);
      expect(config.idleTimeout).toBe(600000);
      expect(config.maxLifetime).toBe(3600000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.dbHost).toBe('localhost');
      expect(config.dbPort).toBe(3306);
      expect(config.dbUser).toBe('root');
      expect(config.dbPassword).toBe('password');
      expect(config.dbName).toBe('mrwebdefence');
    });

    it('maxConnectionsが1未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          0,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(
          -1,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('minConnectionsが0未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          -1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('minConnectionsがmaxConnectionsを超える場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          6,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('connectionTimeoutが1未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          0,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          -1,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('idleTimeoutが1未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          0,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          -1,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('maxLifetimeが1未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          0,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          -1,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('retryAttemptsが0未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          -1,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('retryDelayが1未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          0,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          -1,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('dbHostが空の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          '',
          3306,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('dbPortが1未満または65535を超える場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          0,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          65536,
          'root',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('dbUserが空の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          '',
          'password',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('dbPasswordが空の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          '',
          'mrwebdefence',
        ),
      ).toThrow(BadRequestException);
    });

    it('dbNameが空の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(
          5,
          1,
          30000,
          600000,
          3600000,
          3,
          1000,
          5000,
          'localhost',
          3306,
          'root',
          'password',
          '',
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('fromEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('環境変数から接続プール設定を作成できる', () => {
      process.env.DB_POOL_MAX_CONNECTIONS = '10';
      process.env.DB_POOL_MIN_CONNECTIONS = '2';
      process.env.DB_POOL_CONNECTION_TIMEOUT = '60000';
      process.env.DB_POOL_IDLE_TIMEOUT = '1200000';
      process.env.DB_POOL_MAX_LIFETIME = '7200000';
      process.env.DB_POOL_RETRY_ATTEMPTS = '5';
      process.env.DB_POOL_RETRY_DELAY = '2000';
      process.env.DB_POOL_MONITOR_INTERVAL = '10000';
      process.env.DB_HOST = 'test-host';
      process.env.DB_PORT = '3307';
      process.env.DB_USER = 'test-user';
      process.env.DB_PASSWORD = 'test-password';
      process.env.DB_NAME = 'test-db';

      const config = ConnectionPoolConfig.fromEnvironment();

      expect(config.maxConnections).toBe(10);
      expect(config.minConnections).toBe(2);
      expect(config.connectionTimeout).toBe(60000);
      expect(config.idleTimeout).toBe(1200000);
      expect(config.maxLifetime).toBe(7200000);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryDelay).toBe(2000);
      expect(config.monitorInterval).toBe(10000);
      expect(config.dbHost).toBe('test-host');
      expect(config.dbPort).toBe(3307);
      expect(config.dbUser).toBe('test-user');
      expect(config.dbPassword).toBe('test-password');
      expect(config.dbName).toBe('test-db');
    });

    it('環境変数が設定されていない場合、デフォルト値を使用する', () => {
      delete process.env.DB_POOL_MAX_CONNECTIONS;
      delete process.env.DB_POOL_MIN_CONNECTIONS;
      delete process.env.DB_POOL_CONNECTION_TIMEOUT;
      delete process.env.DB_POOL_IDLE_TIMEOUT;
      delete process.env.DB_POOL_MAX_LIFETIME;
      delete process.env.DB_POOL_RETRY_ATTEMPTS;
      delete process.env.DB_POOL_RETRY_DELAY;
      delete process.env.DB_POOL_MONITOR_INTERVAL;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      // デフォルト値でdbPasswordが空文字列の場合、エラーが発生するため、テスト用のパスワードを設定
      process.env.DB_PASSWORD = 'default-password';

      const config = ConnectionPoolConfig.fromEnvironment();

      expect(config.maxConnections).toBe(5);
      expect(config.minConnections).toBe(1);
      expect(config.connectionTimeout).toBe(30000);
      expect(config.idleTimeout).toBe(600000);
      expect(config.maxLifetime).toBe(3600000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.monitorInterval).toBe(5000);
      expect(config.dbHost).toBe('localhost');
      expect(config.dbPort).toBe(3306);
      expect(config.dbUser).toBe('root');
      expect(config.dbPassword).toBe('default-password');
      expect(config.dbName).toBe('mrwebdefence');
    });
  });

  describe('equals', () => {
    it('同じ値の設定オブジェクトと等しい', () => {
      const config1 = ConnectionPoolConfig.create(
        5,
        1,
        30000,
        600000,
        3600000,
        3,
        1000,
        5000,
        'localhost',
        3306,
        'root',
        'password',
        'mrwebdefence',
      );
      const config2 = ConnectionPoolConfig.create(
        5,
        1,
        30000,
        600000,
        3600000,
        3,
        1000,
        5000,
        'localhost',
        3306,
        'root',
        'password',
        'mrwebdefence',
      );

      expect(config1.equals(config2)).toBe(true);
    });

    it('異なる値の設定オブジェクトと等しくない', () => {
      const config1 = ConnectionPoolConfig.create(
        5,
        1,
        30000,
        600000,
        3600000,
        3,
        1000,
        5000,
        'localhost',
        3306,
        'root',
        'password',
        'mrwebdefence',
      );
      const config2 = ConnectionPoolConfig.create(
        10,
        2,
        60000,
        1200000,
        7200000,
        5,
        2000,
        10000,
        'localhost',
        3306,
        'root',
        'password',
        'mrwebdefence',
      );

      expect(config1.equals(config2)).toBe(false);
    });

    it('異なるMySQL接続情報の設定オブジェクトと等しくない', () => {
      const config1 = ConnectionPoolConfig.create(
        5,
        1,
        30000,
        600000,
        3600000,
        3,
        1000,
        5000,
        'localhost',
        3306,
        'root',
        'password',
        'mrwebdefence',
      );
      const config2 = ConnectionPoolConfig.create(
        5,
        1,
        30000,
        600000,
        3600000,
        3,
        1000,
        5000,
        'other-host',
        3306,
        'root',
        'password',
        'mrwebdefence',
      );

      expect(config1.equals(config2)).toBe(false);
    });
  });
});
