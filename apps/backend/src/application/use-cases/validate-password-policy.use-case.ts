/**
 * ValidatePasswordPolicyUseCase
 *
 * パスワードポリシーを検証するUse Case
 * Application層に位置し、ビジネスロジックを実装
 */

import { Injectable, Inject } from '@nestjs/common';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { PasswordService } from '../../infrastructure/services/password.service';
import { IPasswordHistoryRepository } from '../../domain/repositories/password-history.repository.interface';

/**
 * パスワード検証結果
 */
export interface ValidatePasswordResult {
  isValid: boolean;
  errors: string[];
  strengthScore: number;
  isReused: boolean;
  message?: string;
}

@Injectable()
export class ValidatePasswordPolicyUseCase {
  constructor(
    @Inject(PasswordPolicyService)
    private readonly passwordPolicyService: PasswordPolicyService,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    @Inject('IPasswordHistoryRepository')
    private readonly passwordHistoryRepository: IPasswordHistoryRepository,
  ) {}

  /**
   * パスワードポリシーを検証する
   * @param userId ユーザーID（履歴チェック用、オプション）
   * @param password 検証するパスワード
   * @returns 検証結果
   */
  public async execute(userId: string | null, password: string): Promise<ValidatePasswordResult> {
    // パスワードポリシーを取得
    const policy = this.passwordPolicyService.createPasswordPolicy();

    // パスワードの複雑さチェック
    const validationResult = policy.validate(password);

    // パスワード強度スコアを計算（検証失敗時も計算）
    const strengthScore = this.passwordPolicyService.calculateStrengthScore(password);

    // 検証が成功した場合のみ、パスワード履歴をチェック
    // ドメイン層はインフラ層に依存しないため、ユースケース層で比較ロジックを実装
    let isReused = false;
    if (validationResult.isValid && userId) {
      const history = await this.passwordHistoryRepository.getPasswordHistory(
        userId,
        policy.historyCount,
      );
      for (const hash of history) {
        const isMatch = await this.passwordService.compare(password, hash);
        if (isMatch) {
          isReused = true;
          break;
        }
      }
    }

    // 結果を返却
    if (isReused) {
      return {
        isValid: false,
        errors: ['Password has been used recently'],
        strengthScore,
        isReused: true,
        message: 'Password has been used recently',
      };
    }

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      strengthScore,
      isReused: false,
    };
  }
}
