/**
 * GetPasswordPolicyUseCase
 *
 * パスワードポリシー設定を取得するUse Case
 * Application層に位置し、ビジネスロジックを実装
 */

import { Injectable, Inject } from '@nestjs/common';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';
import { PasswordPolicy } from '../../domain/value-objects/password-policy.value-object';

/**
 * パスワードポリシーDTO
 */
export interface PasswordPolicyDto {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  historyCount: number;
}

@Injectable()
export class GetPasswordPolicyUseCase {
  constructor(
    @Inject(PasswordPolicyService)
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  /**
   * パスワードポリシー設定を取得する
   * @returns パスワードポリシー設定
   */
  public async execute(): Promise<PasswordPolicyDto> {
    const policy = this.passwordPolicyService.createPasswordPolicy();
    return this.toDto(policy);
  }

  /**
   * PasswordPolicy Value ObjectをDTOに変換する
   * @param policy PasswordPolicy Value Object
   * @returns PasswordPolicyDto
   */
  private toDto(policy: PasswordPolicy): PasswordPolicyDto {
    return {
      minLength: policy.minLength,
      maxLength: policy.maxLength,
      requireUppercase: policy.requireUppercase,
      requireLowercase: policy.requireLowercase,
      requireNumbers: policy.requireNumbers,
      requireSymbols: policy.requireSymbols,
      historyCount: policy.historyCount,
    };
  }
}

