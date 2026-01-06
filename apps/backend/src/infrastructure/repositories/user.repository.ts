/**
 * User Repository Implementation
 *
 * ユーザーリポジトリの実装
 * 初期実装ではJSONファイルを使用（将来はDBに移行可能な設計）
 */

import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import * as fs from 'fs/promises';
import * as path from 'path';

interface UserData {
  id: string;
  email: string;
  hashedPassword: string;
  createdAt: string;
  updatedAt: string;
}

export class UserRepository implements IUserRepository {
  private readonly dataFilePath: string;

  constructor(dataFilePath?: string) {
    this.dataFilePath = dataFilePath || path.join(process.cwd(), 'data', 'users.json');
  }

  /**
   * メールアドレスでユーザーを検索する
   */
  public async findByEmail(email: string): Promise<User | null> {
    const users: User[] = await this.loadUsers();
    const user: User | undefined = users.find((u: User) => u.email === email);
    return user || null;
  }

  /**
   * ユーザーIDでユーザーを検索する
   */
  public async findById(id: string): Promise<User | null> {
    const users: User[] = await this.loadUsers();
    const user: User | undefined = users.find((u: User) => u.id === id);
    return user || null;
  }

  /**
   * ユーザーを保存する
   */
  public async save(user: User): Promise<User> {
    const users: User[] = await this.loadUsers();
    const existingIndex: number = users.findIndex((u: User) => u.id === user.id);

    if (existingIndex >= 0) {
      // 既存ユーザーの更新
      users[existingIndex] = user;
    } else {
      // 新規ユーザーの追加
      users.push(user);
    }

    await this.saveUsers(users);
    return user;
  }

  /**
   * JSONファイルからユーザー一覧を読み込む
   */
  private async loadUsers(): Promise<User[]> {
    try {
      const data: string = await fs.readFile(this.dataFilePath, 'utf-8');
      const rawDataList: unknown = JSON.parse(data);

      // データが配列であることを確認
      if (!Array.isArray(rawDataList)) {
        throw new Error('User data is not an array');
      }

      // 各要素がUserDataの構造を持っているか簡易チェック
      const userDataList: UserData[] = rawDataList.map((item: unknown) => {
        if (
          typeof item !== 'object' ||
          item === null ||
          !('id' in item) ||
          !('email' in item) ||
          !('hashedPassword' in item) ||
          !('createdAt' in item) ||
          !('updatedAt' in item)
        ) {
          throw new Error('Invalid user data structure');
        }
        return item as UserData;
      });

      return userDataList.map((data: UserData) =>
        User.reconstruct(
          data.id,
          data.email,
          data.hashedPassword,
          new Date(data.createdAt),
          new Date(data.updatedAt),
        ),
      );
    } catch (error: unknown) {
      // ファイルが存在しない場合は空配列を返す
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * ユーザー一覧をJSONファイルに保存する
   */
  private async saveUsers(users: User[]): Promise<void> {
    const userDataList: UserData[] = users.map((user: User) => ({
      id: user.id,
      email: user.email,
      hashedPassword: user.hashedPassword,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    // ディレクトリが存在しない場合は作成
    const dir: string = path.dirname(this.dataFilePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(this.dataFilePath, JSON.stringify(userDataList, null, 2), 'utf-8');
  }
}

