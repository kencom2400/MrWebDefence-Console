/**
 * PasswordHistoryRepository
 *
 * パスワード履歴関連データのリポジトリ実装（インメモリ）
 * Infrastructure層に位置し、初期実装ではインメモリストレージを使用
 * 将来はデータベースに移行予定
 */

import { Injectable } from '@nestjs/common';
import { IPasswordHistoryRepository } from '../../domain/repositories/password-history.repository.interface';

/**
 * パスワード履歴エントリ
 */
interface PasswordHistoryEntry {
  passwordHash: string;
  createdAt: Date;
}

@Injectable()
export class PasswordHistoryRepository implements IPasswordHistoryRepository {
  // インメモリストレージ: Map<userId, PasswordHistoryEntry[]>
  private readonly historyStore: Map<string, PasswordHistoryEntry[]> = new Map();

  /**
   * パスワード履歴を保存する
   * @param userId ユーザーID
   * @param passwordHash ハッシュ化されたパスワード
   * @returns Promise<void>
   */
  public async savePasswordHistory(userId: string, passwordHash: string): Promise<void> {
    if (!this.historyStore.has(userId)) {
      this.historyStore.set(userId, []);
    }

    const history = this.historyStore.get(userId)!;
    history.push({
      passwordHash,
      createdAt: new Date(),
    });
  }

  /**
   * パスワード履歴を取得する（最新N個）
   * @param userId ユーザーID
   * @param count 取得する履歴数
   * @returns ハッシュ化されたパスワードの配列（最新順）
   */
  public async getPasswordHistory(userId: string, count: number): Promise<string[]> {
    if (!this.historyStore.has(userId)) {
      return [];
    }

    const history = this.historyStore.get(userId)!;
    const sortedHistory = this.getSortedHistory(history);
    return sortedHistory.slice(0, count).map((entry) => entry.passwordHash);
  }

  /**
   * パスワードが履歴に含まれているかチェックする（ハッシュ比較）
   * @param userId ユーザーID
   * @param passwordHash ハッシュ化されたパスワード
   * @param count チェックする履歴数
   * @returns 履歴に含まれている場合true、そうでない場合false
   * @deprecated bcryptは毎回異なるハッシュを生成するため、このメソッドは使用しない。
   * 代わりに、ユースケース層でgetPasswordHistoryを使用して履歴を取得し、
   * PasswordService.compareを使用して比較するロジックを実装する。
   */
  public async checkPasswordInHistory(
    userId: string,
    passwordHash: string,
    count: number,
  ): Promise<boolean> {
    const history = await this.getPasswordHistory(userId, count);
    return history.includes(passwordHash);
  }

  /**
   * 古いパスワード履歴を削除する（最新N個を保持）
   * @param userId ユーザーID
   * @param keepCount 保持する履歴数
   * @returns Promise<void>
   */
  public async deleteOldHistory(userId: string, keepCount: number): Promise<void> {
    if (!this.historyStore.has(userId)) {
      return;
    }

    const history = this.historyStore.get(userId)!;
    const sortedHistory = this.getSortedHistory(history);
    // 最新N個のみ保持
    const keptHistory = sortedHistory.slice(0, keepCount);
    this.historyStore.set(userId, keptHistory);
  }

  /**
   * パスワード履歴をソートする（作成日時の降順）
   * @param history パスワード履歴エントリの配列
   * @returns ソート済みのパスワード履歴エントリの配列（最新が先頭）
   */
  private getSortedHistory(history: PasswordHistoryEntry[]): PasswordHistoryEntry[] {
    return [...history].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
