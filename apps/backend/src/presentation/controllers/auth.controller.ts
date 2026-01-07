/**
 * Auth Controller
 *
 * 認証関連のHTTPエンドポイントを提供するコントローラー
 * プレゼンテーション層に位置し、アプリケーション層に依存する
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Inject,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LoginUseCase, AuthenticationError } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @Inject(LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    @Inject(LogoutUseCase)
    private readonly logoutUseCase: LogoutUseCase,
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

  /**
   * ログアウト処理
   * POST /api/v1/auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async logout(@Request() req: any): Promise<void> {
    // Authorizationヘッダーからトークンを取得（Guardで検証済みなので存在するはずだが念のため）
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await this.logoutUseCase.execute(token);
    }
  }

  /**
   * プロフィール取得（セッション確認用）
   * GET /api/v1/auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  public getProfile(@Request() req: any) {
    return req.user;
  }
}
