import { User } from '../entities/user.entity';

export interface IUserRepository {
  /**
   * メールアドレスからユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザーエンティティ、またはnull
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * ユーザーIDからユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザーエンティティ、またはnull
   */
  findById(id: string): Promise<User | null>;

  /**
   * ユーザーを保存する
   * @param user ユーザーエンティティ
   */
  save(user: User): Promise<void>;
}
