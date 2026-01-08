/**
 * DisableMfaUseCase
 *
 * MFA無効化処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';

@Injectable()
export class DisableMfaUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * MFA無効化処理を実行する
   * @param userId ユーザーID
   * @param password パスワード（確認用）
   * @returns 成功時true
   * @throws Error ユーザーが見つからない場合、パスワードが一致しない場合、またはMFAが既に無効な場合
   */
  public async execute(userId: string, password: string): Promise<void> {
    // ユーザーを取得
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 既にMFAが無効な場合はエラー
    if (!user.mfaEnabled) {
      throw new Error('MFA is already disabled');
    }

    // パスワード確認
    const isPasswordValid = await this.passwordService.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // ユーザーのMFAを無効化
    const updatedUser = user.disableMfa();
    await this.userRepository.save(updatedUser);

    // MFAシークレットを削除
    await this.mfaRepository.deleteSecret(userId);

    // バックアップコードを削除
    await this.mfaRepository.deleteBackupCodes(userId);
  }
}
