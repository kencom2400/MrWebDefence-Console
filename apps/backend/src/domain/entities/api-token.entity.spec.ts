/**
 * ApiToken Entity テスト
 */

import { ApiToken } from './api-token.entity';
import { randomUUID } from 'crypto';

describe('ApiToken', () => {
  const validId = randomUUID();
  const validName = 'WAF Engine Production Token';
  const validDescription = 'Production環境のWAFエンジン用トークン';
  const validTokenHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // bcryptハッシュ
  const validTokenPrefix = 'waf_';
  const validCreatedBy = randomUUID();
  const futureDate = new Date(Date.now() + 86400000); // 1日後

  describe('create', () => {
    it('有効な値でAPIトークンを作成できる', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );
      expect(token.id).toBe(validId);
      expect(token.name).toBe(validName);
      expect(token.description).toBe(validDescription);
      expect(token.tokenHash).toBe(validTokenHash);
      expect(token.tokenPrefix).toBe(validTokenPrefix);
      expect(token.expiresAt).toBeNull();
      expect(token.revokedAt).toBeNull();
      expect(token.createdAt).toBeInstanceOf(Date);
      expect(token.createdBy).toBe(validCreatedBy);
    });

    it('有効期限を設定してAPIトークンを作成できる', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        futureDate,
        validCreatedBy,
      );
      expect(token.expiresAt).toEqual(futureDate);
    });

    it('説明なしでAPIトークンを作成できる', () => {
      const token = ApiToken.create(
        validId,
        validName,
        null,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );
      expect(token.description).toBeNull();
    });

    it('IDが空の場合エラーを投げる', () => {
      expect(() =>
        ApiToken.create(
          '',
          validName,
          validDescription,
          validTokenHash,
          validTokenPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('API token ID cannot be empty');
    });

    it('名前が空の場合エラーを投げる', () => {
      expect(() =>
        ApiToken.create(
          validId,
          '',
          validDescription,
          validTokenHash,
          validTokenPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('API token name cannot be empty');
    });

    it('名前が255文字を超える場合エラーを投げる', () => {
      const longName = 'a'.repeat(256);
      expect(() =>
        ApiToken.create(
          validId,
          longName,
          validDescription,
          validTokenHash,
          validTokenPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('API token name must be 255 characters or less');
    });

    it('説明が1000文字を超える場合エラーを投げる', () => {
      const longDescription = 'a'.repeat(1001);
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          longDescription,
          validTokenHash,
          validTokenPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('Description must be 1000 characters or less');
    });

    it('トークンハッシュが空の場合エラーを投げる', () => {
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          '',
          validTokenPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('Token hash cannot be empty');
    });

    it('トークンハッシュが60文字未満の場合エラーを投げる', () => {
      const shortHash = 'a'.repeat(59);
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          shortHash,
          validTokenPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('Token hash appears to be invalid');
    });

    it('トークンプレフィックスが空の場合エラーを投げる', () => {
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          validTokenHash,
          '',
          null,
          validCreatedBy,
        ),
      ).toThrow('Token prefix cannot be empty');
    });

    it('トークンプレフィックスが10文字を超える場合エラーを投げる', () => {
      const longPrefix = 'a'.repeat(11);
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          validTokenHash,
          longPrefix,
          null,
          validCreatedBy,
        ),
      ).toThrow('Token prefix must be 10 characters or less');
    });

    it('トークンプレフィックスに無効な文字が含まれる場合エラーを投げる', () => {
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          validTokenHash,
          'waf-',
          null,
          validCreatedBy,
        ),
      ).toThrow('Token prefix must contain only alphanumeric characters and underscores');
    });

    it('有効期限が過去の場合エラーを投げる', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1日前
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          validTokenHash,
          validTokenPrefix,
          pastDate,
          validCreatedBy,
        ),
      ).toThrow('Expires at must be in the future');
    });

    it('作成者IDが空の場合エラーを投げる', () => {
      expect(() =>
        ApiToken.create(
          validId,
          validName,
          validDescription,
          validTokenHash,
          validTokenPrefix,
          null,
          '',
        ),
      ).toThrow('Created by cannot be empty');
    });
  });

  describe('reconstruct', () => {
    it('既存のAPIトークンを再構築できる', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const revokedAt = new Date('2026-01-03T00:00:00.000Z');

      const token = ApiToken.reconstruct(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        futureDate,
        revokedAt,
        createdAt,
        validCreatedBy,
      );

      expect(token.id).toBe(validId);
      expect(token.name).toBe(validName);
      expect(token.description).toBe(validDescription);
      expect(token.tokenHash).toBe(validTokenHash);
      expect(token.tokenPrefix).toBe(validTokenPrefix);
      expect(token.expiresAt).toEqual(futureDate);
      expect(token.revokedAt).toEqual(revokedAt);
      expect(token.createdAt).toEqual(createdAt);
      expect(token.createdBy).toBe(validCreatedBy);
    });
  });

  describe('revoke', () => {
    it('有効なトークンを無効化できる', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      const revokedToken = token.revoke();

      expect(revokedToken.revokedAt).toBeInstanceOf(Date);
      expect(revokedToken.revokedAt).not.toBeNull();
      expect(revokedToken.id).toBe(token.id);
    });

    it('既に無効化されているトークンを無効化しようとするとエラーを投げる', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      const revokedToken = token.revoke();

      expect(() => revokedToken.revoke()).toThrow('API token is already revoked');
    });
  });

  describe('isValid', () => {
    it('有効期限がなく、無効化されていないトークンは有効', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      expect(token.isValid()).toBe(true);
    });

    it('有効期限が未来で、無効化されていないトークンは有効', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        futureDate,
        validCreatedBy,
      );

      expect(token.isValid()).toBe(true);
    });

    it('有効期限切れのトークンは無効', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1日前
      const token = ApiToken.reconstruct(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        pastDate,
        null,
        new Date(),
        validCreatedBy,
      );

      expect(token.isValid()).toBe(false);
    });

    it('無効化されたトークンは無効', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      const revokedToken = token.revoke();

      expect(revokedToken.isValid()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('有効期限がないトークンは期限切れではない', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      expect(token.isExpired()).toBe(false);
    });

    it('有効期限が未来のトークンは期限切れではない', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        futureDate,
        validCreatedBy,
      );

      expect(token.isExpired()).toBe(false);
    });

    it('有効期限が過去のトークンは期限切れ', () => {
      const pastDate = new Date(Date.now() - 86400000); // 1日前
      const token = ApiToken.reconstruct(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        pastDate,
        null,
        new Date(),
        validCreatedBy,
      );

      expect(token.isExpired()).toBe(true);
    });
  });

  describe('isRevoked', () => {
    it('無効化されていないトークンは無効化されていない', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      expect(token.isRevoked()).toBe(false);
    });

    it('無効化されたトークンは無効化されている', () => {
      const token = ApiToken.create(
        validId,
        validName,
        validDescription,
        validTokenHash,
        validTokenPrefix,
        null,
        validCreatedBy,
      );

      const revokedToken = token.revoke();

      expect(revokedToken.isRevoked()).toBe(true);
    });
  });
});
