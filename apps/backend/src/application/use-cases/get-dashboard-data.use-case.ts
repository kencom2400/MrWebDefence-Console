/**
 * GetDashboardDataUseCase
 *
 * ダッシュボードデータ取得処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IIpAllowListRepository } from '../../domain/repositories/ip-allowlist.repository.interface';
import { DashboardData } from '../../domain/value-objects/dashboard-data.value-object';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetDashboardDataUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IIpAllowListRepository')
    private readonly ipAllowListRepository: IIpAllowListRepository,
  ) {}

  /**
   * ダッシュボードデータ取得処理を実行する
   * @param userId ユーザーID
   * @returns ダッシュボードデータ
   * @throws NotFoundException ユーザーが見つからない場合
   */
  public async execute(userId: string): Promise<DashboardData> {
    // 並列実行でデータを取得
    const [user, ipAllowListCount] = await Promise.all([
      this.userRepository.findById(userId),
      this.ipAllowListRepository.countByUserId(userId),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // データ集計ロジック（Use Case内で実行）
    return this.aggregateData(user, ipAllowListCount);
  }

  /**
   * データを集計してDashboardData Value Objectを生成する
   * @param user ユーザーエンティティ
   * @param ipAllowListCount IP AllowList数
   * @returns DashboardData Value Object
   */
  private aggregateData(user: User, ipAllowListCount: number): DashboardData {
    return DashboardData.create(
      user.id,
      user.email,
      user.role,
      user.mfaEnabled, // Userエンティティから直接取得
      ipAllowListCount,
      user.createdAt,
      null, // lastLoginAt（将来実装）
      null, // loginAttemptCount（将来実装）
    );
  }
}

