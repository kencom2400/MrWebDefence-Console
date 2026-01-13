/**
 * ChangePasswordDto
 *
 * パスワード変更リクエストのDTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '現在のパスワード', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public currentPassword!: string;

  @ApiProperty({ description: '新しいパスワード', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public newPassword!: string;
}

