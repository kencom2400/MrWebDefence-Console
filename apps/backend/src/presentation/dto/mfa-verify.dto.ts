/**
 * MFA Verify DTOs
 */

import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyMfaRequestDto {
  @IsNotEmpty()
  @IsString()
  userId: string; // ログイン時に返却されたuserId

  @IsNotEmpty()
  @IsString()
  @Matches(/^(\d{6}|[A-Z0-9]{4}-[A-Z0-9]{4})$/, {
    message: 'code must be a 6-digit TOTP code or an 8-character backup code (XXXX-XXXX)',
  })
  code: string; // TOTPコード（6桁）またはバックアップコード（8文字）
}

export class VerifyMfaResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

