/**
 * IpAllowListRepository
 *
 * IP AllowListリポジトリの実装（スタブ実装）
 * 初期実装では常に0を返す
 * TODO: IP AllowList機能実装後に実際のカウントを返す
 */

import { Injectable } from '@nestjs/common';
import { IIpAllowListRepository } from '../../domain/repositories/ip-allowlist.repository.interface';

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
}

