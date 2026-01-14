/**
 * Connection Unit Tests
 *
 * データベース接続のユニットテスト
 */

import { Connection } from './connection';

// uuidをモック（各呼び出しで異なるIDを返す）
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${++uuidCounter}`),
}));

describe('Connection', () => {
  let connection: Connection;

  beforeEach(() => {
    connection = new Connection();
  });

  describe('constructor', () => {
    it('正常系: 接続を作成できる', () => {
      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.createdAt).toBeInstanceOf(Date);
      expect(connection.lastUsedAt).toBeInstanceOf(Date);
    });

    it('正常系: 各接続は異なるIDを持つ', () => {
      const connection1 = new Connection();
      const connection2 = new Connection();

      expect(connection1.id).not.toBe(connection2.id);
    });
  });

  describe('isValid', () => {
    it('正常系: 閉じられていない接続は有効', async () => {
      const isValid = await connection.isValid();
      expect(isValid).toBe(true);
    });

    it('正常系: 閉じられた接続は無効', async () => {
      await connection.close();
      const isValid = await connection.isValid();
      expect(isValid).toBe(false);
    });
  });

  describe('close', () => {
    it('正常系: 接続を閉じることができる', async () => {
      await connection.close();
      expect(connection.isClosed()).toBe(true);
    });

    it('正常系: 複数回閉じてもエラーが発生しない', async () => {
      await connection.close();
      await connection.close();
      expect(connection.isClosed()).toBe(true);
    });
  });

  describe('updateLastUsedAt', () => {
    it('正常系: 最終使用日時を更新できる', () => {
      const originalLastUsedAt = connection.lastUsedAt;

      // 少し待ってから更新
      setTimeout(() => {
        connection.updateLastUsedAt();
        expect(connection.lastUsedAt.getTime()).toBeGreaterThan(originalLastUsedAt.getTime());
      }, 10);
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
