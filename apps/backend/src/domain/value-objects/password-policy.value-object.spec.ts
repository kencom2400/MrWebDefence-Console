/**
 * PasswordPolicy Value Object のユニットテスト
 */

import { BadRequestException } from '@nestjs/common';
import { PasswordPolicy } from './password-policy.value-object';

describe('PasswordPolicy', () => {
  describe('create', () => {
    it('正常系: デフォルト値でPasswordPolicyを作成できる', () => {
      const policy = PasswordPolicy.create();

      expect(policy.minLength).toBe(8);
      expect(policy.maxLength).toBe(128);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSymbols).toBe(true);
      expect(policy.historyCount).toBe(5);
    });

    it('正常系: カスタム値でPasswordPolicyを作成できる', () => {
      const policy = PasswordPolicy.create(10, 64, true, true, true, false, 10);

      expect(policy.minLength).toBe(10);
      expect(policy.maxLength).toBe(64);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSymbols).toBe(false);
      expect(policy.historyCount).toBe(10);
    });

    it('異常系: minLengthが0以下の場合、エラーが発生する', () => {
      expect(() => PasswordPolicy.create(0)).toThrow(BadRequestException);
      expect(() => PasswordPolicy.create(-1)).toThrow(BadRequestException);
    });

    it('異常系: maxLengthがminLengthより小さい場合、エラーが発生する', () => {
      expect(() => PasswordPolicy.create(10, 5)).toThrow(BadRequestException);
    });

    it('異常系: maxLengthが1024より大きい場合、エラーが発生する', () => {
      expect(() => PasswordPolicy.create(8, 1025)).toThrow(BadRequestException);
    });

    it('異常系: historyCountが負数の場合、エラーが発生する', () => {
      expect(() => PasswordPolicy.create(8, 128, true, true, true, true, -1)).toThrow(
        BadRequestException,
      );
    });

    it('異常系: historyCountが100より大きい場合、エラーが発生する', () => {
      expect(() => PasswordPolicy.create(8, 128, true, true, true, true, 101)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validate', () => {
    let policy: PasswordPolicy;

    beforeEach(() => {
      policy = PasswordPolicy.create();
    });

    it('正常系: 有効なパスワードを検証できる', () => {
      const result = policy.validate('Password123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('正常系: 長い有効なパスワードを検証できる', () => {
      const result = policy.validate('VeryLongPassword123!@#$%^&*()');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('異常系: パスワードが空文字列の場合、エラーが返される', () => {
      const result = policy.validate('');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('異常系: パスワードがnullの場合、エラーが返される', () => {
      const result = policy.validate(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('異常系: パスワードが短すぎる場合、エラーが返される', () => {
      const result = policy.validate('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('異常系: パスワードが長すぎる場合、エラーが返される', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = policy.validate(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at most 128 characters long');
    });

    it('異常系: 大文字が含まれていない場合、エラーが返される', () => {
      const result = policy.validate('password123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('異常系: 小文字が含まれていない場合、エラーが返される', () => {
      const result = policy.validate('PASSWORD123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('異常系: 数字が含まれていない場合、エラーが返される', () => {
      const result = policy.validate('Password!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('異常系: 記号が含まれていない場合、エラーが返される', () => {
      const result = policy.validate('Password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one symbol');
    });

    it('異常系: 複数の要件を満たさない場合、複数のエラーが返される', () => {
      const result = policy.validate('short');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one symbol');
    });

    it('正常系: 記号が不要なポリシーで、記号なしのパスワードが有効', () => {
      const customPolicy = PasswordPolicy.create(8, 128, true, true, true, false, 5);
      const result = customPolicy.validate('Password123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('equals', () => {
    it('正常系: 同じ設定のPasswordPolicyは等価', () => {
      const policy1 = PasswordPolicy.create();
      const policy2 = PasswordPolicy.create();

      expect(policy1.equals(policy2)).toBe(true);
    });

    it('正常系: 異なる設定のPasswordPolicyは等価でない', () => {
      const policy1 = PasswordPolicy.create();
      const policy2 = PasswordPolicy.create(10, 128, true, true, true, true, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: minLengthが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(10, 128, true, true, true, true, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: maxLengthが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(8, 64, true, true, true, true, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: requireUppercaseが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(8, 128, false, true, true, true, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: requireLowercaseが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(8, 128, true, false, true, true, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: requireNumbersが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(8, 128, true, true, false, true, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: requireSymbolsが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(8, 128, true, true, true, false, 5);

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('正常系: historyCountが異なる場合、等価でない', () => {
      const policy1 = PasswordPolicy.create(8, 128, true, true, true, true, 5);
      const policy2 = PasswordPolicy.create(8, 128, true, true, true, true, 10);

      expect(policy1.equals(policy2)).toBe(false);
    });
  });
});
