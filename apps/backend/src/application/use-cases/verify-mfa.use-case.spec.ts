/**
 * VerifyMfaUseCase Test
 *
 * MFA検証ユースケースのテスト
 */

import { VerifyMfaUseCase, MfaVerificationType, MfaVerificationContext } from './verify-mfa.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { TotpService } from '../../infrastructure/services/totp.service';
import { BackupCodeService } from '../../infrastructure/services/backup-code.service';
import { GenerateBackupCodesUseCase } from './generate-backup-codes.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';

describe('VerifyMfaUseCase', () => {
  let verifyMfaUseCase: VerifyMfaUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockMfaRepository: jest.Mocked<IMfaRepository>;
  let mockTotpService: jest.Mocked<TotpService>;
  let mockBackupCodeService: jest.Mocked<BackupCodeService>;
  let mockGenerateBackupCodesUseCase: jest.Mocked<GenerateBackupCodesUseCase>;

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
      findBackupCodeByHash: jest.fn(),
    } as any;

    mockTotpService = {
      generateSecret: jest.fn(),
      generate: jest.fn(),
      verify: jest.fn(),
      generateKeyUri: jest.fn(),
    } as any;

    mockBackupCodeService = {
      generateCodes: jest.fn(),
      hash: jest.fn(),
      verify: jest.fn(),
      hashCodes: jest.fn(),
      getCodeCount: jest.fn(),
    } as any;

    mockGenerateBackupCodesUseCase = {
      execute: jest.fn(),
    } as any;

    verifyMfaUseCase = new VerifyMfaUseCase(
      mockUserRepository,
      mockMfaRepository,
      mockTotpService,
      mockBackupCodeService,
      mockGenerateBackupCodesUseCase,
    );
  });

  describe('execute - SETUP context', () => {
    const userId = 'user-id-123';
    const email = 'user@example.com';
    const hashedPassword = '$2b$10$hashedpassword';
    const role = UserRole.SERVICE_MEMBER;
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = '123456';

    it('正常系: セットアップ時のTOTP検証に成功する', async () => {
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
      const backupCodes = ['ABCD-1234', 'EFGH-5678'];

      mockUserRepository.findById.mockResolvedValue(user);
      mockTotpService.verify.mockReturnValue(true);
      mockUserRepository.save.mockResolvedValue();
      mockMfaRepository.saveSecret.mockResolvedValue();
      mockGenerateBackupCodesUseCase.execute.mockResolvedValue({ codes: backupCodes });

      // Act
      const result = await verifyMfaUseCase.execute(
        userId,
        code,
        MfaVerificationType.TOTP,
        MfaVerificationContext.SETUP,
        secret,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.backupCodes).toEqual(backupCodes);
      expect(mockTotpService.verify).toHaveBeenCalledWith(secret, code);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockMfaRepository.saveSecret).toHaveBeenCalledWith(userId, secret);
      expect(mockGenerateBackupCodesUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it('異常系: TOTPコードが無効な場合は失敗する', async () => {
      // Arrange
      const user = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false,
        null,
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockTotpService.verify.mockReturnValue(false);

      // Act
      const result = await verifyMfaUseCase.execute(
        userId,
        code,
        MfaVerificationType.TOTP,
        MfaVerificationContext.SETUP,
        secret,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(mockTotpService.verify).toHaveBeenCalledWith(secret, code);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('execute - LOGIN context', () => {
    const userId = 'user-id-123';
    const email = 'user@example.com';
    const hashedPassword = '$2b$10$hashedpassword';
    const role = UserRole.SERVICE_MEMBER;
    const secret = 'JBSWY3DPEHPK3PXP';
    const code = '123456';

    it('正常系: ログイン時のTOTP検証に成功する', async () => {
      // Arrange
      const user = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        true, // mfaEnabled
        secret, // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockMfaRepository.getSecret.mockResolvedValue(secret);
      mockTotpService.verify.mockReturnValue(true);

      // Act
      const result = await verifyMfaUseCase.execute(
        userId,
        code,
        MfaVerificationType.TOTP,
        MfaVerificationContext.LOGIN,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.backupCodes).toBeUndefined();
      expect(mockMfaRepository.getSecret).toHaveBeenCalledWith(userId);
      expect(mockTotpService.verify).toHaveBeenCalledWith(secret, code);
    });

    it('異常系: MFAシークレットが見つからない場合はエラーを投げる', async () => {
      // Arrange
      const user = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        true,
        secret,
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(user);
      mockMfaRepository.getSecret.mockResolvedValue(null);

      // Act & Assert
      await expect(
        verifyMfaUseCase.execute(
          userId,
          code,
          MfaVerificationType.TOTP,
          MfaVerificationContext.LOGIN,
        ),
      ).rejects.toThrow('MFA secret not found');
    });
  });
});

