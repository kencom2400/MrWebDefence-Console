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
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { LoginUseCase, AuthenticationError } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

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
  @Public() // ログインは認証不要
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() loginRequest: LoginRequestDto,
  ): Promise<LoginResponseDto | { requiresMfa: true; userId: string }> {
    try {
      const result = await this.loginUseCase.execute(loginRequest.email, loginRequest.password);

      // MFA有効なユーザーの場合は中間状態を返す
      if ('requiresMfa' in result && result.requiresMfa) {
        return {
          requiresMfa: true,
          userId: result.userId,
        };
      }

      // 通常のログイン成功（型ガードにより、resultはLoginResponseDto型）
      if ('accessToken' in result) {
        return {
          accessToken: result.accessToken,
          tokenType: result.tokenType,
          expiresIn: result.expiresIn,
        };
      }

      // この分岐には到達しないはずだが、TypeScriptの型チェックのために追加
      throw new Error('Unexpected login result');
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
  // 認証必要（Global Guardによりデフォルトで保護される）
  // ログアウトは全てのロールで可能
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(@Request() req: RequestWithUser): Promise<void> {
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
  // 認証必要（デフォルト保護）
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Get('profile')
  public getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user;
  }
}

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
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { LoginUseCase, AuthenticationError } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

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
  @Public() // ログインは認証不要
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() loginRequest: LoginRequestDto,
  ): Promise<LoginResponseDto | { requiresMfa: true; userId: string }> {
    try {
      const result = await this.loginUseCase.execute(loginRequest.email, loginRequest.password);

      // MFA有効なユーザーの場合は中間状態を返す
      if ('requiresMfa' in result && result.requiresMfa) {
        return {
          requiresMfa: true,
          userId: result.userId,
        };
      }

      // 通常のログイン成功（型ガードにより、resultはLoginResponseDto型）
      if ('accessToken' in result) {
        return {
          accessToken: result.accessToken,
          tokenType: result.tokenType,
          expiresIn: result.expiresIn,
        };
      }

      // この分岐には到達しないはずだが、TypeScriptの型チェックのために追加
      throw new Error('Unexpected login result');
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
  // 認証必要（Global Guardによりデフォルトで保護される）
  // ログアウトは全てのロールで可能
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(@Request() req: RequestWithUser): Promise<void> {
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
  // 認証必要（デフォルト保護）
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Get('profile')
  public getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user;
  }
}

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
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { LoginUseCase, AuthenticationError } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

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
  @Public() // ログインは認証不要
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() loginRequest: LoginRequestDto,
  ): Promise<LoginResponseDto | { requiresMfa: true; userId: string }> {
    try {
      const result = await this.loginUseCase.execute(loginRequest.email, loginRequest.password);

      // MFA有効なユーザーの場合は中間状態を返す
      if ('requiresMfa' in result && result.requiresMfa) {
        return {
          requiresMfa: true,
          userId: result.userId,
        };
      }

      // 通常のログイン成功（型ガードにより、resultはLoginResponseDto型）
      if ('accessToken' in result) {
        return {
          accessToken: result.accessToken,
          tokenType: result.tokenType,
          expiresIn: result.expiresIn,
        };
      }

      // この分岐には到達しないはずだが、TypeScriptの型チェックのために追加
      throw new Error('Unexpected login result');
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
  // 認証必要（Global Guardによりデフォルトで保護される）
  // ログアウトは全てのロールで可能
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(@Request() req: RequestWithUser): Promise<void> {
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
  // 認証必要（デフォルト保護）
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Get('profile')
  public getProfile(@Request() req: RequestWithUser): JwtPayload {
    return req.user;
  }
}
