/**
 * Engine Module
 *
 * WAFエンジン向け設定配信APIのNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { EngineConfigController } from './controllers/engine-config.controller';
import { GetEngineConfigUseCase } from '../application/use-cases/get-engine-config.use-case';
import { FqdnRepository } from '../infrastructure/repositories/fqdn.repository';
import { IpAllowListRepository } from '../infrastructure/repositories/ip-allowlist.repository';
import { CustomerRepository } from '../infrastructure/repositories/customer.repository';

@Module({
  controllers: [EngineConfigController],
  providers: [
    GetEngineConfigUseCase,
    {
      provide: 'IFqdnRepository',
      useClass: FqdnRepository,
    },
    {
      provide: 'IIpAllowListRepository',
      useClass: IpAllowListRepository,
    },
    {
      provide: 'ICustomerRepository',
      useClass: CustomerRepository,
    },
  ],
})
export class EngineModule {}
