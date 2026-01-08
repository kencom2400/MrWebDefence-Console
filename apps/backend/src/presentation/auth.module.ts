/**
 * Auth Module
 *
 * 認証機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { RedisTokenBlacklistRepository } from '../infrastructure/repositories/redis-token-blacklist.repository';
import { PasswordService } from '../infrastructure/services/password.service';
import { JwtService } from '../infrastructure/services/jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
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
