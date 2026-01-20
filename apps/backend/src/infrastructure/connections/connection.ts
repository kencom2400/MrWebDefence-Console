/**
 * Connection
 *
 * データベース接続の具象クラス
 * Infrastructure Layerに位置し、IConnectionインターフェースを実装
 */

import { IConnection } from '../../domain/entities/connection.entity';
import { v4 as uuidv4 } from 'uuid';
import { PoolConnection } from 'mysql2/promise';

/**
 * データベース接続の具象クラス
 * MySQL接続をラップしてIConnectionインターフェースを実装
 */
export class Connection implements IConnection {
  public readonly id: string;
  public readonly createdAt: Date;
  public lastUsedAt: Date;
  private readonly mysqlConnection: PoolConnection;
  private _isClosed: boolean = false;

  constructor(mysqlConnection: PoolConnection) {
    this.id = uuidv4();
    this.createdAt = new Date();
    this.lastUsedAt = new Date();
    this.mysqlConnection = mysqlConnection;
  }

  /**
   * 接続が有効かどうかを確認します
   * @returns 接続が有効な場合true、無効な場合false
   */
  async isValid(): Promise<boolean> {
    if (this._isClosed) {
      return false;
    }

    try {
      // 簡単なクエリを実行して接続の有効性を確認
      await this.mysqlConnection.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 接続を閉じます
   */
  async close(): Promise<void> {
    if (this._isClosed) {
      return;
    }

    try {
      await this.mysqlConnection.release();
      this._isClosed = true;
    } catch (error) {
      // エラーが発生しても閉じたことにする
    this._isClosed = true;
      throw error;
    }
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

  /**
   * 内部のMySQL接続を取得します（テスト用）
   * @returns MySQL接続
   */
  getMysqlConnection(): PoolConnection {
    return this.mysqlConnection;
  }
}
