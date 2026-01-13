/**
 * ValidatePasswordPolicyUseCase のユニットテスト
 */

import { ValidatePasswordPolicyUseCase, ValidatePasswordResult } from './validate-password-policy.use-case';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { PasswordService } from '../../infrastructure/services/password.service';
import { IPasswordHistoryRepository } from '../../domain/repositories/password-history.repository.interface';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

describe('ValidatePasswordPolicyUseCase', () => {
  let useCase: ValidatePasswordPolicyUseCase;
  let passwordPolicyService: jest.Mocked<PasswordPolicyService>;
  let passwordService: jest.Mocked<PasswordService>;
  let passwordHistoryRepository: jest.Mocked<IPasswordHistoryRepository>;

  beforeEach(() => {
    passwordPolicyService = {
      createPasswordPolicy: jest.fn(),
      calculateStrengthScore: jest.fn(),
    } as any;

    passwordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    } as any;

    passwordHistoryRepository = {
      savePasswordHistory: jest.fn(),
      getPasswordHistory: jest.fn(),
      checkPasswordInHistory: jest.fn(),
      checkPasswordInHistoryByPlainText: jest.fn(),
      deleteOldHistory: jest.fn(),
    } as any;

    useCase = new ValidatePasswordPolicyUseCase(
      passwordPolicyService,
      passwordService,
      passwordHistoryRepository,
    );
  });

  describe('execute', () => {
    it('正常系: 有効なパスワードを検証できる', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordPolicyService.calculateStrengthScore.mockReturnValue(85);

      const result = await useCase.execute('user-1', 'Password123!');

      expect(passwordPolicyService.createPasswordPolicy).toHaveBeenCalledTimes(1);
      expect(passwordPolicyService.calculateStrengthScore).toHaveBeenCalledWith('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strengthScore).toBe(85);
      expect(result.isReused).toBe(false);
    });

    it('正常系: 無効なパスワードを検証できる', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordPolicyService.calculateStrengthScore.mockReturnValue(45);

      const result = await useCase.execute('user-1', 'short');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strengthScore).toBe(45);
      expect(result.isReused).toBe(false);
    });

    it('正常系: 検証失敗時も強度スコアを計算する', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordPolicyService.calculateStrengthScore.mockReturnValue(30);

      const result = await useCase.execute('user-1', 'nouppercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strengthScore).toBe(30);
    });

    it('正常系: 再利用されたパスワードを検出できる', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordPolicyService.calculateStrengthScore.mockReturnValue(85);
      passwordHistoryRepository.checkPasswordInHistoryByPlainText.mockResolvedValue(true);

      const result = await useCase.execute('user-1', 'Password123!');

      expect(passwordHistoryRepository.checkPasswordInHistoryByPlainText).toHaveBeenCalledWith(
        'user-1',
        'Password123!',
        passwordService,
        mockPolicy.historyCount,
      );
      expect(result.isValid).toBe(false);
      expect(result.isReused).toBe(true);
      expect(result.message).toBe('Password has been used recently');
    });

    it('正常系: userIdがnullの場合、履歴チェックをスキップする', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordPolicyService.calculateStrengthScore.mockReturnValue(85);

      const result = await useCase.execute(null, 'Password123!');

      expect(passwordHistoryRepository.checkPasswordInHistoryByPlainText).not.toHaveBeenCalled();
      expect(result.isValid).toBe(true);
      expect(result.isReused).toBe(false);
    });

    it('正常系: 検証失敗時は履歴チェックをスキップする', async () => {
      const mockPolicy = PasswordPolicy.create();
      passwordPolicyService.createPasswordPolicy.mockReturnValue(mockPolicy);
      passwordPolicyService.calculateStrengthScore.mockReturnValue(30);

      const result = await useCase.execute('user-1', 'short');

      expect(passwordHistoryRepository.checkPasswordInHistoryByPlainText).not.toHaveBeenCalled();
      expect(result.isValid).toBe(false);
      expect(result.isReused).toBe(false);
    });
  });
});

