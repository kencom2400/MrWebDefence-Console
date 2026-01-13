/**
 * ValidatePasswordDto
 *
 * パスワード検証リクエストのDTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ValidatePasswordDto {
  @ApiProperty({ description: '検証するパスワード', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public password!: string;
}

