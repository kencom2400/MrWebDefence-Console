/**
 * Connection
 *
 * データベース接続の具象クラス
 * Infrastructure Layerに位置し、IConnectionインターフェースを実装
 */

import { IConnection } from '../../domain/entities/connection.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * データベース接続の具象クラス
 * 注: 現時点ではスタブ実装。将来的に実際のデータベース接続（PostgreSQL等）を実装予定
 */
export class Connection implements IConnection {
  public readonly id: string;
  public readonly createdAt: Date;
  public lastUsedAt: Date;
  private _isClosed: boolean = false;

  constructor() {
    this.id = uuidv4();
    this.createdAt = new Date();
    this.lastUsedAt = new Date();
  }

  /**
   * 接続が有効かどうかを確認します
   * @returns 接続が有効な場合true、無効な場合false
   */
  async isValid(): Promise<boolean> {
    // スタブ実装: 常にtrueを返す
    // 将来的に実際のデータベース接続の有効性を確認する実装に置き換える
    return !this._isClosed;
  }

  /**
   * 接続を閉じます
   */
  async close(): Promise<void> {
    // スタブ実装: 接続を閉じたことを記録
    // 将来的に実際のデータベース接続を閉じる実装に置き換える
    this._isClosed = true;
  }

  /**
   * 最終使用日時を更新します
   */
  updateLastUsedAt(): void {
    this.lastUsedAt = new Date();
  }

  /**
   * 接続が閉じられているかどうかを確認します
   * @returns 閉じられている場合true、そうでない場合false
   */
  isClosed(): boolean {
    return this._isClosed;
  }
}
