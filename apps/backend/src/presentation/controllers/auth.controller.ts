/**
 * Auth Controller
 *
 * 認証関連のHTTPエンドポイントを提供するコントローラー
 * プレゼンテーション層に位置し、アプリケーション層に依存する
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { LoginUseCase, AuthenticationError } from '../../application/use-cases/login.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
  ) {}

  /**
   * ログイン処理
   * POST /api/v1/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() loginRequest: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      const result = await this.loginUseCase.execute(loginRequest.email, loginRequest.password);

      return {
        accessToken: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
      };
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw error;
    }
  }
}
