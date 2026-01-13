/**
 * GetPasswordPolicyUseCase のユニットテスト
 */

import { GetPasswordPolicyUseCase } from './get-password-policy.use-case';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

describe('GetPasswordPolicyUseCase', () => {
  let useCase: GetPasswordPolicyUseCase;
  let passwordPolicyService: jest.Mocked<PasswordPolicyService>;

  beforeEach(() => {
    passwordPolicyService = {
      createPasswordPolicy: jest.fn(),
      calculateStrengthScore: jest.fn(),
    } as any;

    useCase = new GetPasswordPolicyUseCase(passwordPolicyService);
  });

  describe('execute', () => {
    it('正常系: パスワードポリシー設定を取得できる', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      const result = await useCase.execute();

      expect(passwordPolicyService.createPasswordPolicy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        minLength: mockPolicy.minLength,
        maxLength: mockPolicy.maxLength,
        requireUppercase: mockPolicy.requireUppercase,
        requireLowercase: mockPolicy.requireLowercase,
        requireNumbers: mockPolicy.requireNumbers,
        requireSymbols: mockPolicy.requireSymbols,
        historyCount: mockPolicy.historyCount,
      });
    });

    it('正常系: カスタムポリシー設定を取得できる', async () => {
      const mockPolicy = PasswordPolicy.create(10, 64, true, true, true, false, 10);
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      const result = await useCase.execute();

      expect(result).toEqual({
        minLength: 10,
        maxLength: 64,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        historyCount: 10,
      });
    });
  });
});
 * GetPasswordPolicyUseCase のユニットテスト
 */

import { GetPasswordPolicyUseCase } from './get-password-policy.use-case';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

describe('GetPasswordPolicyUseCase', () => {
  let useCase: GetPasswordPolicyUseCase;
  let passwordPolicyService: jest.Mocked<PasswordPolicyService>;

  beforeEach(() => {
    passwordPolicyService = {
      createPasswordPolicy: jest.fn(),
      calculateStrengthScore: jest.fn(),
    } as any;

    useCase = new GetPasswordPolicyUseCase(passwordPolicyService);
  });

  describe('execute', () => {
    it('正常系: パスワードポリシー設定を取得できる', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      const result = await useCase.execute();

      expect(passwordPolicyService.createPasswordPolicy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        minLength: mockPolicy.minLength,
        maxLength: mockPolicy.maxLength,
        requireUppercase: mockPolicy.requireUppercase,
        requireLowercase: mockPolicy.requireLowercase,
        requireNumbers: mockPolicy.requireNumbers,
        requireSymbols: mockPolicy.requireSymbols,
        historyCount: mockPolicy.historyCount,
      });
    });

    it('正常系: カスタムポリシー設定を取得できる', async () => {
      const mockPolicy = PasswordPolicy.create(10, 64, true, true, true, false, 10);
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      const result = await useCase.execute();

      expect(result).toEqual({
        minLength: 10,
        maxLength: 64,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        historyCount: 10,
      });
    });
  });
});
 * GetPasswordPolicyUseCase のユニットテスト
 */

import { GetPasswordPolicyUseCase } from './get-password-policy.use-case';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

describe('GetPasswordPolicyUseCase', () => {
  let useCase: GetPasswordPolicyUseCase;
  let passwordPolicyService: jest.Mocked<PasswordPolicyService>;

  beforeEach(() => {
    passwordPolicyService = {
      createPasswordPolicy: jest.fn(),
      calculateStrengthScore: jest.fn(),
    } as any;

    useCase = new GetPasswordPolicyUseCase(passwordPolicyService);
  });

  describe('execute', () => {
    it('正常系: パスワードポリシー設定を取得できる', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      const result = await useCase.execute();

      expect(passwordPolicyService.createPasswordPolicy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        minLength: mockPolicy.minLength,
        maxLength: mockPolicy.maxLength,
        requireUppercase: mockPolicy.requireUppercase,
        requireLowercase: mockPolicy.requireLowercase,
        requireNumbers: mockPolicy.requireNumbers,
        requireSymbols: mockPolicy.requireSymbols,
        historyCount: mockPolicy.historyCount,
      });
    });

    it('正常系: カスタムポリシー設定を取得できる', async () => {
      const mockPolicy = PasswordPolicy.create(10, 64, true, true, true, false, 10);
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);

      const result = await useCase.execute();

      expect(result).toEqual({
        minLength: 10,
        maxLength: 64,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        historyCount: 10,
      });
    });
  });
});
