/**
 * Login Request DTO
 *
 * ログインリクエストのデータ転送オブジェクト
 */

import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail({}, { message: 'email must be an email' })
  @MaxLength(255, { message: 'email must be shorter than or equal to 255 characters' })
  public email!: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be longer than or equal to 8 characters' })
  @MaxLength(128, { message: 'password must be shorter than or equal to 128 characters' })
  public password!: string;
}

