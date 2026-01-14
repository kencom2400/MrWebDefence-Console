/**
 * GetUserListUseCase
 *
 * ユーザー一覧取得・検索処理のユースケース
 */

import { Injectable, Inject } from '@nestjs/common';
import {
  IUserRepository,
  UserListQuery,
  UserListResult,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class GetUserListUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * ユーザー一覧取得・検索処理を実行する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns ユーザー一覧とページネーション情報
   * @remarks バリデーションはDTO層（UserListQueryDto）でclass-validatorにより実行されるため、ここでは不要
   */
  public async execute(query: UserListQuery): Promise<UserListResult> {
    // デフォルト値の設定
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // リポジトリからユーザー一覧を取得
    return await this.userRepository.findAll({
      email: query.email,
      role: query.role,
      page,
      limit,
    });
  }
}
