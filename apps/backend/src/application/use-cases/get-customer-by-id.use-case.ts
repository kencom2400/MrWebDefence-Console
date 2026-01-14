/**
 * GetCustomerByIdUseCase
 *
 * 顧客詳細取得処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class GetCustomerByIdUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * 顧客詳細取得処理を実行する
   * @param id 顧客ID
   * @returns 顧客エンティティ
   * @throws NotFoundException 顧客が見つからない場合
   */
  public async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }
}

