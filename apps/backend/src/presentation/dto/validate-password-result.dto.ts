/**
 * ValidatePasswordResultDto
 *
 * パスワード検証結果のDTO
 */

import { IsBoolean, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class ValidatePasswordResultDto {
  @IsBoolean()
  public isValid!: boolean;

  public errors!: string[];

  @IsInt()
  @Min(0)
  @Max(100)
  public strengthScore!: number;

  @IsBoolean()
  public isReused!: boolean;

  @IsOptional()
  @IsString()
  public message?: string;
}

