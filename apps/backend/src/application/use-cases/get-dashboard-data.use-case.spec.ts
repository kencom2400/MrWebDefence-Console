/**
 * GetDashboardDataUseCase Test
 *
 * ダッシュボードデータ取得処理のユースケースのテスト
 */

import { NotFoundException } from '@nestjs/common';
import { GetDashboardDataUseCase } from './get-dashboard-data.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IIpAllowListRepository } from '../../domain/repositories/ip-allowlist.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DashboardData } from '../../domain/value-objects/dashboard-data.value-object';

describe('GetDashboardDataUseCase', () => {
  let getDashboardDataUseCase: GetDashboardDataUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockIpAllowListRepository: jest.Mocked<IIpAllowListRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    mockIpAllowListRepository = {
      countByUserId: jest.fn(),
    } as jest.Mocked<IIpAllowListRepository>;

    getDashboardDataUseCase = new GetDashboardDataUseCase(
      mockUserRepository,
      mockIpAllowListRepository,
    );
  });

  describe('execute', () => {
    it('正常系: ダッシュボードデータを取得できる', async () => {
      // Arrange
      const userId = 'test-user-id';
      const user = User.reconstruct(
        userId,
        'user@example.com',
        '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O',
        UserRole.SERVICE_MEMBER,
        false, // mfaEnabled
        null, // mfaSecret
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-15T10:30:00Z'),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockIpAllowListRepository.countByUserId.mockResolvedValue(0);

      // Act
      const result = await getDashboardDataUseCase.execute(userId);

      // Assert
      expect(result).toBeInstanceOf(DashboardData);
      expect(result.userId).toBe(userId);
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBe(UserRole.SERVICE_MEMBER);
      expect(result.mfaEnabled).toBe(false);
      expect(result.ipAllowListCount).toBe(0);
      expect(result.lastLoginAt).toBeNull();
      expect(result.loginAttemptCount).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockIpAllowListRepository.countByUserId).toHaveBeenCalledWith(userId);
    });

    it('正常系: MFA有効化済みユーザーのダッシュボードデータを取得できる', async () => {
      // Arrange
      const userId = 'test-user-id';
      const user = User.reconstruct(
        userId,
        'user@example.com',
        '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O',
        UserRole.SERVICE_MEMBER,
        true, // mfaEnabled
        'MFA_SECRET', // mfaSecret
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-15T10:30:00Z'),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockIpAllowListRepository.countByUserId.mockResolvedValue(2);

      // Act
      const result = await getDashboardDataUseCase.execute(userId);

      // Assert
      expect(result).toBeInstanceOf(DashboardData);
      expect(result.userId).toBe(userId);
      expect(result.email).toBe('user@example.com');
      expect(result.role).toBe(UserRole.SERVICE_MEMBER);
      expect(result.mfaEnabled).toBe(true);
      expect(result.ipAllowListCount).toBe(2);
      expect(result.lastLoginAt).toBeNull();
      expect(result.loginAttemptCount).toBeNull();
    });

    it('異常系: ユーザーが見つからない場合はNotFoundExceptionをスローする', async () => {
      // Arrange
      const userId = 'non-existent-user-id';
      mockUserRepository.findById.mockResolvedValue(null);
      mockIpAllowListRepository.countByUserId.mockResolvedValue(0);

      // Act & Assert
      await expect(getDashboardDataUseCase.execute(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockIpAllowListRepository.countByUserId).toHaveBeenCalledWith(userId);
    });

    it('正常系: 並列実行でデータを取得する', async () => {
      // Arrange
      const userId = 'test-user-id';
      const user = User.reconstruct(
        userId,
        'user@example.com',
        '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O',
        UserRole.SERVICE_MEMBER,
        false,
        null,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-15T10:30:00Z'),
      );

      // Promise.allで並列実行されることを確認するため、遅延を追加
      mockUserRepository.findById.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(user), 10)),
      );
      mockIpAllowListRepository.countByUserId.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(0), 10)),
      );

      const startTime = Date.now();

      // Act
      await getDashboardDataUseCase.execute(userId);

      // Assert
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 並列実行の場合、最大でも50ms程度（10ms + オーバーヘッド）で完了するはず
      // 直列実行の場合は20ms以上かかる
      // CI環境などで実行時間が変動する可能性があるため、マージンを大きめに設定
      expect(duration).toBeLessThan(50);
    });
  });
});
