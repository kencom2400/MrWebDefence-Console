/**
 * IConnectionPool Repository Interface
 *
 * 接続プールのリポジトリインターフェース
 * ドメイン層に位置し、外部に依存しない
 */

import { IConnection } from '../entities/connection.entity';
import { ConnectionPoolStatus } from '../value-objects/connection-pool-status.value-object';

/**
 * 接続プールのインターフェース
 */
export interface IConnectionPool {
  /**
   * データベース接続を取得します
   * @returns データベース接続
   * @throws ConnectionTimeoutError 接続取得タイムアウト
   * @throws ConnectionError 接続作成失敗
   */
  getConnection(): Promise<IConnection>;

  /**
   * データベース接続をプールに返却します
   * @param connection 返却する接続オブジェクト
   * @throws InvalidConnectionError 無効な接続オブジェクト
   */
  releaseConnection(connection: IConnection): Promise<void>;

  /**
   * 接続プールの現在の状態を取得します
   * @returns 接続プールの状態
   */
  getStatus(): ConnectionPoolStatus;

  /**
   * 接続プールを初期化します
   * @throws InitializationError 初期化失敗
   */
  initialize(): Promise<void>;

  /**
   * 接続プールを終了し、すべての接続を閉じます
   * @throws DestructionError 終了処理失敗
   */
  destroy(): Promise<void>;
}
