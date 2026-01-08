/**
 * MFA Disable DTOs
 */

import { IsNotEmpty, IsString } from 'class-validator';

export class DisableMfaRequestDto {
  @IsNotEmpty()
  @IsString()
  password: string; // パスワード確認用
}

export class DisableMfaResponseDto {
  message: string;
}
