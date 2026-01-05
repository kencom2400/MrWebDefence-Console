/**
 * Auth Controller Test
 *
 * 認証コントローラーのテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LoginUseCase, AuthenticationError } from '../../application/use-cases/login.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;

  beforeEach(async () => {
    // Jest型定義の制約によりany使用
    mockLoginUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: mockLoginUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    const loginRequest: LoginRequestDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('正常系: ログインに成功する', async () => {
      // Arrange
      const expectedResult = {
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
      };

      mockLoginUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(loginRequest);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        loginRequest.email,
        loginRequest.password,
      );
    });

    it('異常系: 認証エラーの場合はUnauthorizedExceptionを投げる', async () => {
      // Arrange
      mockLoginUseCase.execute.mockRejectedValue(new AuthenticationError());

      // Act & Assert
      await expect(controller.login(loginRequest)).rejects.toThrow(UnauthorizedException);
      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        loginRequest.email,
        loginRequest.password,
      );
    });
  });
});

