/**
 * IPasswordHistoryRepository Interface
 *
 * パスワード履歴関連データのリポジトリインターフェース
 * ドメイン層に位置し、外部に依存しない
 */

export interface IPasswordHistoryRepository {
  /**
   * パスワード履歴を保存する
   * @param userId ユーザーID
   * @param passwordHash ハッシュ化されたパスワード
   * @returns Promise<void>
   */
  savePasswordHistory(userId: string, passwordHash: string): Promise<void>;

  /**
   * パスワード履歴を取得する（最新N個）
   * @param userId ユーザーID
   * @param count 取得する履歴数
   * @returns ハッシュ化されたパスワードの配列（最新順）
   */
  getPasswordHistory(userId: string, count: number): Promise<string[]>;

  /**
   * パスワードが履歴に含まれているかチェックする
   * @param userId ユーザーID
   * @param passwordHash ハッシュ化されたパスワード
   * @param count チェックする履歴数
   * @returns 履歴に含まれている場合true、そうでない場合false
   */
  checkPasswordInHistory(userId: string, passwordHash: string, count: number): Promise<boolean>;

  /**
   * 古いパスワード履歴を削除する（最新N個を保持）
   * @param userId ユーザーID
   * @param keepCount 保持する履歴数
   * @returns Promise<void>
   */
  deleteOldHistory(userId: string, keepCount: number): Promise<void>;
}

