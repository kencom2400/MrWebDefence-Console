/**
 * SetupMfaUseCase
 *
 * MFAセットアップ処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { TotpService } from '../../infrastructure/services/totp.service';
import { QrCodeService } from '../../infrastructure/services/qr-code.service';

export interface SetupMfaResult {
  qrCodeDataUrl: string;
  secret: string; // 一時的に返却（検証後に永続化）
}

@Injectable()
export class SetupMfaUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly totpService: TotpService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  /**
   * MFAセットアップ処理を実行する
   * @param userId ユーザーID
   * @returns QRコードのData URLとシークレット
   * @throws NotFoundException ユーザーが見つからない場合
   * @throws ConflictException MFAが既に有効な場合
   */
  public async execute(userId: string): Promise<SetupMfaResult> {
    // ユーザーを取得
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 既にMFAが有効な場合はエラー
    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled');
    }

    // MFAシークレットを生成
    const secret = this.totpService.generateSecret();

    // OTPAUTH URIを生成
    const otpauthUri = this.totpService.generateKeyUri(secret, user.email, 'MrWebDefence');

    // QRコードを生成
    const qrCodeDataUrl = await this.qrCodeService.generateDataUrl(otpauthUri);

    return {
      qrCodeDataUrl,
      secret, // 一時的に返却（検証後に永続化）
    };
  }
}
