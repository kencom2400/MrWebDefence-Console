/**
 * Fqdn Module
 *
 * FQDN管理機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { FqdnController } from './controllers/fqdn.controller';
import { CreateFqdnUseCase } from '../application/use-cases/create-fqdn.use-case';
import { UpdateFqdnUseCase } from '../application/use-cases/update-fqdn.use-case';
import { DeleteFqdnUseCase } from '../application/use-cases/delete-fqdn.use-case';
import { GetFqdnListUseCase } from '../application/use-cases/get-fqdn-list.use-case';
import { GetFqdnByIdUseCase } from '../application/use-cases/get-fqdn-by-id.use-case';
import { UpdateFqdnStatusUseCase } from '../application/use-cases/update-fqdn-status.use-case';
import { FqdnRepository } from '../infrastructure/repositories/fqdn.repository';

@Module({
  controllers: [FqdnController],
  providers: [
    CreateFqdnUseCase,
    UpdateFqdnUseCase,
    DeleteFqdnUseCase,
    GetFqdnListUseCase,
    GetFqdnByIdUseCase,
    UpdateFqdnStatusUseCase,
    {
      provide: 'IFqdnRepository',
      useClass: FqdnRepository,
    },
  ],
})
export class FqdnModule {}
