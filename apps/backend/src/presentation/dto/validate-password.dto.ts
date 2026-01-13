/**
 * ValidatePasswordDto
 *
 * パスワード検証リクエストのDTO
 */

import { IsString, MinLength, MaxLength } from 'class-validator';

export class ValidatePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public password!: string;
}

