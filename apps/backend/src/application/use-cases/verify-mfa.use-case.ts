/**
 * VerifyMfaUseCase
 *
 * MFA検証処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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
    private readonly totpService: TotpService,
    private readonly backupCodeService: BackupCodeService,
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
      throw new NotFoundException('User not found');
    }

    let isValid = false;

    if (type === MfaVerificationType.TOTP) {
      // TOTPコードの検証
      let mfaSecret: string | null = null;

      if (context === MfaVerificationContext.SETUP) {
        // セットアップ時は一時的なシークレットを使用
        if (!secret) {
          throw new BadRequestException('Secret is required for setup verification');
        }
        mfaSecret = secret;
      } else {
        // ログイン時は永続化されたシークレットを使用
        mfaSecret = await this.mfaRepository.getSecret(userId);
        if (!mfaSecret) {
          throw new NotFoundException('MFA secret not found');
        }
      }

      isValid = this.totpService.verify(mfaSecret, code);
    } else if (type === MfaVerificationType.BACKUP_CODE) {
      // バックアップコードの検証
      const backupCode = BackupCode.create(code);
      const allRecords = await this.mfaRepository.getAllBackupCodeRecords(userId);

      // 全ての未使用バックアップコードのハッシュと提供されたコードを並行して比較
      // タイミング攻撃を緩和するため、Promise.allを使用して全ての検証を並行実行
      const verificationPromises = allRecords
        .filter((record) => record.usedAt === null)
        .map(async (record) => ({
          isMatch: await this.backupCodeService.verify(backupCode.getValue(), record.codeHash),
          hash: record.codeHash,
        }));

      const verificationResults = await Promise.all(verificationPromises);
      const validResult = verificationResults.find((result) => result.isMatch);

      if (validResult) {
        isValid = true;
        // 使用済みとしてマーク
        await this.mfaRepository.markBackupCodeAsUsed(userId, validResult.hash);
      }
    }

    if (!isValid) {
      return { success: false };
    }

    // 検証成功時の処理
    if (context === MfaVerificationContext.SETUP) {
      // セットアップ検証成功時は、シークレットを永続化し、バックアップコードを生成
      if (!secret) {
        throw new BadRequestException('Secret is required for setup verification');
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
      // ログイン検証成功時
      // バックアップコードの場合は、上記の検証処理で既に使用済みとしてマークされている
      return { success: true };
    }
  }
}

 *
 * MFA検証処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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
    private readonly totpService: TotpService,
    private readonly backupCodeService: BackupCodeService,
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
      throw new NotFoundException('User not found');
    }

    let isValid = false;

    if (type === MfaVerificationType.TOTP) {
      // TOTPコードの検証
      let mfaSecret: string | null = null;

      if (context === MfaVerificationContext.SETUP) {
        // セットアップ時は一時的なシークレットを使用
        if (!secret) {
          throw new BadRequestException('Secret is required for setup verification');
        }
        mfaSecret = secret;
      } else {
        // ログイン時は永続化されたシークレットを使用
        mfaSecret = await this.mfaRepository.getSecret(userId);
        if (!mfaSecret) {
          throw new NotFoundException('MFA secret not found');
        }
      }

      isValid = this.totpService.verify(mfaSecret, code);
    } else if (type === MfaVerificationType.BACKUP_CODE) {
      // バックアップコードの検証
      const backupCode = BackupCode.create(code);
      const allRecords = await this.mfaRepository.getAllBackupCodeRecords(userId);

      // 全ての未使用バックアップコードのハッシュと提供されたコードを並行して比較
      // タイミング攻撃を緩和するため、Promise.allを使用して全ての検証を並行実行
      const verificationPromises = allRecords
        .filter((record) => record.usedAt === null)
        .map(async (record) => ({
          isMatch: await this.backupCodeService.verify(backupCode.getValue(), record.codeHash),
          hash: record.codeHash,
        }));

      const verificationResults = await Promise.all(verificationPromises);
      const validResult = verificationResults.find((result) => result.isMatch);

      if (validResult) {
        isValid = true;
        // 使用済みとしてマーク
        await this.mfaRepository.markBackupCodeAsUsed(userId, validResult.hash);
      }
    }

    if (!isValid) {
      return { success: false };
    }

    // 検証成功時の処理
    if (context === MfaVerificationContext.SETUP) {
      // セットアップ検証成功時は、シークレットを永続化し、バックアップコードを生成
      if (!secret) {
        throw new BadRequestException('Secret is required for setup verification');
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
      // ログイン検証成功時
      // バックアップコードの場合は、上記の検証処理で既に使用済みとしてマークされている
      return { success: true };
    }
  }
}

 *
 * MFA検証処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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
    private readonly totpService: TotpService,
    private readonly backupCodeService: BackupCodeService,
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
      throw new NotFoundException('User not found');
    }

    let isValid = false;

    if (type === MfaVerificationType.TOTP) {
      // TOTPコードの検証
      let mfaSecret: string | null = null;

      if (context === MfaVerificationContext.SETUP) {
        // セットアップ時は一時的なシークレットを使用
        if (!secret) {
          throw new BadRequestException('Secret is required for setup verification');
        }
        mfaSecret = secret;
      } else {
        // ログイン時は永続化されたシークレットを使用
        mfaSecret = await this.mfaRepository.getSecret(userId);
        if (!mfaSecret) {
          throw new NotFoundException('MFA secret not found');
        }
      }

      isValid = this.totpService.verify(mfaSecret, code);
    } else if (type === MfaVerificationType.BACKUP_CODE) {
      // バックアップコードの検証
      const backupCode = BackupCode.create(code);
      const allRecords = await this.mfaRepository.getAllBackupCodeRecords(userId);

      // 全ての未使用バックアップコードのハッシュと提供されたコードを並行して比較
      // タイミング攻撃を緩和するため、Promise.allを使用して全ての検証を並行実行
      const verificationPromises = allRecords
        .filter((record) => record.usedAt === null)
        .map(async (record) => ({
          isMatch: await this.backupCodeService.verify(backupCode.getValue(), record.codeHash),
          hash: record.codeHash,
        }));

      const verificationResults = await Promise.all(verificationPromises);
      const validResult = verificationResults.find((result) => result.isMatch);

      if (validResult) {
        isValid = true;
        // 使用済みとしてマーク
        await this.mfaRepository.markBackupCodeAsUsed(userId, validResult.hash);
      }
    }

    if (!isValid) {
      return { success: false };
    }

    // 検証成功時の処理
    if (context === MfaVerificationContext.SETUP) {
      // セットアップ検証成功時は、シークレットを永続化し、バックアップコードを生成
      if (!secret) {
        throw new BadRequestException('Secret is required for setup verification');
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
      // ログイン検証成功時
      // バックアップコードの場合は、上記の検証処理で既に使用済みとしてマークされている
      return { success: true };
    }
  }
}
