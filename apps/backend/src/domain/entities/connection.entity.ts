/**
 * IConnection Interface
 *
 * データベース接続のインターフェース
 * ドメイン層に位置し、外部に依存しない
 */

/**
 * データベース接続のインターフェース
 */
export interface IConnection {
  /**
   * 接続の一意なID
   */
  readonly id: string;

  /**
   * 接続作成日時
   */
  readonly createdAt: Date;

  /**
   * 最終使用日時
   */
  readonly lastUsedAt: Date;

  /**
   * 接続が有効かどうかを確認します
   * @returns 接続が有効な場合true、無効な場合false
   */
  isValid(): Promise<boolean>;

  /**
   * 接続を閉じます
   */
  close(): Promise<void>;
}
