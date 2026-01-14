/**
 * UpdateCustomerUseCase
 *
 * 顧客更新処理のユースケース
 */

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * 顧客更新処理を実行する
   * @param id 顧客ID
   * @param name 顧客名（オプション）
   * @param email メールアドレス（オプション）
   * @param phone 電話番号（オプション）
   * @param company 会社名（オプション）
   * @param address 住所（オプション）
   * @returns 更新された顧客エンティティ
   * @throws NotFoundException 顧客が見つからない場合
   * @throws ConflictException メールアドレスが他の顧客と重複している場合
   */
  public async execute(
    id: string,
    name?: string,
    email?: string,
    phone?: string | null,
    company?: string | null,
    address?: string | null,
  ): Promise<Customer> {
    // 顧客を取得
    const existingCustomer = await this.customerRepository.findById(id);
    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    // メールアドレスが変更される場合、重複チェック
    if (email && email !== existingCustomer.email) {
      const duplicateCustomer = await this.customerRepository.findByEmail(email);
      if (duplicateCustomer && duplicateCustomer.id !== id) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    // 顧客情報を更新
    const updatedCustomer = existingCustomer.update(name, email, phone, company, address);

    // リポジトリに保存
    return await this.customerRepository.update(updatedCustomer);
  }
}

