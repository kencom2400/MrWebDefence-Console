/**
 * PasswordHistoryRepository のユニットテスト
 */

import { PasswordHistoryRepository } from './password-history.repository';

describe('PasswordHistoryRepository', () => {
  let repository: PasswordHistoryRepository;

  beforeEach(() => {
    repository = new PasswordHistoryRepository();
  });

  describe('savePasswordHistory', () => {
    it('正常系: パスワード履歴を保存できる', async () => {
      const userId = 'user-1';
      const passwordHash = 'hashed-password-1';

      await repository.savePasswordHistory(userId, passwordHash);

      const history = await repository.getPasswordHistory(userId, 10);
      expect(history).toContain(passwordHash);
    });

    it('正常系: 複数のパスワード履歴を保存できる', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';
      const passwordHash3 = 'hashed-password-3';

      await repository.savePasswordHistory(userId, passwordHash1);
      await repository.savePasswordHistory(userId, passwordHash2);
      await repository.savePasswordHistory(userId, passwordHash3);

      const history = await repository.getPasswordHistory(userId, 10);
      expect(history).toHaveLength(3);
      expect(history).toContain(passwordHash1);
      expect(history).toContain(passwordHash2);
      expect(history).toContain(passwordHash3);
    });

    it('正常系: 異なるユーザーの履歴は分離される', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';

      await repository.savePasswordHistory(userId1, passwordHash1);
      await repository.savePasswordHistory(userId2, passwordHash2);

      const history1 = await repository.getPasswordHistory(userId1, 10);
      const history2 = await repository.getPasswordHistory(userId2, 10);

      expect(history1).toContain(passwordHash1);
      expect(history1).not.toContain(passwordHash2);
      expect(history2).toContain(passwordHash2);
      expect(history2).not.toContain(passwordHash1);
    });
  });

  describe('getPasswordHistory', () => {
    it('正常系: 存在しないユーザーの履歴は空配列を返す', async () => {
      const history = await repository.getPasswordHistory('non-existent-user', 10);
      expect(history).toEqual([]);
    });

    it('正常系: 最新N個の履歴を取得できる', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';
      const passwordHash3 = 'hashed-password-3';
      const passwordHash4 = 'hashed-password-4';
      const passwordHash5 = 'hashed-password-5';

      // 各保存の間に少し時間を置く（順序を保証するため）
      await repository.savePasswordHistory(userId, passwordHash1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash2);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash3);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash4);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash5);

      const history = await repository.getPasswordHistory(userId, 3);
      expect(history).toHaveLength(3);
      // 最新の3個が取得される（順序は最新が先頭）
      expect(history[0]).toBe(passwordHash5);
      expect(history[1]).toBe(passwordHash4);
      expect(history[2]).toBe(passwordHash3);
      expect(history).not.toContain(passwordHash1);
      expect(history).not.toContain(passwordHash2);
    });

    it('正常系: 履歴数が要求数より少ない場合、全履歴を返す', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';

      await repository.savePasswordHistory(userId, passwordHash1);
      await repository.savePasswordHistory(userId, passwordHash2);

      const history = await repository.getPasswordHistory(userId, 10);
      expect(history).toHaveLength(2);
    });
  });

  describe('checkPasswordInHistory', () => {
    it('正常系: 履歴に含まれるパスワードはtrueを返す', async () => {
      const userId = 'user-1';
      const passwordHash = 'hashed-password-1';

      await repository.savePasswordHistory(userId, passwordHash);

      const isInHistory = await repository.checkPasswordInHistory(userId, passwordHash, 10);
      expect(isInHistory).toBe(true);
    });

    it('正常系: 履歴に含まれないパスワードはfalseを返す', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';

      await repository.savePasswordHistory(userId, passwordHash1);

      const isInHistory = await repository.checkPasswordInHistory(userId, passwordHash2, 10);
      expect(isInHistory).toBe(false);
    });

    it('正常系: 指定した履歴数の範囲内でチェックする', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';
      const passwordHash3 = 'hashed-password-3';
      const passwordHash4 = 'hashed-password-4';
      const passwordHash5 = 'hashed-password-5';

      // 各保存の間に少し時間を置く（順序を保証するため）
      await repository.savePasswordHistory(userId, passwordHash1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash2);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash3);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash4);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash5);

      // 最新3個のみチェック
      const isInHistory1 = await repository.checkPasswordInHistory(userId, passwordHash1, 3);
      const isInHistory5 = await repository.checkPasswordInHistory(userId, passwordHash5, 3);

      expect(isInHistory1).toBe(false); // 古い履歴は範囲外
      expect(isInHistory5).toBe(true); // 最新の履歴は範囲内
    });
  });

  describe('deleteOldHistory', () => {
    it('正常系: 古い履歴を削除して最新N個のみ保持する', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';
      const passwordHash3 = 'hashed-password-3';
      const passwordHash4 = 'hashed-password-4';
      const passwordHash5 = 'hashed-password-5';

      // 各保存の間に少し時間を置く（順序を保証するため）
      await repository.savePasswordHistory(userId, passwordHash1);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash2);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash3);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash4);
      await new Promise((resolve) => setTimeout(resolve, 10));
      await repository.savePasswordHistory(userId, passwordHash5);

      await repository.deleteOldHistory(userId, 3);

      const history = await repository.getPasswordHistory(userId, 10);
      expect(history).toHaveLength(3);
      expect(history[0]).toBe(passwordHash5);
      expect(history[1]).toBe(passwordHash4);
      expect(history[2]).toBe(passwordHash3);
      expect(history).not.toContain(passwordHash1);
      expect(history).not.toContain(passwordHash2);
    });

    it('正常系: 存在しないユーザーの履歴削除はエラーにならない', async () => {
      await expect(repository.deleteOldHistory('non-existent-user', 3)).resolves.not.toThrow();
    });

    it('正常系: 履歴数が保持数より少ない場合、全履歴を保持', async () => {
      const userId = 'user-1';
      const passwordHash1 = 'hashed-password-1';
      const passwordHash2 = 'hashed-password-2';

      await repository.savePasswordHistory(userId, passwordHash1);
      await repository.savePasswordHistory(userId, passwordHash2);

      await repository.deleteOldHistory(userId, 10);

      const history = await repository.getPasswordHistory(userId, 10);
      expect(history).toHaveLength(2);
    });
  });
});
