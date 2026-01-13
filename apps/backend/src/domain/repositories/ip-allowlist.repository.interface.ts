/**
 * IIpAllowListRepository Interface
 *
 * IP AllowList関連データのリポジトリインターフェース
 * ドメイン層に位置し、外部に依存しない
 */

export interface IIpAllowListRepository {
  /**
   * ユーザーIDに紐づくIP AllowListの数を取得する
   * @param userId ユーザーID
   * @returns IP AllowList数
   */
  countByUserId(userId: string): Promise<number>;
}
