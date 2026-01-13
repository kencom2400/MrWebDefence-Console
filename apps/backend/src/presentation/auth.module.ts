/**
 * Auth Module
 *
 * 認証機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { MfaController } from './controllers/mfa.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { PasswordController } from './controllers/password.controller';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { SetupMfaUseCase } from '../application/use-cases/setup-mfa.use-case';
import { VerifyMfaUseCase } from '../application/use-cases/verify-mfa.use-case';
import { DisableMfaUseCase } from '../application/use-cases/disable-mfa.use-case';
import { GenerateBackupCodesUseCase } from '../application/use-cases/generate-backup-codes.use-case';
import { GetDashboardDataUseCase } from '../application/use-cases/get-dashboard-data.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { ValidatePasswordPolicyUseCase } from '../application/use-cases/validate-password-policy.use-case';
import { GetPasswordPolicyUseCase } from '../application/use-cases/get-password-policy.use-case';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { MfaRepository } from '../infrastructure/repositories/mfa.repository';
import { IpAllowListRepository } from '../infrastructure/repositories/ip-allowlist.repository';
import { PasswordHistoryRepository } from '../infrastructure/repositories/password-history.repository';
import { RedisTokenBlacklistRepository } from '../infrastructure/repositories/redis-token-blacklist.repository';
import { PasswordService } from '../infrastructure/services/password.service';
import { PasswordPolicyService } from '../infrastructure/services/password-policy.service';
import { JwtService } from '../infrastructure/services/jwt.service';
import { TotpService } from '../infrastructure/services/totp.service';
import { QrCodeService } from '../infrastructure/services/qr-code.service';
import { BackupCodeService } from '../infrastructure/services/backup-code.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController, MfaController, DashboardController, PasswordController],
  providers: [
    LoginUseCase,
    LogoutUseCase,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'ITokenBlacklistRepository',
      useClass: RedisTokenBlacklistRepository,
    },
    {
      provide: 'PasswordService',
      useFactory: (): PasswordService => {
        const saltRounds: number = process.env.BCRYPT_SALT_ROUNDS
          ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
          : 10;
        return new PasswordService(saltRounds);
      },
    },
    {
      provide: 'JwtService',
      useFactory: (): JwtService => {
        const secret: string | undefined = process.env.JWT_SECRET;
        if (process.env.NODE_ENV === 'production' && !secret) {
          throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
        }
        const expiresIn: number = parseInt(process.env.JWT_EXPIRES_IN || '1800', 10);
        return new JwtService(secret || 'default-secret-key-change-in-production', expiresIn);
      },
    },
    // MFA Use Cases
    SetupMfaUseCase,
    VerifyMfaUseCase,
    DisableMfaUseCase,
    GenerateBackupCodesUseCase,
    // MFA Services
    TotpService,
    QrCodeService,
    BackupCodeService,
    // MFA Repository
    {
      provide: 'IMfaRepository',
      useClass: MfaRepository,
    },
    // Dashboard Use Case
    GetDashboardDataUseCase,
    // Password Use Cases
    ChangePasswordUseCase,
    ValidatePasswordPolicyUseCase,
    GetPasswordPolicyUseCase,
    // Password Services
    PasswordPolicyService,
    // Password History Repository
    {
      provide: 'IPasswordHistoryRepository',
      useClass: PasswordHistoryRepository,
    },
    // IP AllowList Repository (Stub)
    {
      provide: 'IIpAllowListRepository',
      useClass: IpAllowListRepository,
    },
    // Global Guards: 登録順序が重要 (JwtAuthGuard -> RolesGuard)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
