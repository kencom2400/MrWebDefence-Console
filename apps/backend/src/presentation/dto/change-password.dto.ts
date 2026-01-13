/**
 * ChangePasswordDto
 *
 * パスワード変更リクエストのDTO
 */

import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  public newPassword!: string;
}
