/**
 * ToggleCustomerStatusUseCase
 *
 * 顧客有効/無効化処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerStatus, CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

@Injectable()
export class ToggleCustomerStatusUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * 顧客有効/無効化処理を実行する
   * @param id 顧客ID
   * @param status ステータス（'ACTIVE' または 'INACTIVE'）
   * @returns 更新された顧客エンティティ
   * @throws NotFoundException 顧客が見つからない場合
   */
  public async execute(id: string, status: CustomerStatusEnum): Promise<Customer> {
    // 顧客を取得
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // ステータスを変更
    let updatedCustomer: Customer;
    if (status === CustomerStatusEnum.ACTIVE) {
      updatedCustomer = customer.activate();
    } else {
      updatedCustomer = customer.deactivate();
    }

    // リポジトリに保存
    return await this.customerRepository.update(updatedCustomer);
  }
}

