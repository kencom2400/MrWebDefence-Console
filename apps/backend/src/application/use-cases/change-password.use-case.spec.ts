/**
 * ChangePasswordUseCase のユニットテスト
 */

import { ChangePasswordUseCase } from './change-password.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordHistoryRepository } from '../../domain/repositories/password-history.repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHistoryRepository: jest.Mocked<IPasswordHistoryRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let passwordPolicyService: jest.Mocked<PasswordPolicyService>;

  const mockUser = User.reconstruct(
    'user-1',
    'test@example.com',
    '$2b$10$hashedPassword',
    UserRole.SERVICE_MEMBER,
    false,
    null,
    new Date(),
    new Date(),
  );

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as any;

    passwordHistoryRepository = {
      savePasswordHistory: jest.fn(),
      getPasswordHistory: jest.fn(),
      checkPasswordInHistory: jest.fn(),
      deleteOldHistory: jest.fn(),
    } as any;

    passwordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;

    passwordPolicyService = {
      createPasswordPolicy: jest.fn(),
      calculateStrengthScore: jest.fn(),
    } as any;

    useCase = new ChangePasswordUseCase(
      userRepository,
      passwordHistoryRepository,
      passwordService,
      passwordPolicyService,
    );
  });

  describe('execute', () => {
    it('正常系: パスワード変更に成功する', async () => {
      const mockPolicy = PasswordPolicy.create();
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordService.hash.mockResolvedValue('$2b$10$newHashedPassword');
      passwordHistoryRepository.checkPasswordInHistory.mockResolvedValue(false);
      userRepository.save.mockResolvedValue(undefined);

      await useCase.execute('user-1', 'CurrentPassword123!', 'NewPassword456@');

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(passwordService.compare).toHaveBeenCalledWith('CurrentPassword123!', mockUser.hashedPassword);
      expect(passwordPolicyService.createPasswordPolicy).toHaveBeenCalledTimes(1);
      expect(passwordService.hash).toHaveBeenCalledWith('NewPassword456@');
      expect(passwordHistoryRepository.checkPasswordInHistory).toHaveBeenCalledWith(
        'user-1',
        '$2b$10$newHashedPassword',
        mockPolicy.historyCount,
      );
      expect(passwordHistoryRepository.savePasswordHistory).toHaveBeenCalledWith(
        'user-1',
        '$2b$10$newHashedPassword',
      );
      expect(passwordHistoryRepository.deleteOldHistory).toHaveBeenCalledWith(
        'user-1',
        mockPolicy.historyCount,
      );
      // 更新後のUserエンティティが保存されることを確認
      expect(userRepository.save).toHaveBeenCalled();
      const savedUser = (userRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.id).toBe(mockUser.id);
      expect(savedUser.hashedPassword).toBe('$2b$10$newHashedPassword');
    });

    it('異常系: ユーザーが見つからない場合、エラーが発生する', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-user', 'CurrentPassword123!', 'NewPassword456@'),
      ).rejects.toThrow(BadRequestException);
    });

    it('異常系: 現在のパスワードが間違っている場合、エラーが発生する', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(
        useCase.execute('user-1', 'WrongPassword123!', 'NewPassword456@'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('異常系: 新しいパスワードがポリシーに違反する場合、エラーが発生する', async () => {
      const mockPolicy = PasswordPolicy.create();
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      await expect(
        useCase.execute('user-1', 'CurrentPassword123!', 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('異常系: 新しいパスワードが再利用されている場合、エラーが発生する', async () => {
      const mockPolicy = PasswordPolicy.create();
      userRepository.findById.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordService.hash.mockResolvedValue('$2b$10$newHashedPassword');
      passwordHistoryRepository.checkPasswordInHistory.mockResolvedValue(true);

      await expect(
        useCase.execute('user-1', 'CurrentPassword123!', 'NewPassword456@'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

