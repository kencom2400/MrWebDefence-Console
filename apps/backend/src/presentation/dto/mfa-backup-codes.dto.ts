/**
 * MFA Backup Codes DTOs
 */

import { IsNotEmpty, IsString } from 'class-validator';

export class BackupCodeMetadataDto {
  id: string;
  usedAt: string | null; // ISO 8601形式
  createdAt: string; // ISO 8601形式
}

export class GetBackupCodesResponseDto {
  backupCodes: BackupCodeMetadataDto[];
  totalCount: number;
  unusedCount: number;
  usedCount: number;
}

export class RegenerateBackupCodesRequestDto {
  @IsNotEmpty()
  @IsString()
  password: string; // パスワード確認用
}

export class RegenerateBackupCodesResponseDto {
  message: string;
  backupCodes: string[];
  warning: string;
}

