/**
 * CreateApiTokenUseCase Test
 *
 * APIトークン作成処理のユースケースのテスト
 */

import { CreateApiTokenUseCase } from './create-api-token.use-case';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';
import { ApiToken } from '../../domain/entities/api-token.entity';
import { ApiTokenService } from '../../infrastructure/services/api-token.service';
import { randomUUID } from 'crypto';

describe('CreateApiTokenUseCase', () => {
  let createApiTokenUseCase: CreateApiTokenUseCase;
  let mockApiTokenRepository: jest.Mocked<IApiTokenRepository>;
  let mockApiTokenService: jest.Mocked<ApiTokenService>;

  beforeEach(() => {
    mockApiTokenRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTokenHash: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockApiTokenService = {
      generateSecret: jest.fn(),
      hashToken: jest.fn(),
      verifyToken: jest.fn(),
      extractPrefix: jest.fn(),
      extractSecret: jest.fn(),
      buildFullToken: jest.fn(),
      getDefaultPrefix: jest.fn(),
    } as any;

    createApiTokenUseCase = new CreateApiTokenUseCase(mockApiTokenRepository, mockApiTokenService);
  });

  describe('execute', () => {
    const command = {
      name: 'WAF Engine Production Token',
      description: 'Production環境のWAFエンジン用トークン',
      expiresAt: null as Date | null,
      createdBy: randomUUID(),
    };

    it('正常系: APIトークンを作成できる', async () => {
      // Arrange
      const secret = 'random-secret-string';
      const tokenHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // bcryptハッシュ（60文字以上）
      const prefix = 'waf_';
      const fullToken = 'waf_random-secret-string';
      const tokenPreview = 'waf_random-secret...';

      mockApiTokenService.getDefaultPrefix.mockReturnValue(prefix);
      mockApiTokenService.generateSecret.mockReturnValue(secret);
      mockApiTokenService.hashToken.mockResolvedValue(tokenHash);
      mockApiTokenService.buildFullToken.mockReturnValue(fullToken);

      const tokenId = randomUUID();
      const savedToken = ApiToken.create(
        tokenId,
        command.name,
        command.description,
        tokenHash,
        prefix,
        command.expiresAt,
        command.createdBy,
      );

      mockApiTokenRepository.save.mockImplementation(async (token) => {
        // UseCase内で生成されたIDを使用してトークンを作成
        return ApiToken.create(
          token.id,
          token.name,
          token.description,
          token.tokenHash,
          token.tokenPrefix,
          token.expiresAt,
          token.createdBy,
        );
      });

      // Act
      const result = await createApiTokenUseCase.execute(command);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.name).toBe(command.name);
      expect(result.description).toBe(command.description);
      expect(result.token).toBe(fullToken);
      expect(result.tokenPrefix).toBe(prefix);
      expect(result.expiresAt).toBeNull();
      expect(result.createdBy).toBe(command.createdBy);

      expect(mockApiTokenService.generateSecret).toHaveBeenCalled();
      expect(mockApiTokenService.hashToken).toHaveBeenCalledWith(secret);
      expect(mockApiTokenService.buildFullToken).toHaveBeenCalledWith(prefix, secret);
      expect(mockApiTokenRepository.save).toHaveBeenCalled();
    });

    it('正常系: 有効期限を設定してAPIトークンを作成できる', async () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 86400000); // 1日後
      const commandWithExpiresAt = { ...command, expiresAt };

      const secret = 'random-secret-string';
      const tokenHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // bcryptハッシュ（60文字以上）
      const prefix = 'waf_';
      const fullToken = 'waf_random-secret-string';

      mockApiTokenService.getDefaultPrefix.mockReturnValue(prefix);
      mockApiTokenService.generateSecret.mockReturnValue(secret);
      mockApiTokenService.hashToken.mockResolvedValue(tokenHash);
      mockApiTokenService.buildFullToken.mockReturnValue(fullToken);

      mockApiTokenRepository.save.mockImplementation(async (token) => {
        // UseCase内で生成されたIDを使用してトークンを作成
        return ApiToken.create(
          token.id,
          token.name,
          token.description,
          token.tokenHash,
          token.tokenPrefix,
          token.expiresAt,
          token.createdBy,
        );
      });

      // Act
      const result = await createApiTokenUseCase.execute(commandWithExpiresAt);

      // Assert
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('正常系: 説明なしでAPIトークンを作成できる', async () => {
      // Arrange
      const commandWithoutDescription = { ...command, description: null };

      const secret = 'random-secret-string';
      const tokenHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // bcryptハッシュ（60文字以上）
      const prefix = 'waf_';
      const fullToken = 'waf_random-secret-string';

      mockApiTokenService.getDefaultPrefix.mockReturnValue(prefix);
      mockApiTokenService.generateSecret.mockReturnValue(secret);
      mockApiTokenService.hashToken.mockResolvedValue(tokenHash);
      mockApiTokenService.buildFullToken.mockReturnValue(fullToken);

      mockApiTokenRepository.save.mockImplementation(async (token) => {
        // UseCase内で生成されたIDを使用してトークンを作成
        return ApiToken.create(
          token.id,
          token.name,
          token.description,
          token.tokenHash,
          token.tokenPrefix,
          token.expiresAt,
          token.createdBy,
        );
      });

      // Act
      const result = await createApiTokenUseCase.execute(commandWithoutDescription);

      // Assert
      expect(result.description).toBeNull();
    });
  });
});
