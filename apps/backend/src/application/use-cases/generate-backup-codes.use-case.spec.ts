/**
 * GenerateBackupCodesUseCase Test
 *
 * バックアップコード生成ユースケースのテスト
 */

import { GenerateBackupCodesUseCase } from './generate-backup-codes.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { BackupCodeService } from '../../infrastructure/services/backup-code.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';

describe('GenerateBackupCodesUseCase', () => {
  let generateBackupCodesUseCase: GenerateBackupCodesUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockMfaRepository: jest.Mocked<IMfaRepository>;
  let mockBackupCodeService: jest.Mocked<BackupCodeService>;

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
      getAllBackupCodeRecords: jest.fn(),
    } as any;

    mockBackupCodeService = {
      generateCodes: jest.fn(),
      hash: jest.fn(),
      verify: jest.fn(),
      hashCodes: jest.fn(),
      getCodeCount: jest.fn(),
    } as any;

    generateBackupCodesUseCase = new GenerateBackupCodesUseCase(
      mockUserRepository,
      mockMfaRepository,
      mockBackupCodeService,
    );
  });

  describe('execute', () => {
    const userId = 'user-id-123';

    it('正常系: バックアップコードを生成する', async () => {
      // Arrange
      const mockUser = User.reconstruct(
        userId,
        'user@example.com',
        '$2b$10$hashedPassword',
        UserRole.SERVICE_MEMBER,
        false,
        null,
        new Date(),
        new Date(),
      );

      const codes = [
        'ABCD-1234',
        'EFGH-5678',
        'IJKL-9012',
        'MNOP-3456',
        'QRST-7890',
        'UVWX-1357',
        'YZAB-2468',
        'CDEF-3690',
        'GHIJ-4701',
        'KLMN-5812',
      ];
      const codeHashes = [
        '$2b$10$hash1',
        '$2b$10$hash2',
        '$2b$10$hash3',
        '$2b$10$hash4',
        '$2b$10$hash5',
        '$2b$10$hash6',
        '$2b$10$hash7',
        '$2b$10$hash8',
        '$2b$10$hash9',
        '$2b$10$hash10',
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockBackupCodeService.generateCodes.mockReturnValue(codes);
      mockBackupCodeService.hashCodes.mockResolvedValue(codeHashes);
      mockMfaRepository.saveBackupCodes.mockResolvedValue();

      // Act
      const result = await generateBackupCodesUseCase.execute(userId);

      // Assert
      expect(result.codes).toEqual(codes);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockBackupCodeService.generateCodes).toHaveBeenCalled();
      expect(mockBackupCodeService.hashCodes).toHaveBeenCalledWith(codes);
      expect(mockMfaRepository.saveBackupCodes).toHaveBeenCalledWith(userId, codeHashes);
    });
  });
});
