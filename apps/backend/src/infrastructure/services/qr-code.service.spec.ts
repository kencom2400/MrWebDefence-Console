/**
 * QrCodeService Test
 *
 * QRコードサービスのテスト
 */

import { QrCodeService } from './qr-code.service';

describe('QrCodeService', () => {
  let qrCodeService: QrCodeService;

  beforeEach(() => {
    qrCodeService = new QrCodeService();
  });

  describe('generateDataUrl', () => {
    it('正常系: OTPAUTH URIからQRコードのData URLを生成する', async () => {
      const otpauthUri =
        'otpauth://totp/MrWebDefence:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MrWebDefence';
      const dataUrl = await qrCodeService.generateDataUrl(otpauthUri);
      expect(dataUrl).toBeDefined();
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('正常系: 生成されたData URLが有効なBase64文字列である', async () => {
      const otpauthUri =
        'otpauth://totp/MrWebDefence:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MrWebDefence';
      const dataUrl = await qrCodeService.generateDataUrl(otpauthUri);
      const base64Data = dataUrl.replace('data:image/png;base64,', '');
      // Base64文字列のバリデーション
      expect(base64Data).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('異常系: 無効なURIでエラーを投げる', async () => {
      const invalidUri = '';
      await expect(qrCodeService.generateDataUrl(invalidUri)).rejects.toThrow();
    });
  });
});
