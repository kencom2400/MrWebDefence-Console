/**
 * User Repository Interface
 *
 * ユーザーリポジトリのインターフェース定義
 * ドメイン層に定義し、アプリケーション層から使用される
 */

import { User } from '../entities/user.entity';

export interface IUserRepository {
  /**
   * メールアドレスでユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザーエンティティ、見つからない場合はnull
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * ユーザーIDでユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザーエンティティ、見つからない場合はnull
   */
  findById(id: string): Promise<User | null>;

  /**
   * ユーザーを保存する
   * @param user ユーザーエンティティ
   * @returns 保存されたユーザーエンティティ
   */
  save(user: User): Promise<User>;
}

