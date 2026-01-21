/**
 * ApiToken Module
 *
 * APIトークン管理機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { ApiTokenController } from './controllers/api-token.controller';
import { CreateApiTokenUseCase } from '../application/use-cases/create-api-token.use-case';
import { ListApiTokensUseCase } from '../application/use-cases/list-api-tokens.use-case';
import { DeleteApiTokenUseCase } from '../application/use-cases/delete-api-token.use-case';
import { RevokeApiTokenUseCase } from '../application/use-cases/revoke-api-token.use-case';
import { ApiTokenRepository } from '../infrastructure/repositories/api-token.repository';
import { ApiTokenService } from '../infrastructure/services/api-token.service';
import { ApiTokenAuthGuard } from './guards/api-token-auth.guard';

@Module({
  controllers: [ApiTokenController],
  providers: [
    CreateApiTokenUseCase,
    ListApiTokensUseCase,
    DeleteApiTokenUseCase,
    RevokeApiTokenUseCase,
    {
      provide: 'IApiTokenRepository',
      useClass: ApiTokenRepository,
    },
    {
      provide: 'ApiTokenService',
      useFactory: (): ApiTokenService => {
        const saltRounds: number = process.env.BCRYPT_SALT_ROUNDS
          ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
          : 10;
        return new ApiTokenService(saltRounds);
      },
    },
    ApiTokenAuthGuard,
  ],
  exports: [
    CreateApiTokenUseCase,
    ListApiTokensUseCase,
    DeleteApiTokenUseCase,
    RevokeApiTokenUseCase,
    'IApiTokenRepository',
    'ApiTokenService',
    ApiTokenAuthGuard,
  ],
})
export class ApiTokenModule {}
