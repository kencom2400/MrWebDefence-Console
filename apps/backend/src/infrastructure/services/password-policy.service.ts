/**
 * PasswordPolicyService
 *
 * パスワードポリシー関連の技術的実装を担当するサービス
 * Infrastructure層に位置し、Value Objectの生成（ファクトリ）と
 * パスワード強度スコア計算などの技術的な処理を提供
 */

import { Injectable } from '@nestjs/common';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

@Injectable()
export class PasswordPolicyService {
  /**
   * デフォルトのパスワードポリシーを作成する
   * @returns PasswordPolicy Value Object
   */
  public createPasswordPolicy(): PasswordPolicy {
    // 環境変数から設定を読み込む（将来実装）
    // 現時点ではデフォルト値を使用
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10);
    const maxLength = parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10);
    const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false';
    const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false';
    const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS !== 'false';
    const requireSymbols = process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false'; // デフォルトtrue
    const historyCount = parseInt(process.env.PASSWORD_HISTORY_COUNT || '5', 10);

    return PasswordPolicy.create(
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
   * パスワードの強度スコアを計算する（0-100）
   * @param password パスワード
   * @returns 強度スコア（0-100）
   */
  public calculateStrengthScore(password: string): number {
    if (!password || password.length === 0) {
      return 0;
    }

    let score = 0;

    // 長さによるスコア（最大40点）
    const lengthScore = Math.min(password.length * 2, 40);
    score += lengthScore;

    // 文字種の多様性によるスコア（最大40点）
    let diversityScore = 0;
    if (/[a-z]/.test(password)) diversityScore += 10;
    if (/[A-Z]/.test(password)) diversityScore += 10;
    if (/[0-9]/.test(password)) diversityScore += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) diversityScore += 10;
    score += diversityScore;

    // 複雑さによるボーナス（最大20点）
    // 長さが12文字以上で、すべての文字種を含む場合にボーナス
    if (password.length >= 12) {
      const hasAllTypes =
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
      if (hasAllTypes) {
        score += 20;
      } else if (password.length >= 16) {
        // 長さが16文字以上の場合、文字種が3種類以上あればボーナス
        let typeCount = 0;
        if (/[a-z]/.test(password)) typeCount++;
        if (/[A-Z]/.test(password)) typeCount++;
        if (/[0-9]/.test(password)) typeCount++;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) typeCount++;
        if (typeCount >= 3) {
          score += 10;
        }
      }
    }

    // 一般的なパスワードパターンのペナルティ（最大-20点）
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i,
    ];
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 20;
        break;
      }
    }

    // 連続文字のペナルティ（最大-10点）
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
    }

    // スコアを0-100の範囲に制限
    return Math.max(0, Math.min(100, score));
  }
}
