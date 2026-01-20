/**
 * Connection Unit Tests
 *
 * データベース接続のユニットテスト
 */

import { Connection } from './connection';
import { PoolConnection } from 'mysql2/promise';

// uuidをモック（各呼び出しで異なるIDを返す）
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${++uuidCounter}`),
}));

describe('Connection', () => {
  let connection: Connection;
  let mockMysqlConnection: jest.Mocked<PoolConnection>;

  beforeEach(() => {
    // MySQL接続をモック
    mockMysqlConnection = {
      ping: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PoolConnection>;

    connection = new Connection(mockMysqlConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('正常系: 接続を作成できる', () => {
      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.createdAt).toBeInstanceOf(Date);
      expect(connection.lastUsedAt).toBeInstanceOf(Date);
    });

    it('正常系: 各接続は異なるIDを持つ', () => {
      const mockConnection1 = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      } as unknown as jest.Mocked<PoolConnection>;
      const mockConnection2 = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      } as unknown as jest.Mocked<PoolConnection>;

      const connection1 = new Connection(mockConnection1);
      const connection2 = new Connection(mockConnection2);

      expect(connection1.id).not.toBe(connection2.id);
    });
  });

  describe('isValid', () => {
    it('正常系: 閉じられていない接続は有効', async () => {
      mockMysqlConnection.ping.mockResolvedValue(undefined);
      const isValid = await connection.isValid();
      expect(isValid).toBe(true);
      expect(mockMysqlConnection.ping).toHaveBeenCalled();
    });

    it('正常系: 閉じられた接続は無効', async () => {
      await connection.close();
      const isValid = await connection.isValid();
      expect(isValid).toBe(false);
    });

    it('異常系: pingが失敗した場合は無効', async () => {
      mockMysqlConnection.ping.mockRejectedValue(new Error('Connection lost'));
      const isValid = await connection.isValid();
      expect(isValid).toBe(false);
    });
  });

  describe('close', () => {
    it('正常系: 接続を閉じることができる', async () => {
      await connection.close();
      expect(connection.isClosed()).toBe(true);
      expect(mockMysqlConnection.release).toHaveBeenCalled();
    });

    it('正常系: 複数回閉じてもエラーが発生しない', async () => {
      await connection.close();
      await connection.close();
      expect(connection.isClosed()).toBe(true);
      // releaseは1回だけ呼ばれる
      expect(mockMysqlConnection.release).toHaveBeenCalledTimes(1);
    });

    it('異常系: releaseが失敗した場合はエラーをスロー', async () => {
      const releaseError = new Error('Release failed');
      (mockMysqlConnection.release as jest.Mock).mockRejectedValue(releaseError);
      await expect(connection.close()).rejects.toThrow('Release failed');
      expect(connection.isClosed()).toBe(true);
    });
  });

  describe('updateLastUsedAt', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('正常系: 最終使用日時を更新できる', () => {
      const originalLastUsedAt = connection.lastUsedAt;

      jest.advanceTimersByTime(10);

      connection.updateLastUsedAt();
      expect(connection.lastUsedAt.getTime()).toBeGreaterThan(originalLastUsedAt.getTime());
    });
  });

  describe('isClosed', () => {
    it('正常系: 閉じられていない接続はfalseを返す', () => {
      expect(connection.isClosed()).toBe(false);
    });

    it('正常系: 閉じられた接続はtrueを返す', async () => {
      await connection.close();
      expect(connection.isClosed()).toBe(true);
    });
  });
});
