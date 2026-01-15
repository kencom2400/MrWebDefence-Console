/**
 * ConnectionPoolStatus Value Object
 *
 * 接続プール状態の値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

/**
 * 接続プール状態の値オブジェクト
 */
export class ConnectionPoolStatus {
  public readonly activeConnections: number;
  public readonly idleConnections: number;
  public readonly totalConnections: number;
  public readonly waitingRequests: number;
  public readonly isHealthy: boolean;

  private constructor(
    activeConnections: number,
    idleConnections: number,
    totalConnections: number,
    waitingRequests: number,
    isHealthy: boolean,
  ) {
    this.activeConnections = activeConnections;
    this.idleConnections = idleConnections;
    this.totalConnections = totalConnections;
    this.waitingRequests = waitingRequests;
    this.isHealthy = isHealthy;
  }

  /**
   * 接続プール状態を作成する
   * @param activeConnections アクティブな接続数
   * @param idleConnections アイドルな接続数
   * @param waitingRequests 接続待ちのリクエスト数
   * @param minConnections 最小接続数
   * @param maxConnections 最大接続数
   * @returns ConnectionPoolStatus Value Object
   */
  public static create(
    activeConnections: number,
    idleConnections: number,
    waitingRequests: number,
    minConnections: number,
    maxConnections: number,
  ): ConnectionPoolStatus {
    const totalConnections = activeConnections + idleConnections;
    const isHealthy = totalConnections >= minConnections && totalConnections <= maxConnections;

    return new ConnectionPoolStatus(
      activeConnections,
      idleConnections,
      totalConnections,
      waitingRequests,
      isHealthy,
    );
  }

  /**
   * 別の状態オブジェクトと等しいかどうかを判定します
   * @param other 比較対象の状態オブジェクト
   * @returns 等しい場合true、そうでない場合false
   */
  public equals(other: ConnectionPoolStatus): boolean {
    return (
      this.activeConnections === other.activeConnections &&
      this.idleConnections === other.idleConnections &&
      this.totalConnections === other.totalConnections &&
      this.waitingRequests === other.waitingRequests &&
      this.isHealthy === other.isHealthy
    );
  }
}
