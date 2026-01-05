/**
 * Auth Module
 *
 * 認証機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { PasswordService } from '../infrastructure/services/password.service';
import { JwtService } from '../infrastructure/services/jwt.service';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'PasswordService',
      useClass: PasswordService,
    },
    {
      provide: 'JwtService',
      useFactory: (): JwtService => {
        const secret: string = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
        const expiresIn: number = parseInt(process.env.JWT_EXPIRES_IN || '86400', 10);
        return new JwtService(secret, expiresIn);
      },
    },
  ],
})
export class AuthModule {}
