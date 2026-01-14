/**
 * FqdnListQueryDto
 *
 * FQDN一覧取得・検索時のクエリDTO
 */

import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';

export class FqdnListQueryDto {
  @IsOptional()
  @IsString()
  fqdn?: string;

  @IsOptional()
  @IsEnum(FqdnStatusEnum)
  status?: FqdnStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
