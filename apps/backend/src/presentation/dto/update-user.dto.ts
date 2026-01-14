/**
 * UpdateUserDto
 *
 * ユーザー更新リクエストのDTO
 */

import { IsEmail, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}

