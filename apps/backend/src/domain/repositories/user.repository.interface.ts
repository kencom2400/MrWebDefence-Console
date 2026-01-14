/**
 * IUserRepository
 *
 * ユーザーリポジトリのインターフェース
 * ドメイン層に定義され、インフラストラクチャ層で実装される
 */

import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.enum';

/**
 * ユーザー一覧取得・検索のクエリパラメータ
 */
export interface UserListQuery {
  email?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

/**
 * ユーザー一覧取得・検索の結果
 */
export interface UserListResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface IUserRepository {
  /**
   * ユーザーを作成する
   * @param user ユーザーエンティティ
   * @returns 作成されたユーザーエンティティ
   */
  create(user: User): Promise<User>;

  /**
   * ユーザーを更新する
   * @param user ユーザーエンティティ
   * @returns 更新されたユーザーエンティティ
   */
  update(user: User): Promise<User>;

  /**
   * ユーザーを削除する
   * @param id ユーザーID
   * @returns 削除が成功した場合true、ユーザーが見つからない場合false
   */
  delete(id: string): Promise<boolean>;

  /**
   * ユーザーIDからユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザーエンティティ、またはnull
   */
  findById(id: string): Promise<User | null>;

  /**
   * メールアドレスからユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザーエンティティ、またはnull
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * ユーザー一覧を取得・検索する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns ユーザー一覧とページネーション情報
   */
  findAll(query: UserListQuery): Promise<UserListResult>;

  /**
   * ユーザーを保存する（非推奨）
   * @param user ユーザーエンティティ
   * @deprecated createまたはupdateを使用してください
   */
  save(user: User): Promise<void>;
}
