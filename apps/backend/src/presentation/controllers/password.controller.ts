/**
 * PasswordController
 *
 * パスワード管理関連のHTTPエンドポイントを提供するコントローラー
 * Presentation層に位置し、Application層のUse Casesに依存する
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Inject,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ValidatePasswordPolicyUseCase } from '../../application/use-cases/validate-password-policy.use-case';
import { GetPasswordPolicyUseCase } from '../../application/use-cases/get-password-policy.use-case';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ValidatePasswordDto } from '../dto/validate-password.dto';
import { PasswordPolicyDto } from '../dto/password-policy.dto';
import { ValidatePasswordResultDto } from '../dto/validate-password-result.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@Controller('api/v1/auth/password')
@Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN) // 全ての認証済みユーザーがアクセス可能
export class PasswordController {
  constructor(
    @Inject(ChangePasswordUseCase)
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(ValidatePasswordPolicyUseCase)
    private readonly validatePasswordPolicyUseCase: ValidatePasswordPolicyUseCase,
    @Inject(GetPasswordPolicyUseCase)
    private readonly getPasswordPolicyUseCase: GetPasswordPolicyUseCase,
  ) {}

  /**
   * パスワード変更
   * POST /api/v1/auth/password/change
   */
  @Post('change')
  @HttpCode(HttpStatus.OK)
  public async changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;

    try {
      await this.changePasswordUseCase.execute(userId, dto.currentPassword, dto.newPassword);
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * パスワード強度チェック
   * POST /api/v1/auth/password/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  public async validatePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ValidatePasswordDto,
  ): Promise<ValidatePasswordResultDto> {
    const userId = req.user.sub;

    const result = await this.validatePasswordPolicyUseCase.execute(userId, dto.password);

    return {
      isValid: result.isValid,
      errors: result.errors,
      strengthScore: result.strengthScore,
      isReused: result.isReused,
      message: result.message,
    };
  }

  /**
   * パスワードポリシー設定取得
   * GET /api/v1/auth/password/policy
   */
  @Get('policy')
  @HttpCode(HttpStatus.OK)
  public async getPasswordPolicy(): Promise<PasswordPolicyDto> {
    return await this.getPasswordPolicyUseCase.execute();
  }
}

 *
 * パスワード管理関連のHTTPエンドポイントを提供するコントローラー
 * Presentation層に位置し、Application層のUse Casesに依存する
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Inject,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ValidatePasswordPolicyUseCase } from '../../application/use-cases/validate-password-policy.use-case';
import { GetPasswordPolicyUseCase } from '../../application/use-cases/get-password-policy.use-case';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ValidatePasswordDto } from '../dto/validate-password.dto';
import { PasswordPolicyDto } from '../dto/password-policy.dto';
import { ValidatePasswordResultDto } from '../dto/validate-password-result.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@Controller('api/v1/auth/password')
@Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN) // 全ての認証済みユーザーがアクセス可能
export class PasswordController {
  constructor(
    @Inject(ChangePasswordUseCase)
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(ValidatePasswordPolicyUseCase)
    private readonly validatePasswordPolicyUseCase: ValidatePasswordPolicyUseCase,
    @Inject(GetPasswordPolicyUseCase)
    private readonly getPasswordPolicyUseCase: GetPasswordPolicyUseCase,
  ) {}

  /**
   * パスワード変更
   * POST /api/v1/auth/password/change
   */
  @Post('change')
  @HttpCode(HttpStatus.OK)
  public async changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;

    try {
      await this.changePasswordUseCase.execute(userId, dto.currentPassword, dto.newPassword);
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * パスワード強度チェック
   * POST /api/v1/auth/password/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  public async validatePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ValidatePasswordDto,
  ): Promise<ValidatePasswordResultDto> {
    const userId = req.user.sub;

    const result = await this.validatePasswordPolicyUseCase.execute(userId, dto.password);

    return {
      isValid: result.isValid,
      errors: result.errors,
      strengthScore: result.strengthScore,
      isReused: result.isReused,
      message: result.message,
    };
  }

  /**
   * パスワードポリシー設定取得
   * GET /api/v1/auth/password/policy
   */
  @Get('policy')
  @HttpCode(HttpStatus.OK)
  public async getPasswordPolicy(): Promise<PasswordPolicyDto> {
    return await this.getPasswordPolicyUseCase.execute();
  }
}

 *
 * パスワード管理関連のHTTPエンドポイントを提供するコントローラー
 * Presentation層に位置し、Application層のUse Casesに依存する
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Inject,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ValidatePasswordPolicyUseCase } from '../../application/use-cases/validate-password-policy.use-case';
import { GetPasswordPolicyUseCase } from '../../application/use-cases/get-password-policy.use-case';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ValidatePasswordDto } from '../dto/validate-password.dto';
import { PasswordPolicyDto } from '../dto/password-policy.dto';
import { ValidatePasswordResultDto } from '../dto/validate-password-result.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@Controller('api/v1/auth/password')
@Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN) // 全ての認証済みユーザーがアクセス可能
export class PasswordController {
  constructor(
    @Inject(ChangePasswordUseCase)
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(ValidatePasswordPolicyUseCase)
    private readonly validatePasswordPolicyUseCase: ValidatePasswordPolicyUseCase,
    @Inject(GetPasswordPolicyUseCase)
    private readonly getPasswordPolicyUseCase: GetPasswordPolicyUseCase,
  ) {}

  /**
   * パスワード変更
   * POST /api/v1/auth/password/change
   */
  @Post('change')
  @HttpCode(HttpStatus.OK)
  public async changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const userId = req.user.sub;

    try {
      await this.changePasswordUseCase.execute(userId, dto.currentPassword, dto.newPassword);
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * パスワード強度チェック
   * POST /api/v1/auth/password/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  public async validatePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ValidatePasswordDto,
  ): Promise<ValidatePasswordResultDto> {
    const userId = req.user.sub;

    const result = await this.validatePasswordPolicyUseCase.execute(userId, dto.password);

    return {
      isValid: result.isValid,
      errors: result.errors,
      strengthScore: result.strengthScore,
      isReused: result.isReused,
      message: result.message,
    };
  }

  /**
   * パスワードポリシー設定取得
   * GET /api/v1/auth/password/policy
   */
  @Get('policy')
  @HttpCode(HttpStatus.OK)
  public async getPasswordPolicy(): Promise<PasswordPolicyDto> {
    return await this.getPasswordPolicyUseCase.execute();
  }
}
