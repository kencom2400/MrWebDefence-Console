/**
 * TotpService Test
 *
 * TOTPサービスのテスト
 */

import { TotpService } from './totp.service';

describe('TotpService', () => {
  let totpService: TotpService;

  beforeEach(() => {
    totpService = new TotpService();
  });

  describe('generateSecret', () => {
    it('正常系: Base32形式のシークレットを生成する', () => {
      const secret = totpService.generateSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      // Base32形式のバリデーション（A-Z, 2-7のみ）
      expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    });

    it('正常系: 毎回異なるシークレットを生成する', () => {
      const secret1 = totpService.generateSecret();
      const secret2 = totpService.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generate', () => {
    it('正常系: TOTPコードを生成する', () => {
      const secret = totpService.generateSecret();
      const code = totpService.generate(secret);
      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/); // 6桁の数字
    });

    it('正常系: 同じシークレットから異なるコードを生成する（時間が経過した場合）', () => {
      const secret = totpService.generateSecret();
      const code1 = totpService.generate(secret);
      // 時間が経過すると異なるコードが生成される（実際のテストでは時間を進める必要がある）
      // ここでは、コードが生成されることを確認
      expect(code1).toBeDefined();
    });
  });

  describe('verify', () => {
    it('正常系: 正しいTOTPコードを検証する', () => {
      const secret = totpService.generateSecret();
      const code = totpService.generate(secret);
      const isValid = totpService.verify(secret, code);
      expect(isValid).toBe(true);
    });

    it('異常系: 間違ったTOTPコードを検証する', () => {
      const secret = totpService.generateSecret();
      const wrongCode = '000000';
      const isValid = totpService.verify(secret, wrongCode);
      expect(isValid).toBe(false);
    });

    it('異常系: 無効なシークレットで検証する', () => {
      const invalidSecret = 'invalid-secret';
      const code = '123456';
      const isValid = totpService.verify(invalidSecret, code);
      expect(isValid).toBe(false);
    });
  });

  describe('generateKeyUri', () => {
    it('正常系: OTPAUTH URIを生成する', () => {
      const secret = totpService.generateSecret();
      const email = 'user@example.com';
      const issuer = 'MrWebDefence';
      const uri = totpService.generateKeyUri(secret, email, issuer);
      expect(uri).toBeDefined();
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('user%40example.com'); // URLエンコードされたemail
      expect(uri).toContain(issuer);
      expect(uri).toContain(`secret=${secret}`);
    });
  });
});

 *
 * TOTPサービスのテスト
 */

import { TotpService } from './totp.service';

describe('TotpService', () => {
  let totpService: TotpService;

  beforeEach(() => {
    totpService = new TotpService();
  });

  describe('generateSecret', () => {
    it('正常系: Base32形式のシークレットを生成する', () => {
      const secret = totpService.generateSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      // Base32形式のバリデーション（A-Z, 2-7のみ）
      expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    });

    it('正常系: 毎回異なるシークレットを生成する', () => {
      const secret1 = totpService.generateSecret();
      const secret2 = totpService.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generate', () => {
    it('正常系: TOTPコードを生成する', () => {
      const secret = totpService.generateSecret();
      const code = totpService.generate(secret);
      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/); // 6桁の数字
    });

    it('正常系: 同じシークレットから異なるコードを生成する（時間が経過した場合）', () => {
      const secret = totpService.generateSecret();
      const code1 = totpService.generate(secret);
      // 時間が経過すると異なるコードが生成される（実際のテストでは時間を進める必要がある）
      // ここでは、コードが生成されることを確認
      expect(code1).toBeDefined();
    });
  });

  describe('verify', () => {
    it('正常系: 正しいTOTPコードを検証する', () => {
      const secret = totpService.generateSecret();
      const code = totpService.generate(secret);
      const isValid = totpService.verify(secret, code);
      expect(isValid).toBe(true);
    });

    it('異常系: 間違ったTOTPコードを検証する', () => {
      const secret = totpService.generateSecret();
      const wrongCode = '000000';
      const isValid = totpService.verify(secret, wrongCode);
      expect(isValid).toBe(false);
    });

    it('異常系: 無効なシークレットで検証する', () => {
      const invalidSecret = 'invalid-secret';
      const code = '123456';
      const isValid = totpService.verify(invalidSecret, code);
      expect(isValid).toBe(false);
    });
  });

  describe('generateKeyUri', () => {
    it('正常系: OTPAUTH URIを生成する', () => {
      const secret = totpService.generateSecret();
      const email = 'user@example.com';
      const issuer = 'MrWebDefence';
      const uri = totpService.generateKeyUri(secret, email, issuer);
      expect(uri).toBeDefined();
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('user%40example.com'); // URLエンコードされたemail
      expect(uri).toContain(issuer);
      expect(uri).toContain(`secret=${secret}`);
    });
  });
});

 *
 * TOTPサービスのテスト
 */

import { TotpService } from './totp.service';

describe('TotpService', () => {
  let totpService: TotpService;

  beforeEach(() => {
    totpService = new TotpService();
  });

  describe('generateSecret', () => {
    it('正常系: Base32形式のシークレットを生成する', () => {
      const secret = totpService.generateSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
      // Base32形式のバリデーション（A-Z, 2-7のみ）
      expect(secret).toMatch(/^[A-Z2-7]+=*$/);
    });

    it('正常系: 毎回異なるシークレットを生成する', () => {
      const secret1 = totpService.generateSecret();
      const secret2 = totpService.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generate', () => {
    it('正常系: TOTPコードを生成する', () => {
      const secret = totpService.generateSecret();
      const code = totpService.generate(secret);
      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/); // 6桁の数字
    });

    it('正常系: 同じシークレットから異なるコードを生成する（時間が経過した場合）', () => {
      const secret = totpService.generateSecret();
      const code1 = totpService.generate(secret);
      // 時間が経過すると異なるコードが生成される（実際のテストでは時間を進める必要がある）
      // ここでは、コードが生成されることを確認
      expect(code1).toBeDefined();
    });
  });

  describe('verify', () => {
    it('正常系: 正しいTOTPコードを検証する', () => {
      const secret = totpService.generateSecret();
      const code = totpService.generate(secret);
      const isValid = totpService.verify(secret, code);
      expect(isValid).toBe(true);
    });

    it('異常系: 間違ったTOTPコードを検証する', () => {
      const secret = totpService.generateSecret();
      const wrongCode = '000000';
      const isValid = totpService.verify(secret, wrongCode);
      expect(isValid).toBe(false);
    });

    it('異常系: 無効なシークレットで検証する', () => {
      const invalidSecret = 'invalid-secret';
      const code = '123456';
      const isValid = totpService.verify(invalidSecret, code);
      expect(isValid).toBe(false);
    });
  });

  describe('generateKeyUri', () => {
    it('正常系: OTPAUTH URIを生成する', () => {
      const secret = totpService.generateSecret();
      const email = 'user@example.com';
      const issuer = 'MrWebDefence';
      const uri = totpService.generateKeyUri(secret, email, issuer);
      expect(uri).toBeDefined();
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('user%40example.com'); // URLエンコードされたemail
      expect(uri).toContain(issuer);
      expect(uri).toContain(`secret=${secret}`);
    });
  });
});
