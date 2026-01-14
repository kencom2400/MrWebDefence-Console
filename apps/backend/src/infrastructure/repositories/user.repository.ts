/**
 * UserRepository
 *
 * ユーザーリポジトリ（インメモリ実装）
 * 本来はデータベースに接続するが、現段階ではメモリ上でデータを管理する
 */

import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  UserListQuery,
  UserListResult,
} from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/entities/user-role.enum';

@Injectable()
export class UserRepository implements IUserRepository {
  // メモリ上でユーザーデータを保持するマップ（IDベース）
  // 本番環境ではデータベースに置き換える
  private users: Map<string, User> = new Map();

  // メールアドレスからIDを検索するためのマップ（大文字小文字を区別しない）
  private emailToIdMap: Map<string, string> = new Map();

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
    this.users.set(testUser.id, testUser);
    this.emailToIdMap.set(testUser.email.toLowerCase(), testUser.id);

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
    this.users.set(adminUser.id, adminUser);
    this.emailToIdMap.set(adminUser.email.toLowerCase(), adminUser.id);
  }

  /**
   * ユーザーを作成する
   * @param user ユーザーエンティティ
   * @returns 作成されたユーザーエンティティ
   */
  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    this.emailToIdMap.set(user.email.toLowerCase(), user.id);
    return user;
  }

  /**
   * ユーザーを更新する
   * @param user ユーザーエンティティ
   * @returns 更新されたユーザーエンティティ
   */
  async update(user: User): Promise<User> {
    if (!this.users.has(user.id)) {
      throw new Error(`User with id ${user.id} not found`);
    }

    // メールアドレスが変更された場合、emailToIdMapを更新
    const existingUser = this.users.get(user.id);
    if (existingUser && existingUser.email.toLowerCase() !== user.email.toLowerCase()) {
      // 古いメールアドレスのマッピングを削除
      this.emailToIdMap.delete(existingUser.email.toLowerCase());
      // 新しいメールアドレスのマッピングを追加
      this.emailToIdMap.set(user.email.toLowerCase(), user.id);
    }

    this.users.set(user.id, user);
    return user;
  }

  /**
   * ユーザーを削除する
   * @param id ユーザーID
   */
  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    // メールアドレスのマッピングを削除
    this.emailToIdMap.delete(user.email.toLowerCase());
    this.users.delete(id);
  }

  /**
   * ユーザーIDからユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザーエンティティ、またはnull
   */
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   * メールアドレスからユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザーエンティティ、またはnull
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const userId = this.emailToIdMap.get(normalizedEmail);
    if (!userId) {
      return null;
    }
    return this.users.get(userId) || null;
  }

  /**
   * ユーザー一覧を取得・検索する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns ユーザー一覧とページネーション情報
   */
  async findAll(query: UserListQuery): Promise<UserListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // 全ユーザーを取得
    let filteredUsers = Array.from(this.users.values());

    // 検索条件でフィルタリング
    if (query.email) {
      filteredUsers = filteredUsers.filter((u) =>
        u.email.toLowerCase().includes(query.email!.toLowerCase()),
      );
    }
    if (query.role) {
      filteredUsers = filteredUsers.filter((u) => u.role === query.role);
    }

    // 総件数を取得
    const total = filteredUsers.length;

    // ページネーション
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
    };
  }

  /**
   * ユーザーを保存する（非推奨）
   * @param user ユーザーエンティティ
   * @deprecated createまたはupdateを使用してください
   */
  async save(user: User): Promise<void> {
    // 既存のユーザーの場合はupdate、新規の場合はcreate
    if (this.users.has(user.id)) {
      await this.update(user);
    } else {
      await this.create(user);
    }
  }
}
