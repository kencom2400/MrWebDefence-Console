/**
 * CreateCustomerUseCase
 *
 * 顧客作成処理のユースケース
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * 顧客作成処理を実行する
   * @param name 顧客名
   * @param email メールアドレス
   * @param phone 電話番号（オプション）
   * @param company 会社名（オプション）
   * @param address 住所（オプション）
   * @returns 作成された顧客エンティティ
   * @throws ConflictException 同じメールアドレスの顧客が既に存在する場合
   */
  public async execute(
    name: string,
    email: string,
    phone?: string | null,
    company?: string | null,
    address?: string | null,
  ): Promise<Customer> {
    // メールアドレスの重複チェック
    const existingCustomer = await this.customerRepository.findByEmail(email);
    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    // 顧客エンティティを作成
    const customerId = randomUUID();
    const customer = Customer.create(customerId, name, email, phone, company, address);

    // リポジトリに保存
    return await this.customerRepository.create(customer);
  }
}
