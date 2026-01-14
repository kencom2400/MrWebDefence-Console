/**
 * CreateUserDto
 *
 * ユーザー作成リクエストのDTO
 */

import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../domain/entities/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

