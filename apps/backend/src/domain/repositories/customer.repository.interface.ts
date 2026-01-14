/**
 * ICustomerRepository
 *
 * 顧客リポジトリのインターフェース
 * ドメイン層に定義され、インフラストラクチャ層で実装される
 */

import { Customer } from '../entities/customer.entity';
import { CustomerStatusEnum } from '../value-objects/customer-status.value-object';

/**
 * 顧客一覧取得・検索のクエリパラメータ
 */
export interface CustomerListQuery {
  name?: string;
  email?: string;
  company?: string;
  status?: CustomerStatusEnum;
  page?: number;
  limit?: number;
}

/**
 * 顧客一覧取得・検索の結果
 */
export interface CustomerListResult {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface ICustomerRepository {
  /**
   * 顧客を作成する
   * @param customer 顧客エンティティ
   * @returns 作成された顧客エンティティ
   */
  create(customer: Customer): Promise<Customer>;

  /**
   * 顧客を更新する
   * @param customer 顧客エンティティ
   * @returns 更新された顧客エンティティ
   */
  update(customer: Customer): Promise<Customer>;

  /**
   * 顧客を削除する
   * @param id 顧客ID
   */
  delete(id: string): Promise<void>;

  /**
   * 顧客IDから顧客を検索する
   * @param id 顧客ID
   * @returns 顧客エンティティ、またはnull
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * メールアドレスから顧客を検索する
   * @param email メールアドレス
   * @returns 顧客エンティティ、またはnull
   */
  findByEmail(email: string): Promise<Customer | null>;

  /**
   * 顧客一覧を取得・検索する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns 顧客一覧とページネーション情報
   */
  findAll(query: CustomerListQuery): Promise<CustomerListResult>;
}

