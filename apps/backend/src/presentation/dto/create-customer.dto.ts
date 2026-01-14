/**
 * CreateCustomerDto
 *
 * 顧客作成リクエストのDTO
 */

import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}
