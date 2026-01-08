/**
 * VerifyMfaUseCase
 *
 * MFA検証処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { TotpService } from '../../infrastructure/services/totp.service';
import { BackupCodeService } from '../../infrastructure/services/backup-code.service';
import { GenerateBackupCodesUseCase } from './generate-backup-codes.use-case';
import { BackupCode } from '../../domain/value-objects/backup-code.value-object';

export enum MfaVerificationType {
  TOTP = 'TOTP',
  BACKUP_CODE = 'BACKUP_CODE',
}

export enum MfaVerificationContext {
  SETUP = 'SETUP', // セットアップ時の検証
  LOGIN = 'LOGIN', // ログイン時の検証
}

export interface VerifyMfaResult {
  success: boolean;
  backupCodes?: string[]; // セットアップ検証成功時のみ返却
}

@Injectable()
export class VerifyMfaUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
    @Inject('TotpService')
    private readonly totpService: TotpService,
    @Inject('BackupCodeService')
    private readonly backupCodeService: BackupCodeService,
    @Inject('GenerateBackupCodesUseCase')
    private readonly generateBackupCodesUseCase: GenerateBackupCodesUseCase,
  ) {}

  /**
   * MFA検証処理を実行する
   * @param userId ユーザーID
   * @param code 検証コード（TOTPコードまたはバックアップコード）
   * @param type 検証タイプ（TOTPまたはバックアップコード）
   * @param context 検証コンテキスト（SETUPまたはLOGIN）
   * @param secret 一時的なシークレット（SETUP時のみ使用）
   * @returns 検証結果
   * @throws Error ユーザーが見つからない場合、または検証失敗時
   */
  public async execute(
    userId: string,
    code: string,
    type: MfaVerificationType,
    context: MfaVerificationContext,
    secret?: string,
  ): Promise<VerifyMfaResult> {
    // ユーザーを取得
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let isValid = false;

    if (type === MfaVerificationType.TOTP) {
      // TOTPコードの検証
      let mfaSecret: string | null = null;

      if (context === MfaVerificationContext.SETUP) {
        // セットアップ時は一時的なシークレットを使用
        if (!secret) {
          throw new Error('Secret is required for setup verification');
        }
        mfaSecret = secret;
      } else {
        // ログイン時は永続化されたシークレットを使用
        mfaSecret = await this.mfaRepository.getSecret(userId);
        if (!mfaSecret) {
          throw new Error('MFA secret not found');
        }
      }

      isValid = this.totpService.verify(mfaSecret, code);
    } else if (type === MfaVerificationType.BACKUP_CODE) {
      // バックアップコードの検証
      const backupCode = BackupCode.create(code);
      const backupCodes = await this.mfaRepository.getBackupCodes(userId);

      // 全てのバックアップコードのハッシュと比較
      for (const metadata of backupCodes) {
        if (metadata.isUsed()) {
          continue; // 使用済みのコードはスキップ
        }

        // バックアップコードのハッシュを取得
        // MfaRepositoryから直接ハッシュを取得する必要があるが、
        // 現在の実装ではgetBackupCodes()はメタデータのみ返却する
        // そのため、全てのレコードを取得してハッシュと比較する必要がある
        // 暫定的に、MfaRepositoryにfindBackupCodeByHashメソッドを追加する必要がある
      }

      // バックアップコードをハッシュ化
      const codeHash = await this.backupCodeService.hash(backupCode.getValue());
      
      // MfaRepositoryからハッシュに対応するレコードを検索
      const backupCodeRecord = await (this.mfaRepository as any).findBackupCodeByHash(userId, codeHash);
      
      if (!backupCodeRecord || backupCodeRecord.usedAt !== null) {
        return { success: false };
      }

      isValid = true;

      // 使用済みとしてマーク
      await this.mfaRepository.markBackupCodeAsUsed(userId, codeHash);
    }

    if (!isValid) {
      return { success: false };
    }

    // 検証成功時の処理
    if (context === MfaVerificationContext.SETUP) {
      // セットアップ検証成功時は、シークレットを永続化し、バックアップコードを生成
      if (!secret) {
        throw new Error('Secret is required for setup verification');
      }

      // ユーザーのMFAを有効化
      const updatedUser = user.enableMfa(secret);
      await this.userRepository.save(updatedUser);

      // シークレットを永続化
      await this.mfaRepository.saveSecret(userId, secret);

      // バックアップコードを生成
      const backupCodesResult = await this.generateBackupCodesUseCase.execute(userId);

      return {
        success: true,
        backupCodes: backupCodesResult.codes,
      };
    } else {
      // ログイン検証成功時は、バックアップコードを使用済みとしてマーク（バックアップコードの場合）
      if (type === MfaVerificationType.BACKUP_CODE) {
        // TODO: 使用したバックアップコードを特定してマーク
        // 現在の実装では、どのハッシュが使用されたかを特定できない
      }

      return { success: true };
    }
  }
}

