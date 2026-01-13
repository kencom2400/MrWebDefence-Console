/**
 * Login Use Case Test
 *
 * ログイン処理のユースケースのテスト
 */

import { LoginUseCase, AuthenticationError } from './login.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    // Jest型定義の制約によりany使用
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;

    mockJwtService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
      getExpiresIn: jest.fn().mockReturnValue(1800),
    } as any;

    loginUseCase = new LoginUseCase(mockUserRepository, mockPasswordService, mockJwtService);
  });

  describe('execute', () => {
    const email: string = 'user@example.com';
    const password: string = 'password123';
    const hashedPassword: string = '$2b$10$hashedpassword';
    const userId: string = 'user-id-123';
    const role: UserRole = UserRole.SERVICE_MEMBER;

    it('正常系: ログインに成功する', async () => {
      // Arrange
      const user: User = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );
      const accessToken: string = 'jwt-token';

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.generateToken.mockReturnValue(accessToken);

      // Act
      const result = await loginUseCase.execute(email, password);

      // Assert
      // MFA無効なユーザーなので、通常のログイン成功レスポンスを返す
      if ('accessToken' in result) {
        expect(result.accessToken).toBe(accessToken);
        expect(result.tokenType).toBe('Bearer');
        expect(result.expiresIn).toBe(1800);
      } else {
        fail('Expected accessToken in result');
      }
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(userId, email, role);
    });

    it('異常系: ユーザーが見つからない場合はAuthenticationErrorを投げる', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUseCase.execute(email, password)).rejects.toThrow(AuthenticationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });

    it('異常系: パスワードが一致しない場合はAuthenticationErrorを投げる', async () => {
      // Arrange
      const user: User = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUseCase.execute(email, password)).rejects.toThrow(AuthenticationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });
  });
});

 *
 * ログイン処理のユースケースのテスト
 */

import { LoginUseCase, AuthenticationError } from './login.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    // Jest型定義の制約によりany使用
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;

    mockJwtService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
      getExpiresIn: jest.fn().mockReturnValue(1800),
    } as any;

    loginUseCase = new LoginUseCase(mockUserRepository, mockPasswordService, mockJwtService);
  });

  describe('execute', () => {
    const email: string = 'user@example.com';
    const password: string = 'password123';
    const hashedPassword: string = '$2b$10$hashedpassword';
    const userId: string = 'user-id-123';
    const role: UserRole = UserRole.SERVICE_MEMBER;

    it('正常系: ログインに成功する', async () => {
      // Arrange
      const user: User = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );
      const accessToken: string = 'jwt-token';

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.generateToken.mockReturnValue(accessToken);

      // Act
      const result = await loginUseCase.execute(email, password);

      // Assert
      // MFA無効なユーザーなので、通常のログイン成功レスポンスを返す
      if ('accessToken' in result) {
        expect(result.accessToken).toBe(accessToken);
        expect(result.tokenType).toBe('Bearer');
        expect(result.expiresIn).toBe(1800);
      } else {
        fail('Expected accessToken in result');
      }
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(userId, email, role);
    });

    it('異常系: ユーザーが見つからない場合はAuthenticationErrorを投げる', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUseCase.execute(email, password)).rejects.toThrow(AuthenticationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });

    it('異常系: パスワードが一致しない場合はAuthenticationErrorを投げる', async () => {
      // Arrange
      const user: User = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUseCase.execute(email, password)).rejects.toThrow(AuthenticationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });
  });
});

 *
 * ログイン処理のユースケースのテスト
 */

import { LoginUseCase, AuthenticationError } from './login.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    // Jest型定義の制約によりany使用
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;

    mockJwtService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
      getExpiresIn: jest.fn().mockReturnValue(1800),
    } as any;

    loginUseCase = new LoginUseCase(mockUserRepository, mockPasswordService, mockJwtService);
  });

  describe('execute', () => {
    const email: string = 'user@example.com';
    const password: string = 'password123';
    const hashedPassword: string = '$2b$10$hashedpassword';
    const userId: string = 'user-id-123';
    const role: UserRole = UserRole.SERVICE_MEMBER;

    it('正常系: ログインに成功する', async () => {
      // Arrange
      const user: User = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );
      const accessToken: string = 'jwt-token';

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.generateToken.mockReturnValue(accessToken);

      // Act
      const result = await loginUseCase.execute(email, password);

      // Assert
      // MFA無効なユーザーなので、通常のログイン成功レスポンスを返す
      if ('accessToken' in result) {
        expect(result.accessToken).toBe(accessToken);
        expect(result.tokenType).toBe('Bearer');
        expect(result.expiresIn).toBe(1800);
      } else {
        fail('Expected accessToken in result');
      }
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.generateToken).toHaveBeenCalledWith(userId, email, role);
    });

    it('異常系: ユーザーが見つからない場合はAuthenticationErrorを投げる', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUseCase.execute(email, password)).rejects.toThrow(AuthenticationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });

    it('異常系: パスワードが一致しない場合はAuthenticationErrorを投げる', async () => {
      // Arrange
      const user: User = User.reconstruct(
        userId,
        email,
        hashedPassword,
        role,
        false, // mfaEnabled
        null, // mfaSecret
        new Date(),
        new Date(),
      );

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordService.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUseCase.execute(email, password)).rejects.toThrow(AuthenticationError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockJwtService.generateToken).not.toHaveBeenCalled();
    });
  });
});
