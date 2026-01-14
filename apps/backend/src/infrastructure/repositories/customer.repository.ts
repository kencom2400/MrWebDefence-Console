/**
 * CustomerRepository
 *
 * 顧客リポジトリ（インメモリ実装）
 * 本来はデータベースに接続するが、現段階ではメモリ上でデータを管理する
 */

import { Injectable } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import {
  ICustomerRepository,
  CustomerListQuery,
  CustomerListResult,
} from '../../domain/repositories/customer.repository.interface';
import { CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  // メモリ上で顧客データを保持するマップ
  // 本番環境ではデータベースに置き換える
  private customers: Map<string, Customer> = new Map();

  /**
   * 顧客を作成する
   * @param customer 顧客エンティティ
   * @returns 作成された顧客エンティティ
   */
  async create(customer: Customer): Promise<Customer> {
    this.customers.set(customer.id, customer);
    return customer;
  }

  /**
   * 顧客を更新する
   * @param customer 顧客エンティティ
   * @returns 更新された顧客エンティティ
   */
  async update(customer: Customer): Promise<Customer> {
    if (!this.customers.has(customer.id)) {
      throw new Error(`Customer with id ${customer.id} not found`);
    }
    this.customers.set(customer.id, customer);
    return customer;
  }

  /**
   * 顧客を削除する
   * @param id 顧客ID
   */
  async delete(id: string): Promise<void> {
    if (!this.customers.has(id)) {
      throw new Error(`Customer with id ${id} not found`);
    }
    this.customers.delete(id);
  }

  /**
   * 顧客IDから顧客を検索する
   * @param id 顧客ID
   * @returns 顧客エンティティ、またはnull
   */
  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  /**
   * 顧客一覧を取得・検索する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns 顧客一覧とページネーション情報
   */
  async findAll(query: CustomerListQuery): Promise<CustomerListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // 全顧客を取得
    let filteredCustomers = Array.from(this.customers.values());

    // 検索条件でフィルタリング
    if (query.name) {
      filteredCustomers = filteredCustomers.filter((c) =>
        c.name.toLowerCase().includes(query.name!.toLowerCase()),
      );
    }
    if (query.email) {
      filteredCustomers = filteredCustomers.filter((c) =>
        c.email.toLowerCase().includes(query.email!.toLowerCase()),
      );
    }
    if (query.company) {
      filteredCustomers = filteredCustomers.filter((c) =>
        c.company?.toLowerCase().includes(query.company!.toLowerCase()),
      );
    }
    if (query.status) {
      filteredCustomers = filteredCustomers.filter((c) => c.status.getValue() === query.status);
    }

    // 総件数を取得
    const total = filteredCustomers.length;

    // ページネーション
    const offset = (page - 1) * limit;
    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

    return {
      customers: paginatedCustomers,
      total,
      page,
      limit,
    };
  }
}

