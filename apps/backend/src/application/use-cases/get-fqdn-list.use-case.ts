/**
 * GetFqdnListUseCase
 *
 * FQDN一覧取得・検索処理のユースケース
 */

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IFqdnRepository,
  FqdnListQuery,
  FqdnListResult,
} from '../../domain/repositories/fqdn.repository.interface';

@Injectable()
export class GetFqdnListUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
  ) {}

  /**
   * FQDN一覧取得・検索処理を実行する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns FQDN一覧とページネーション情報
   * @throws BadRequestException ページネーションパラメータが無効な場合
   */
  public async execute(query: FqdnListQuery): Promise<FqdnListResult> {
    // デフォルト値の設定
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // ページネーションのバリデーション
    if (page < 1) {
      throw new BadRequestException('Page must be a positive number');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    // リポジトリからFQDN一覧を取得
    return await this.fqdnRepository.findAll({
      fqdn: query.fqdn,
      status: query.status,
      page,
      limit,
    });
  }
}
