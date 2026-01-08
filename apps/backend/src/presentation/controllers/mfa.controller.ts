/**
 * MfaController
 *
 * MFA関連のHTTPエンドポイントを提供するコントローラー
 * Presentation層に位置し、Application層のUse Casesに依存する
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';
import { SetupMfaUseCase } from '../../application/use-cases/setup-mfa.use-case';
import {
  VerifyMfaUseCase,
  MfaVerificationType,
  MfaVerificationContext,
} from '../../application/use-cases/verify-mfa.use-case';
import { DisableMfaUseCase } from '../../application/use-cases/disable-mfa.use-case';
import { GenerateBackupCodesUseCase } from '../../application/use-cases/generate-backup-codes.use-case';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import {
  SetupMfaResponseDto,
  VerifySetupMfaRequestDto,
  VerifySetupMfaResponseDto,
} from '../dto/mfa-setup.dto';
import { VerifyMfaRequestDto, VerifyMfaResponseDto } from '../dto/mfa-verify.dto';
import { DisableMfaRequestDto, DisableMfaResponseDto } from '../dto/mfa-disable.dto';
import {
  GetBackupCodesResponseDto,
  RegenerateBackupCodesRequestDto,
  RegenerateBackupCodesResponseDto,
} from '../dto/mfa-backup-codes.dto';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { PasswordService } from '../../infrastructure/services/password.service';
import { BackupCodeMetadata } from '../../domain/value-objects/backup-code-metadata.value-object';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('api/v1/auth/mfa')
export class MfaController {
  constructor(
    @Inject(SetupMfaUseCase)
    private readonly setupMfaUseCase: SetupMfaUseCase,
    @Inject(VerifyMfaUseCase)
    private readonly verifyMfaUseCase: VerifyMfaUseCase,
    @Inject(DisableMfaUseCase)
    private readonly disableMfaUseCase: DisableMfaUseCase,
    @Inject(GenerateBackupCodesUseCase)
    private readonly generateBackupCodesUseCase: GenerateBackupCodesUseCase,
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('JwtService')
    private readonly jwtService: JwtService,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * MFAセットアップ開始
   * POST /api/v1/auth/mfa/setup
   */
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  public async setup(@Request() req: RequestWithUser): Promise<SetupMfaResponseDto> {
    try {
      const userId = req.user.sub;
      const result = await this.setupMfaUseCase.execute(userId);

      return {
        qrCodeDataUrl: result.qrCodeDataUrl,
        secret: result.secret, // 一時的に返却（検証時に使用）
        expiresIn: 300, // 5分
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'MFA is already enabled') {
        throw new ConflictException('MFA is already enabled');
      }
      throw error;
    }
  }

  /**
   * MFAセットアップ検証
   * POST /api/v1/auth/mfa/verify-setup
   */
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('verify-setup')
  @HttpCode(HttpStatus.OK)
  public async verifySetup(
    @Request() req: RequestWithUser,
    @Body() dto: VerifySetupMfaRequestDto,
  ): Promise<VerifySetupMfaResponseDto> {
    try {
      const userId = req.user.sub;
      const result = await this.verifyMfaUseCase.execute(
        userId,
        dto.code,
        MfaVerificationType.TOTP,
        MfaVerificationContext.SETUP,
        dto.secret,
      );

      if (!result.success) {
        throw new UnauthorizedException('Invalid TOTP code');
      }

      if (!result.backupCodes) {
        throw new Error('Backup codes not generated');
      }

      return {
        message: 'MFA has been enabled successfully',
        backupCodes: result.backupCodes,
        warning: 'These backup codes can only be viewed once. Please save them securely.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('Invalid')) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Verification failed');
    }
  }

  /**
   * ログイン時のMFA検証
   * POST /api/v1/auth/mfa/verify
   */
  @Public() // ログイン時のMFA検証は認証不要
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  public async verify(@Body() dto: VerifyMfaRequestDto): Promise<VerifyMfaResponseDto> {
    try {
      // コードの形式でTOTPかバックアップコードかを判定
      const isTotpCode = /^\d{6}$/.test(dto.code);
      const type = isTotpCode ? MfaVerificationType.TOTP : MfaVerificationType.BACKUP_CODE;

      const result = await this.verifyMfaUseCase.execute(
        dto.userId,
        dto.code,
        type,
        MfaVerificationContext.LOGIN,
      );

      if (!result.success) {
        throw new UnauthorizedException('Invalid MFA code');
      }

      // 検証成功後、JWTトークンを生成
      // ユーザー情報を取得
      const user = await this.userRepository.findById(dto.userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const accessToken = this.jwtService.generateToken(user.id, user.email, user.role);
      const expiresIn = this.jwtService.getExpiresIn();

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Verification failed');
    }
  }

  /**
   * MFA無効化
   * POST /api/v1/auth/mfa/disable
   */
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  public async disable(
    @Request() req: RequestWithUser,
    @Body() dto: DisableMfaRequestDto,
  ): Promise<DisableMfaResponseDto> {
    try {
      const userId = req.user.sub;
      await this.disableMfaUseCase.execute(userId, dto.password);

      return {
        message: 'MFA has been disabled successfully',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid password') {
        throw new UnauthorizedException('Invalid password');
      }
      if (error instanceof Error && error.message === 'MFA is already disabled') {
        throw new NotFoundException('MFA is not enabled');
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to disable MFA',
      );
    }
  }

  /**
   * バックアップコード一覧取得
   * GET /api/v1/auth/mfa/backup-codes
   */
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Get('backup-codes')
  @HttpCode(HttpStatus.OK)
  public async getBackupCodes(@Request() req: RequestWithUser): Promise<GetBackupCodesResponseDto> {
    const userId = req.user.sub;
    const backupCodes = await this.mfaRepository.getBackupCodes(userId);

    const backupCodesDto = backupCodes.map((metadata: BackupCodeMetadata) => ({
      id: metadata.id,
      usedAt: metadata.usedAt ? metadata.usedAt.toISOString() : null,
      createdAt: metadata.createdAt.toISOString(),
    }));

    const unusedCount = backupCodes.filter((m: BackupCodeMetadata) => !m.isUsed()).length;
    const usedCount = backupCodes.length - unusedCount;

    return {
      backupCodes: backupCodesDto,
      totalCount: backupCodes.length,
      unusedCount,
      usedCount,
    };
  }

  /**
   * バックアップコード再生成
   * POST /api/v1/auth/mfa/backup-codes/regenerate
   */
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  public async regenerateBackupCodes(
    @Request() req: RequestWithUser,
    @Body() dto: RegenerateBackupCodesRequestDto,
  ): Promise<RegenerateBackupCodesResponseDto> {
    try {
      const userId = req.user.sub;

      // パスワード確認
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await this.passwordService.compare(dto.password, user.hashedPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // 既存のバックアップコードを削除
      await this.mfaRepository.deleteBackupCodes(userId);

      // 新しいバックアップコードを生成
      const result = await this.generateBackupCodesUseCase.execute(userId);

      return {
        message: 'Backup codes have been regenerated successfully',
        backupCodes: result.codes,
        warning: 'These backup codes can only be viewed once. Please save them securely.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to regenerate backup codes',
      );
    }
  }
}
