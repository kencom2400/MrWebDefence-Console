/**
 * MFA Setup DTOs
 */

import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SetupMfaRequestDto {
  // リクエストボディは空（認証済みユーザーのみ）
}

export class SetupMfaResponseDto {
  qrCodeDataUrl: string;
  secret: string; // 一時的に返却（検証時に使用）
  expiresIn: number; // 一時トークンの有効期限（秒）
}

export class VerifySetupMfaRequestDto {
  @IsNotEmpty()
  @IsString()
  secret: string; // セットアップ時に返却されたシークレット

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code: string; // TOTPコード（6桁の数字）
}

export class VerifySetupMfaResponseDto {
  message: string;
  backupCodes: string[];
  warning: string;
}
