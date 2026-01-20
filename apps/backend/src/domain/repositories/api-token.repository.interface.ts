/**
 * IApiTokenRepository
 *
 * APIトークンリポジトリのインターフェース
 * ドメイン層に定義され、インフラストラクチャ層で実装される
 */

import { ApiToken } from '../entities/api-token.entity';

export interface IApiTokenRepository {
  /**
   * APIトークンを保存する
   * @param token APIトークンエンティティ
   * @returns 保存されたAPIトークンエンティティ
   */
  save(token: ApiToken): Promise<ApiToken>;

  /**
   * APIトークンIDからAPIトークンを検索する
   * @param id APIトークンID
   * @returns APIトークンエンティティ、またはnull
   */
  findById(id: string): Promise<ApiToken | null>;

  /**
   * トークンハッシュからAPIトークンを検索する
   * @param tokenHash トークンハッシュ
   * @returns APIトークンエンティティ、またはnull
   */
  findByTokenHash(tokenHash: string): Promise<ApiToken | null>;

  /**
   * すべてのAPIトークンを取得する
   * @returns APIトークンエンティティの配列
   */
  findAll(): Promise<ApiToken[]>;

  /**
   * APIトークンを削除する
   * @param id APIトークンID
   * @returns 削除が成功した場合true、トークンが見つからない場合false
   */
  delete(id: string): Promise<boolean>;
}
