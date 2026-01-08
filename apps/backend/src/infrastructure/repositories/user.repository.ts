import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/entities/user-role.enum';

/**
 * ユーザーリポジトリ（インメモリ実装）
 * 本来はデータベースに接続するが、現段階ではメモリ上でデータを管理する
 */
@Injectable()
export class UserRepository implements IUserRepository {
  // メモリ上でユーザーデータを保持するマップ
  // 本番環境ではデータベースに置き換える
  private users: Map<string, User> = new Map();

  constructor() {
    // テスト用の初期データ
    // パスワードは 'password123' をハッシュ化したもの
    const testUser = User.reconstruct(
      'test-user-id',
      'user@example.com',
      '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O',
      UserRole.SERVICE_MEMBER, // デフォルトロール
      false, // mfaEnabled
      null, // mfaSecret
      new Date(),
      new Date(),
    );
    this.users.set(testUser.email, testUser);

    // 管理者ユーザーの追加
    const adminUser = User.reconstruct(
      'admin-user-id',
      'admin@example.com',
      '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O', // 同じパスワード
      UserRole.SERVICE_ADMIN, // 管理者ロール
      false, // mfaEnabled
      null, // mfaSecret
      new Date(),
      new Date(),
    );
    this.users.set(adminUser.email, adminUser);
  }

  /**
   * メールアドレスからユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザーエンティティ、またはnull
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.users.get(email) || null;
  }

  /**
   * ユーザーIDからユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザーエンティティ、またはnull
   */
  async findById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  /**
   * ユーザーを保存する
   * @param user ユーザーエンティティ
   */
  async save(user: User): Promise<void> {
    this.users.set(user.email, user);
  }
}
