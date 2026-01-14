/**
 * DeleteCustomerUseCase
 *
 * 顧客削除処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * 顧客削除処理を実行する
   * @param id 顧客ID
   * @throws NotFoundException 顧客が見つからない場合
   */
  public async execute(id: string): Promise<void> {
    // 顧客の存在確認
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 顧客を削除
    await this.customerRepository.delete(id);
  }
}

