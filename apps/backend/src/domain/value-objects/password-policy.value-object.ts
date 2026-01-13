/**
 * PasswordPolicy Value Object
 *
 * パスワードポリシーの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 * パスワードの複雑さ要件とバリデーションロジックをカプセル化
 */

import { BadRequestException } from '@nestjs/common';

/**
 * パスワードバリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * PasswordPolicy Value Object
 *
 * パスワードポリシー設定をカプセル化し、バリデーションと不変性を保証
 */
export class PasswordPolicy {
  public readonly minLength: number;
  public readonly maxLength: number;
  public readonly requireUppercase: boolean;
  public readonly requireLowercase: boolean;
  public readonly requireNumbers: boolean;
  public readonly requireSymbols: boolean;
  public readonly historyCount: number;

  private constructor(
    minLength: number,
    maxLength: number,
    requireUppercase: boolean,
    requireLowercase: boolean,
    requireNumbers: boolean,
    requireSymbols: boolean,
    historyCount: number,
  ) {
    this.minLength = minLength;
    this.maxLength = maxLength;
    this.requireUppercase = requireUppercase;
    this.requireLowercase = requireLowercase;
    this.requireNumbers = requireNumbers;
    this.requireSymbols = requireSymbols;
    this.historyCount = historyCount;
  }

  /**
   * パスワードポリシーを作成する
   * @param minLength 最小長（デフォルト: 8）
   * @param maxLength 最大長（デフォルト: 128）
   * @param requireUppercase 大文字必須フラグ（デフォルト: true）
   * @param requireLowercase 小文字必須フラグ（デフォルト: true）
   * @param requireNumbers 数字必須フラグ（デフォルト: true）
   * @param requireSymbols 記号必須フラグ（デフォルト: true）
   * @param historyCount 履歴保存数（デフォルト: 5）
   * @returns PasswordPolicy Value Object
   * @throws BadRequestException 無効なパラメータの場合
   */
  public static create(
    minLength: number = 8,
    maxLength: number = 128,
    requireUppercase: boolean = true,
    requireLowercase: boolean = true,
    requireNumbers: boolean = true,
    requireSymbols: boolean = true,
    historyCount: number = 5,
  ): PasswordPolicy {
    // バリデーション
    if (minLength < 1) {
      throw new BadRequestException('Minimum length must be at least 1');
    }
    if (maxLength < minLength) {
      throw new BadRequestException(
        'Maximum length must be greater than or equal to minimum length',
      );
    }
    if (maxLength > 1024) {
      throw new BadRequestException('Maximum length must be at most 1024');
    }
    if (historyCount < 0) {
      throw new BadRequestException('History count must be non-negative');
    }
    if (historyCount > 100) {
      throw new BadRequestException('History count must be at most 100');
    }

    return new PasswordPolicy(
      minLength,
      maxLength,
      requireUppercase,
      requireLowercase,
      requireNumbers,
      requireSymbols,
      historyCount,
    );
  }

  /**
   * パスワードをバリデーションする
   * @param password 検証するパスワード
   * @returns ValidationResult バリデーション結果
   */
  public validate(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      errors.push('Password must be a non-empty string');
      return { isValid: false, errors };
    }

    // 長さチェック
    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }
    if (password.length > this.maxLength) {
      errors.push(`Password must be at most ${this.maxLength} characters long`);
    }

    // 文字種チェック
    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (this.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (this.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (this.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one symbol');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 他のPasswordPolicyと等価かどうかを判定する
   * @param other 比較対象のPasswordPolicy
   * @returns 等価な場合true、そうでない場合false
   */
  public equals(other: PasswordPolicy): boolean {
    return (
      this.minLength === other.minLength &&
      this.maxLength === other.maxLength &&
      this.requireUppercase === other.requireUppercase &&
      this.requireLowercase === other.requireLowercase &&
      this.requireNumbers === other.requireNumbers &&
      this.requireSymbols === other.requireSymbols &&
      this.historyCount === other.historyCount
    );
  }
}
