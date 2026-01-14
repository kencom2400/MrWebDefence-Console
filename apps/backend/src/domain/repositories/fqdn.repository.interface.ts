/**
 * IFqdnRepository
 *
 * FQDNリポジトリのインターフェース
 * ドメイン層に定義され、インフラストラクチャ層で実装される
 */

import { Fqdn } from '../entities/fqdn.entity';
import { FqdnStatusEnum } from '../value-objects/fqdn-status.value-object';

/**
 * FQDN一覧取得・検索のクエリパラメータ
 */
export interface FqdnListQuery {
  fqdn?: string;
  status?: FqdnStatusEnum;
  page?: number;
  limit?: number;
}

/**
 * FQDN一覧取得・検索の結果
 */
export interface FqdnListResult {
  fqdns: Fqdn[];
  total: number;
  page: number;
  limit: number;
}

export interface IFqdnRepository {
  /**
   * FQDNを作成する
   * @param fqdn FQDNエンティティ
   * @returns 作成されたFQDNエンティティ
   */
  create(fqdn: Fqdn): Promise<Fqdn>;

  /**
   * FQDNを更新する
   * @param fqdn FQDNエンティティ
   * @returns 更新されたFQDNエンティティ
   */
  update(fqdn: Fqdn): Promise<Fqdn>;

  /**
   * FQDNを削除する
   * @param id FQDN ID
   * @returns 削除が成功した場合はvoid
   */
  delete(id: string): Promise<void>;

  /**
   * FQDN IDからFQDNを検索する
   * @param id FQDN ID
   * @returns FQDNエンティティ、またはnull
   */
  findById(id: string): Promise<Fqdn | null>;

  /**
   * FQDN文字列からFQDNを検索する
   * @param fqdn FQDN文字列
   * @returns FQDNエンティティ、またはnull
   */
  findByFqdn(fqdn: string): Promise<Fqdn | null>;

  /**
   * FQDN一覧を取得・検索する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns FQDN一覧とページネーション情報
   */
  findAll(query: FqdnListQuery): Promise<FqdnListResult>;
}
