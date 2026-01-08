/**
 * GenerateBackupCodesUseCase
 *
 * バックアップコード生成処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject } from '@nestjs/common';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { BackupCodeService } from '../../infrastructure/services/backup-code.service';

export interface GenerateBackupCodesResult {
  codes: string[]; // 平文のバックアップコード（一度だけ表示）
}

@Injectable()
export class GenerateBackupCodesUseCase {
  constructor(
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
    @Inject('BackupCodeService')
    private readonly backupCodeService: BackupCodeService,
  ) {}

  /**
   * バックアップコード生成処理を実行する
   * @param userId ユーザーID
   * @returns 生成されたバックアップコード（平文）
   * @throws Error ユーザーが見つからない場合
   */
  public async execute(userId: string): Promise<GenerateBackupCodesResult> {
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
