/**
 * PasswordPolicyService のユニットテスト
 */

import { PasswordPolicyService } from './password-policy.service';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;

  beforeEach(() => {
    service = new PasswordPolicyService();
  });

  describe('createPasswordPolicy', () => {
    it('正常系: デフォルトのパスワードポリシーを作成できる', () => {
      const policy = service.createPasswordPolicy();

      expect(policy).toBeInstanceOf(PasswordPolicy);
      expect(policy.minLength).toBe(8);
      expect(policy.maxLength).toBe(128);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSymbols).toBe(true);
      expect(policy.historyCount).toBe(5);
    });
  });

  describe('calculateStrengthScore', () => {
    it('正常系: 空文字列の場合は0点', () => {
      const score = service.calculateStrengthScore('');
      expect(score).toBe(0);
    });

    it('正常系: nullの場合は0点', () => {
      const score = service.calculateStrengthScore(null as any);
      expect(score).toBe(0);
    });

    it('正常系: 短いパスワードは低スコア', () => {
      const score = service.calculateStrengthScore('Pass1!');
      expect(score).toBeLessThan(60);
    });

    it('正常系: 長いパスワードは高スコア', () => {
      const score = service.calculateStrengthScore('VeryLongPassword123!@#$%');
      expect(score).toBeGreaterThan(50);
    });

    it('正常系: すべての文字種を含むパスワードは高スコア', () => {
      const score = service.calculateStrengthScore('Password123!');
      expect(score).toBeGreaterThan(50);
    });

    it('正常系: 12文字以上で全文字種を含むパスワードは非常に高スコア', () => {
      const score = service.calculateStrengthScore('Password123!@');
      expect(score).toBeGreaterThan(60);
    });

    it('正常系: 一般的なパスワードパターンはペナルティ', () => {
      const commonScore = service.calculateStrengthScore('password123!');
      const uniqueScore = service.calculateStrengthScore('MyUniquePass123!');
      expect(uniqueScore).toBeGreaterThan(commonScore);
    });

    it('正常系: 連続文字はペナルティ', () => {
      const consecutiveScore = service.calculateStrengthScore('Password111!');
      const noConsecutiveScore = service.calculateStrengthScore('Password123!');
      expect(noConsecutiveScore).toBeGreaterThanOrEqual(consecutiveScore);
    });

    it('正常系: スコアは0-100の範囲内', () => {
      const scores = [
        service.calculateStrengthScore(''),
        service.calculateStrengthScore('a'),
        service.calculateStrengthScore('Password123!'),
        service.calculateStrengthScore('VeryLongAndComplexPassword123!@#$%^&*()'),
      ];

      for (const score of scores) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it('正常系: 16文字以上で3種類以上の文字種を含むパスワードはボーナス', () => {
      const score = service.calculateStrengthScore('VeryLongPassword123');
      expect(score).toBeGreaterThan(50);
    });
  });
});
