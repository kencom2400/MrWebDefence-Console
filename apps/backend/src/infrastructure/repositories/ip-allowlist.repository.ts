/**
 * IpAllowListRepository
 *
 * IP AllowListリポジトリの実装（スタブ実装）
 * 初期実装では常に0を返す
 * TODO: IP AllowList機能実装後に実際のカウントを返す
 */

import { Injectable } from '@nestjs/common';
import { IIpAllowListRepository } from '../../domain/repositories/ip-allowlist.repository.interface';
import { IpAllowList } from '../../domain/entities/ip-allowlist.entity';

@Injectable()
export class IpAllowListRepository implements IIpAllowListRepository {
  /**
   * ユーザーIDに紐づくIP AllowListの数を取得する（スタブ実装）
   * 初期実装では常に0を返す
   * @param userId ユーザーID
   * @returns IP AllowList数（常に0）
   */
  public async countByUserId(_userId: string): Promise<number> {
    // スタブ実装: 初期実装では常に0を返す
    return 0;
  }

  /**
   * すべてのIP AllowListを取得する（スタブ実装）
   * 初期実装では空配列を返す
   * @returns IP AllowListエンティティの配列（常に空配列）
   */
  public async findAll(): Promise<IpAllowList[]> {
    // スタブ実装: 初期実装では空配列を返す
    return [];
  }
}
