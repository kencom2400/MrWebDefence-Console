/**
 * QrCodeService
 *
 * QRコード生成を行うサービス
 * Infrastructure層に位置し、外部ライブラリ（qrcode）に依存する
 */

import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrCodeService {
  /**
   * OTPAUTH URIからQRコード画像（Data URL）を生成する
   * @param otpauthUri OTPAUTH URI
   * @returns QRコード画像のData URL（PNG形式）
   */
  public async generateDataUrl(otpauthUri: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUri, {
        type: 'image/png',
        errorCorrectionLevel: 'M',
        width: 256,
        margin: 2,
      });
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
