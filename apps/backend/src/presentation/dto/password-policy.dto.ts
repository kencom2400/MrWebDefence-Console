/**
 * PasswordPolicyDto
 *
 * パスワードポリシー設定のDTO
 */

import { IsBoolean, IsInt, Min } from 'class-validator';

export class PasswordPolicyDto {
  @IsInt()
  @Min(1)
  public minLength!: number;

  @IsInt()
  @Min(1)
  public maxLength!: number;

  @IsBoolean()
  public requireUppercase!: boolean;

  @IsBoolean()
  public requireLowercase!: boolean;

  @IsBoolean()
  public requireNumbers!: boolean;

  @IsBoolean()
  public requireSymbols!: boolean;

  @IsInt()
  @Min(0)
  public historyCount!: number;
}
