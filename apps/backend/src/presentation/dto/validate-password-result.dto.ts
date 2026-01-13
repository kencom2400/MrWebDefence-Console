/**
 * ValidatePasswordResultDto
 *
 * パスワード検証結果のDTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class ValidatePasswordResultDto {
  @ApiProperty({ description: '検証結果（有効かどうか）' })
  @IsBoolean()
  public isValid!: boolean;

  @ApiProperty({ description: 'エラーメッセージの配列', type: [String] })
  public errors!: string[];

  @ApiProperty({ description: 'パスワード強度スコア（0-100）', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  public strengthScore!: number;

  @ApiProperty({ description: '再利用フラグ（過去のパスワードが再利用されているか）' })
  @IsBoolean()
  public isReused!: boolean;

  @ApiProperty({ description: 'メッセージ（再利用の場合など）', required: false, nullable: true })
  @IsOptional()
  @IsString()
  public message?: string;
}

