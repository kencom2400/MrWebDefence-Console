/**
 * DisableMfaUseCase Test
 *
 * MFA無効化ユースケースのテスト
 */

import { DisableMfaUseCase } from './disable-mfa.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';

describe('DisableMfaUseCase', () => {
  let disableMfaUseCase: DisableMfaUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockMfaRepository: jest.Mocked<IMfaRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockMfaRepository = {
      saveSecret: jest.fn(),
      getSecret: jest.fn(),
      deleteSecret: jest.fn(),
      saveBackupCodes: jest.fn(),
      getBackupCodes: jest.fn(),
      markBackupCodeAsUsed: jest.fn(),
      deleteBackupCodes: jest.fn(),
    } as any;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;

    disableMfaUseCase = new DisableMfaUseCase(
      mockUserRepository,
      mockMfaRepository,
      mockPasswordService,
    );
  });

  describe('execute', () => {
    const userId = 'user-id-123';
    const email = 'user@example.com';
    const hashedPassword = '$2b$10$hashedpassword';
    const password = 'password123';
    const role = UserRole.SERVICE_MEMBER;

    it('正常系: MFA無効化に成功する', async () => {
      // Arrange
      const user = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        true, // mfaEnabled
        'existing-secret', // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.save.mockResolvedValue();
      mockMfaRepository.deleteSecret.mockResolvedValue();
      mockMfaRepository.deleteBackupCodes.mockResolvedValue();

      // Act
      await disableMfaUseCase.execute(userId, password);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMfaRepository.deleteSecret).toHaveBeenCalledWith(userId);
      expect(mockMfaRepository.deleteBackupCodes).toHaveBeenCalledWith(userId);
    });

    it('異常系: ユーザーが見つからない場合はエラーを投げる', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(disableMfaUseCase.execute(userId, password)).rejects.toThrow('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
    });

    it('異常系: MFAが既に無効な場合はエラーを投げる', async () => {
      // Arrange
      const user = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(user);

      // Act & Assert
      await expect(disableMfaUseCase.execute(userId, password)).rejects.toThrow('MFA is already disabled');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
    });

    it('異常系: パスワードが一致しない場合はエラーを投げる', async () => {
      // Arrange
      const user = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        true, // mfaEnabled
        'existing-secret', // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(disableMfaUseCase.execute(userId, password)).rejects.toThrow('Invalid password');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});

