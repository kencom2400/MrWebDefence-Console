/**
 * GetCustomerListUseCase
 *
 * 顧客一覧取得・検索処理のユースケース
 */

import { Injectable, Inject } from '@nestjs/common';
import { ICustomerRepository, CustomerListQuery, CustomerListResult } from '../../domain/repositories/customer.repository.interface';

@Injectable()
export class GetCustomerListUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * 顧客一覧取得・検索処理を実行する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns 顧客一覧とページネーション情報
   */
  public async execute(query: CustomerListQuery): Promise<CustomerListResult> {
    // デフォルト値の設定
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // ページネーションのバリデーション
    if (page < 1) {
      throw new Error('Page must be a positive number');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // リポジトリから顧客一覧を取得
    return await this.customerRepository.findAll({
      name: query.name,
      email: query.email,
      company: query.company,
      status: query.status,
      page,
      limit,
    });
  }
}

