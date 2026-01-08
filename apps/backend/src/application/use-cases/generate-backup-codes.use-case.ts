/**
 * GenerateBackupCodesUseCase
 *
 * バックアップコード生成処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { BackupCodeService } from '../../infrastructure/services/backup-code.service';

export interface GenerateBackupCodesResult {
  codes: string[]; // 平文のバックアップコード（一度だけ表示）
}

@Injectable()
export class GenerateBackupCodesUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
    private readonly backupCodeService: BackupCodeService,
  ) {}

  /**
   * バックアップコード生成処理を実行する
   * @param userId ユーザーID
   * @returns 生成されたバックアップコード（平文）
   * @throws NotFoundException ユーザーが見つからない場合
   */
  public async execute(userId: string): Promise<GenerateBackupCodesResult> {
    // ユーザーの存在確認
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // バックアップコードを生成
    const codes = this.backupCodeService.generateCodes();

    // バックアップコードをハッシュ化
    const codeHashes = await this.backupCodeService.hashCodes(codes);

    // バックアップコードを永続化
    await this.mfaRepository.saveBackupCodes(userId, codeHashes);

    return {
      codes, // 平文のコードを返却（一度だけ表示）
    };
  }
}
