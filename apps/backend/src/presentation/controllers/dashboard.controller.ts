/**
 * DashboardController
 *
 * ダッシュボード関連のHTTPエンドポイントを提供するコントローラー
 * Presentation層に位置し、Application層のUse Casesに依存する
 */

import { Controller, Get, Request, Inject } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { GetDashboardDataUseCase } from '../../application/use-cases/get-dashboard-data.use-case';
import { DashboardDto } from '../dto/dashboard.dto';
import { JwtPayload } from '../../infrastructure/services/jwt.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(
    @Inject(GetDashboardDataUseCase)
    private readonly getDashboardDataUseCase: GetDashboardDataUseCase,
  ) {}

  /**
   * ダッシュボードデータ取得
   * GET /api/v1/dashboard
   */
  // 認証必要（Global Guardによりデフォルトで保護される）
  // ダッシュボードは全てのロールでアクセス可能
  @Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
  @Get()
  public async getDashboard(@Request() req: RequestWithUser): Promise<DashboardDto> {
    const userId = req.user.sub;
    const dashboardData = await this.getDashboardDataUseCase.execute(userId);

    return new DashboardDto(
      dashboardData.userId,
      dashboardData.email,
      dashboardData.role,
      dashboardData.mfaEnabled,
      dashboardData.ipAllowListCount,
      dashboardData.accountCreatedAt.toISOString(),
      dashboardData.lastLoginAt?.toISOString() ?? null,
      dashboardData.loginAttemptCount,
    );
  }
}

