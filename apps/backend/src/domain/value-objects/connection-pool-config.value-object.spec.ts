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
      );

      expect(config.maxConnections).toBe(5);
      expect(config.minConnections).toBe(1);
      expect(config.connectionTimeout).toBe(30000);
      expect(config.idleTimeout).toBe(600000);
      expect(config.maxLifetime).toBe(3600000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });

    it('maxConnectionsが1未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(0, 1, 30000, 600000, 3600000, 3, 1000, 5000),
      ).toThrow(BadRequestException);
      expect(() =>
        ConnectionPoolConfig.create(-1, 1, 30000, 600000, 3600000, 3, 1000, 5000),
      ).toThrow(BadRequestException);
    });

    it('minConnectionsが0未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(5, -1, 30000, 600000, 3600000, 3, 1000, 5000),
      ).toThrow(BadRequestException);
    });

    it('minConnectionsがmaxConnectionsを超える場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(5, 6, 30000, 600000, 3600000, 3, 1000, 5000),
      ).toThrow(BadRequestException);
    });

    it('connectionTimeoutが1未満の場合エラーを投げる', () => {
      expect(() => ConnectionPoolConfig.create(5, 1, 0, 600000, 3600000, 3, 1000, 5000)).toThrow(
        BadRequestException,
      );
      expect(() => ConnectionPoolConfig.create(5, 1, -1, 600000, 3600000, 3, 1000, 5000)).toThrow(
        BadRequestException,
      );
    });

    it('idleTimeoutが1未満の場合エラーを投げる', () => {
      expect(() => ConnectionPoolConfig.create(5, 1, 30000, 0, 3600000, 3, 1000, 5000)).toThrow(
        BadRequestException,
      );
      expect(() => ConnectionPoolConfig.create(5, 1, 30000, -1, 3600000, 3, 1000, 5000)).toThrow(
        BadRequestException,
      );
    });

    it('maxLifetimeが1未満の場合エラーを投げる', () => {
      expect(() => ConnectionPoolConfig.create(5, 1, 30000, 600000, 0, 3, 1000, 5000)).toThrow(
        BadRequestException,
      );
      expect(() => ConnectionPoolConfig.create(5, 1, 30000, 600000, -1, 3, 1000, 5000)).toThrow(
        BadRequestException,
      );
    });

    it('retryAttemptsが0未満の場合エラーを投げる', () => {
      expect(() =>
        ConnectionPoolConfig.create(5, 1, 30000, 600000, 3600000, -1, 1000, 5000),
      ).toThrow(BadRequestException);
    });

    it('retryDelayが1未満の場合エラーを投げる', () => {
      expect(() => ConnectionPoolConfig.create(5, 1, 30000, 600000, 3600000, 3, 0, 5000)).toThrow(
        BadRequestException,
      );
      expect(() => ConnectionPoolConfig.create(5, 1, 30000, 600000, 3600000, 3, -1, 5000)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('fromEnvironment', () => {
    it('環境変数から接続プール設定を作成できる', () => {
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
        DB_POOL_MONITOR_INTERVAL: '10000',
      };

      const config = ConnectionPoolConfig.fromEnvironment();

      expect(config.maxConnections).toBe(10);
      expect(config.minConnections).toBe(2);
      expect(config.connectionTimeout).toBe(60000);
      expect(config.idleTimeout).toBe(1200000);
      expect(config.maxLifetime).toBe(7200000);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryDelay).toBe(2000);
      expect(config.monitorInterval).toBe(10000);

      process.env = originalEnv;
    });

    it('環境変数が設定されていない場合、デフォルト値を使用する', () => {
      const originalEnv = process.env;
      delete process.env.DB_POOL_MAX_CONNECTIONS;
      delete process.env.DB_POOL_MIN_CONNECTIONS;
      delete process.env.DB_POOL_CONNECTION_TIMEOUT;
      delete process.env.DB_POOL_IDLE_TIMEOUT;
      delete process.env.DB_POOL_MAX_LIFETIME;
      delete process.env.DB_POOL_RETRY_ATTEMPTS;
      delete process.env.DB_POOL_RETRY_DELAY;
      delete process.env.DB_POOL_MONITOR_INTERVAL;

      const config = ConnectionPoolConfig.fromEnvironment();

      expect(config.maxConnections).toBe(5);
      expect(config.minConnections).toBe(1);
      expect(config.connectionTimeout).toBe(30000);
      expect(config.idleTimeout).toBe(600000);
      expect(config.maxLifetime).toBe(3600000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);

      process.env = originalEnv;
    });
  });

  describe('equals', () => {
    it('同じ値の設定オブジェクトと等しい', () => {
      const config1 = ConnectionPoolConfig.create(5, 1, 30000, 600000, 3600000, 3, 1000, 5000);
      const config2 = ConnectionPoolConfig.create(5, 1, 30000, 600000, 3600000, 3, 1000, 5000);

      expect(config1.equals(config2)).toBe(true);
    });

    it('異なる値の設定オブジェクトと等しくない', () => {
      const config1 = ConnectionPoolConfig.create(5, 1, 30000, 600000, 3600000, 3, 1000, 5000);
      const config2 = ConnectionPoolConfig.create(10, 2, 60000, 1200000, 7200000, 5, 2000, 10000);

      expect(config1.equals(config2)).toBe(false);
    });
  });
});
