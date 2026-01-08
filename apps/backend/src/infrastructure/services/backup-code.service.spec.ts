/**
 * BackupCodeService Test
 *
 * バックアップコードサービスのテスト
 */

import { BackupCodeService } from './backup-code.service';

describe('BackupCodeService', () => {
  let backupCodeService: BackupCodeService;

  beforeEach(() => {
    backupCodeService = new BackupCodeService();
  });

  describe('generateCodes', () => {
    it('正常系: 10個のバックアップコードを生成する', () => {
      const codes = backupCodeService.generateCodes();
      expect(codes).toHaveLength(10);
    });

    it('正常系: 生成されたコードが正しい形式である', () => {
      const codes = backupCodeService.generateCodes();
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });

    it('正常系: 毎回異なるコードを生成する', () => {
      const codes1 = backupCodeService.generateCodes();
      const codes2 = backupCodeService.generateCodes();
      // 全てのコードが異なることを確認（確率的に異なる）
      const allCodes = [...codes1, ...codes2];
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBeGreaterThan(10); // 少なくとも一部は異なる
    });
  });

  describe('hash', () => {
    it('正常系: バックアップコードをハッシュ化する', async () => {
      const code = 'ABCD-1234';
      const hash = await backupCodeService.hash(code);
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/); // bcryptハッシュの形式
    });

    it('正常系: 同じコードから異なるハッシュを生成する（saltのため）', async () => {
      const code = 'ABCD-1234';
      const hash1 = await backupCodeService.hash(code);
      const hash2 = await backupCodeService.hash(code);
      // bcryptは毎回異なるハッシュを生成する（saltのため）
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('正常系: 正しいバックアップコードを検証する', async () => {
      const code = 'ABCD-1234';
      const hash = await backupCodeService.hash(code);
      const isValid = await backupCodeService.verify(code, hash);
      expect(isValid).toBe(true);
    });

    it('異常系: 間違ったバックアップコードを検証する', async () => {
      const code = 'ABCD-1234';
      const wrongCode = 'EFGH-5678';
      const hash = await backupCodeService.hash(code);
      const isValid = await backupCodeService.verify(wrongCode, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('hashCodes', () => {
    it('正常系: 複数のバックアップコードをハッシュ化する', async () => {
      const codes = ['ABCD-1234', 'EFGH-5678', 'IJKL-9012'];
      const hashes = await backupCodeService.hashCodes(codes);
      expect(hashes).toHaveLength(3);
      hashes.forEach((hash) => {
        expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
      });
    });
  });

  describe('getCodeCount', () => {
    it('正常系: コード数を取得する', () => {
      const count = backupCodeService.getCodeCount();
      expect(count).toBe(10);
    });
  });
});

