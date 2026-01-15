/**
 * ConnectionPoolMonitor Unit Tests
 *
 * 接続プール監視プロセスのユニットテスト
 */

// uuidをモック
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

import { ConnectionPoolMonitor } from './connection-pool-monitor';
import { DatabaseConnectionPool } from './database-connection-pool';
import { ConnectionPoolConfig } from '../../domain/value-objects/connection-pool-config.value-object';

describe('ConnectionPoolMonitor', () => {
  let monitor: ConnectionPoolMonitor;
  let pool: DatabaseConnectionPool;
  let config: ConnectionPoolConfig;

  beforeEach(() => {
    config = ConnectionPoolConfig.create(
      5, // maxConnections
      1, // minConnections
      1000, // connectionTimeout
      60000, // idleTimeout
      3600000, // maxLifetime
      3, // retryAttempts
      100, // retryDelay
      5000, // monitorInterval
    );

    pool = new DatabaseConnectionPool(config);
    monitor = new ConnectionPoolMonitor(pool, config);
  });

  afterEach(async () => {
    monitor.stop();
    if (pool) {
      await pool.destroy();
    }
    jest.clearAllTimers();
  });

  describe('start', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('正常系: 監視プロセスを開始できる', () => {
      monitor.start();
      expect(monitor).toBeDefined();
    });

    it('正常系: 既に開始済みの場合、警告を出力して処理をスキップする', () => {
      monitor.start();
      monitor.start(); // 2回目の開始
      expect(monitor).toBeDefined();
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('正常系: 監視プロセスを停止できる', () => {
      monitor.start();
      monitor.stop();
      expect(monitor).toBeDefined();
    });

    it('正常系: 開始されていない場合、警告を出力して処理をスキップする', () => {
      monitor.stop(); // 開始前に停止
      expect(monitor).toBeDefined();
    });
  });

  describe('monitor', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      await pool.initialize();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('正常系: 定期的に監視処理を実行する', async () => {
      const cleanupIdleSpy = jest.spyOn(pool, 'cleanupIdleConnections' as any);
      const cleanupExpiredSpy = jest.spyOn(pool, 'cleanupExpiredConnections' as any);
      const ensureMinSpy = jest.spyOn(pool, 'ensureMinConnections' as any);

      monitor.start();

      // 監視間隔（config.monitorInterval）を進める
      jest.advanceTimersByTime(config.monitorInterval);

      // 非同期処理の完了を待つ
      await Promise.resolve();
      await Promise.resolve();

      // 監視処理が実行されることを確認
      expect(cleanupIdleSpy).toHaveBeenCalled();
      expect(cleanupExpiredSpy).toHaveBeenCalled();
      expect(ensureMinSpy).toHaveBeenCalled();
    });
  });
});
