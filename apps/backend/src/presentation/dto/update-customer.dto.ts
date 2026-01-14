/**
 * UpdateCustomerDto
 *
 * 顧客更新リクエストのDTO
 */

import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string | null;
}
