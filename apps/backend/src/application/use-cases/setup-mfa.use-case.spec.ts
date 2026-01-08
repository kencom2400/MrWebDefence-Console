/**
 * SetupMfaUseCase Test
 *
 * MFAセットアップユースケースのテスト
 */

import { SetupMfaUseCase } from './setup-mfa.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { TotpService } from '../../infrastructure/services/totp.service';
import { QrCodeService } from '../../infrastructure/services/qr-code.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';

describe('SetupMfaUseCase', () => {
  let setupMfaUseCase: SetupMfaUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockTotpService: jest.Mocked<TotpService>;
  let mockQrCodeService: jest.Mocked<QrCodeService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockTotpService = {
      generateSecret: jest.fn(),
      generate: jest.fn(),
      verify: jest.fn(),
      generateKeyUri: jest.fn(),
    } as any;

    mockQrCodeService = {
      generateDataUrl: jest.fn(),
    } as any;

    setupMfaUseCase = new SetupMfaUseCase(
      mockUserRepository,
      mockTotpService,
      mockQrCodeService,
    );
  });

  describe('execute', () => {
    const userId = 'user-id-123';
    const email = 'user@example.com';
    const hashedPassword = '$2b$10$hashedpassword';
    const role = UserRole.SERVICE_MEMBER;

    it('正常系: MFAセットアップに成功する', async () => {
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
      const secret = 'JBSWY3DPEHPK3PXP';
      const otpauthUri = 'otpauth://totp/MrWebDefence:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MrWebDefence';
      const qrCodeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';

      mockUserRepository.findById.mockResolvedValue(user);
      mockTotpService.generateSecret.mockReturnValue(secret);
      mockTotpService.generateKeyUri.mockReturnValue(otpauthUri);
      mockQrCodeService.generateDataUrl.mockResolvedValue(qrCodeDataUrl);

      // Act
      const result = await setupMfaUseCase.execute(userId);

      // Assert
      expect(result.qrCodeDataUrl).toBe(qrCodeDataUrl);
      expect(result.secret).toBe(secret);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockTotpService.generateSecret).toHaveBeenCalled();
      expect(mockTotpService.generateKeyUri).toHaveBeenCalledWith(secret, email, 'MrWebDefence');
      expect(mockQrCodeService.generateDataUrl).toHaveBeenCalledWith(otpauthUri);
    });

    it('異常系: ユーザーが見つからない場合はエラーを投げる', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(setupMfaUseCase.execute(userId)).rejects.toThrow('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockTotpService.generateSecret).not.toHaveBeenCalled();
    });

    it('異常系: MFAが既に有効な場合はエラーを投げる', async () => {
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

      // Act & Assert
      await expect(setupMfaUseCase.execute(userId)).rejects.toThrow('MFA is already enabled');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockTotpService.generateSecret).not.toHaveBeenCalled();
    });
  });
});

