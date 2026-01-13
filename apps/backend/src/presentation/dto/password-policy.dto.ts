/**
 * PasswordPolicyDto
 *
 * パスワードポリシー設定のDTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class PasswordPolicyDto {
  @ApiProperty({ description: '最小長', minimum: 1 })
  @IsInt()
  @Min(1)
  public minLength!: number;

  @ApiProperty({ description: '最大長', minimum: 1 })
  @IsInt()
  @Min(1)
  public maxLength!: number;

  @ApiProperty({ description: '大文字必須フラグ' })
  @IsBoolean()
  public requireUppercase!: boolean;

  @ApiProperty({ description: '小文字必須フラグ' })
  @IsBoolean()
  public requireLowercase!: boolean;

  @ApiProperty({ description: '数字必須フラグ' })
  @IsBoolean()
  public requireNumbers!: boolean;

  @ApiProperty({ description: '記号必須フラグ' })
  @IsBoolean()
  public requireSymbols!: boolean;

  @ApiProperty({ description: '履歴保存数', minimum: 0 })
  @IsInt()
  @Min(0)
  public historyCount!: number;
}

