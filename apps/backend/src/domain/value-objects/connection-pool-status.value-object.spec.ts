/**
 * ConnectionPoolStatus Value Object テスト
 */

import { ConnectionPoolStatus } from './connection-pool-status.value-object';

describe('ConnectionPoolStatus', () => {
  describe('create', () => {
    it('有効な値で接続プール状態を作成できる', () => {
      const status = ConnectionPoolStatus.create(2, 3, 0, 1, 5);

      expect(status.activeConnections).toBe(2);
      expect(status.idleConnections).toBe(3);
      expect(status.totalConnections).toBe(5);
      expect(status.waitingRequests).toBe(0);
      expect(status.isHealthy).toBe(true);
    });

    it('最小接続数未満の場合、isHealthyがfalseになる', () => {
      const status = ConnectionPoolStatus.create(0, 0, 0, 1, 5);

      expect(status.totalConnections).toBe(0);
      expect(status.isHealthy).toBe(false);
    });

    it('最大接続数を超える場合、isHealthyがfalseになる', () => {
      const status = ConnectionPoolStatus.create(3, 3, 0, 1, 5);

      expect(status.totalConnections).toBe(6);
      expect(status.isHealthy).toBe(false);
    });

    it('最小接続数以上、最大接続数以下の場合、isHealthyがtrueになる', () => {
      const status = ConnectionPoolStatus.create(2, 2, 0, 1, 5);

      expect(status.totalConnections).toBe(4);
      expect(status.isHealthy).toBe(true);
    });

    it('待機中のリクエスト数を正しく反映する', () => {
      const status = ConnectionPoolStatus.create(2, 3, 5, 1, 10);

      expect(status.waitingRequests).toBe(5);
    });
  });

  describe('equals', () => {
    it('同じ値の状態オブジェクトと等しい', () => {
      const status1 = ConnectionPoolStatus.create(2, 3, 0, 1, 5);
      const status2 = ConnectionPoolStatus.create(2, 3, 0, 1, 5);

      expect(status1.equals(status2)).toBe(true);
    });

    it('異なる値の状態オブジェクトと等しくない', () => {
      const status1 = ConnectionPoolStatus.create(2, 3, 0, 1, 5);
      const status2 = ConnectionPoolStatus.create(3, 2, 1, 1, 5);

      expect(status1.equals(status2)).toBe(false);
    });
  });
});
