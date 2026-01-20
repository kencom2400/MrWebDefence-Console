/**
 * ApiTokenService Test
 *
 * APIトークンサービスのテスト
 */

import { ApiTokenService } from './api-token.service';

describe('ApiTokenService', () => {
  let apiTokenService: ApiTokenService;

  beforeEach(() => {
    apiTokenService = new ApiTokenService(10);
  });

  describe('generateSecret', () => {
    it('正常系: ランダムなシークレットを生成する', () => {
      const secret = apiTokenService.generateSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
    });

    it('正常系: 毎回異なるシークレットを生成する', () => {
      const secret1 = apiTokenService.generateSecret();
      const secret2 = apiTokenService.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('hashToken', () => {
    it('正常系: シークレットをハッシュ化する', async () => {
      const secret = 'test-secret';
      const hash = await apiTokenService.hashToken(secret);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/); // bcryptハッシュの形式
    });

    it('正常系: 同じシークレットから異なるハッシュを生成する（saltのため）', async () => {
      const secret = 'test-secret';
      const hash1 = await apiTokenService.hashToken(secret);
      const hash2 = await apiTokenService.hashToken(secret);
      // bcryptは毎回異なるハッシュを生成する（saltのため）
      expect(hash1).not.toBe(hash2);
    });

    it('異常系: 空のシークレットをハッシュ化しようとするとエラーを投げる', async () => {
      await expect(apiTokenService.hashToken('')).rejects.toThrow('Secret cannot be empty');
      await expect(apiTokenService.hashToken('   ')).rejects.toThrow('Secret cannot be empty');
    });
  });

  describe('verifyToken', () => {
    it('正常系: 正しいシークレットを検証する', async () => {
      const secret = 'test-secret';
      const hash = await apiTokenService.hashToken(secret);
      const isValid = await apiTokenService.verifyToken(secret, hash);
      expect(isValid).toBe(true);
    });

    it('異常系: 間違ったシークレットを検証するとfalseを返す', async () => {
      const secret = 'test-secret';
      const hash = await apiTokenService.hashToken(secret);
      const isValid = await apiTokenService.verifyToken('wrong-secret', hash);
      expect(isValid).toBe(false);
    });

    it('異常系: 空のシークレットを検証するとfalseを返す', async () => {
      const hash = await apiTokenService.hashToken('test-secret');
      const isValid = await apiTokenService.verifyToken('', hash);
      expect(isValid).toBe(false);
    });

    it('異常系: 空のハッシュを検証するとfalseを返す', async () => {
      const isValid = await apiTokenService.verifyToken('test-secret', '');
      expect(isValid).toBe(false);
    });
  });

  describe('extractPrefix', () => {
    it('正常系: フルトークンからプレフィックスを抽出する', () => {
      const fullToken = 'waf_abc123def456';
      const prefix = apiTokenService.extractPrefix(fullToken);
      expect(prefix).toBe('waf_');
    });

    it('正常系: 異なるプレフィックスを抽出できる', () => {
      const fullToken = 'test_xyz789';
      const prefix = apiTokenService.extractPrefix(fullToken);
      expect(prefix).toBe('test_');
    });

    it('異常系: 空のフルトークンからプレフィックスを抽出しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.extractPrefix('')).toThrow('Full token cannot be empty');
    });

    it('異常系: プレフィックスがないフルトークンから抽出しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.extractPrefix('notoken')).toThrow(
        'Invalid token format: prefix not found',
      );
    });
  });

  describe('extractSecret', () => {
    it('正常系: フルトークンからシークレット部分を抽出する', () => {
      const fullToken = 'waf_abc123def456';
      const prefix = 'waf_';
      const secret = apiTokenService.extractSecret(fullToken, prefix);
      expect(secret).toBe('abc123def456');
    });

    it('異常系: 空のフルトークンからシークレットを抽出しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.extractSecret('', 'waf_')).toThrow('Full token cannot be empty');
    });

    it('異常系: 空のプレフィックスでシークレットを抽出しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.extractSecret('waf_abc123', '')).toThrow(
        'Prefix cannot be empty',
      );
    });

    it('異常系: プレフィックスが一致しないフルトークンから抽出しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.extractSecret('waf_abc123', 'test_')).toThrow(
        'Full token does not start with the specified prefix',
      );
    });
  });

  describe('buildFullToken', () => {
    it('正常系: プレフィックスとシークレットを結合してフルトークンを作成する', () => {
      const prefix = 'waf_';
      const secret = 'abc123def456';
      const fullToken = apiTokenService.buildFullToken(prefix, secret);
      expect(fullToken).toBe('waf_abc123def456');
    });

    it('正常系: プレフィックスの末尾にアンダースコアがない場合は追加する', () => {
      const prefix = 'waf';
      const secret = 'abc123def456';
      const fullToken = apiTokenService.buildFullToken(prefix, secret);
      expect(fullToken).toBe('waf_abc123def456');
    });

    it('異常系: 空のプレフィックスでフルトークンを作成しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.buildFullToken('', 'abc123')).toThrow('Prefix cannot be empty');
    });

    it('異常系: 空のシークレットでフルトークンを作成しようとするとエラーを投げる', () => {
      expect(() => apiTokenService.buildFullToken('waf_', '')).toThrow('Secret cannot be empty');
    });
  });

  describe('getDefaultPrefix', () => {
    it('正常系: デフォルトのプレフィックスを取得する', () => {
      const prefix = apiTokenService.getDefaultPrefix();
      expect(prefix).toBe('waf_');
    });
  });
});
