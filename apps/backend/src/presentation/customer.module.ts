/**
 * Customer Module
 *
 * 顧客管理機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { CustomerController } from './controllers/customer.controller';
import { CreateCustomerUseCase } from '../application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../application/use-cases/delete-customer.use-case';
import { GetCustomerListUseCase } from '../application/use-cases/get-customer-list.use-case';
import { GetCustomerByIdUseCase } from '../application/use-cases/get-customer-by-id.use-case';
import { ToggleCustomerStatusUseCase } from '../application/use-cases/toggle-customer-status.use-case';
import { CustomerRepository } from '../infrastructure/repositories/customer.repository';

@Module({
  controllers: [CustomerController],
  providers: [
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    GetCustomerListUseCase,
    GetCustomerByIdUseCase,
    ToggleCustomerStatusUseCase,
    {
      provide: 'ICustomerRepository',
      useClass: CustomerRepository,
    },
  ],
})
export class CustomerModule {}
