/**
 * CreateApiTokenDto
 *
 * APIトークン作成リクエストのDTO
 */

import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateApiTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string | null;

  @IsDateString()
  @IsOptional()
  expiresAt?: string | null; // ISO 8601形式の日時文字列
}
