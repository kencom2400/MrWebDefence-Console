/**
 * ChangePasswordUseCase
 *
 * パスワード変更処理を実行するUse Case
 * Application層に位置し、ビジネスロジックを実装
 */

import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordHistoryRepository } from '../../domain/repositories/password-history.repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { PasswordPolicyService } from '../../infrastructure/services/password-policy.service';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHistoryRepository')
    private readonly passwordHistoryRepository: IPasswordHistoryRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    @Inject(PasswordPolicyService)
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  /**
   * パスワード変更処理を実行する
   * @param userId ユーザーID
   * @param currentPassword 現在のパスワード
   * @param newPassword 新しいパスワード
   * @throws UnauthorizedException 現在のパスワードが間違っている場合
   * @throws BadRequestException パスワードポリシー違反または再利用の場合
   * @throws NotFoundException ユーザーが見つからない場合
   */
  public async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // ユーザーを取得
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 現在のパスワードを検証
    const isCurrentPasswordValid = await this.passwordService.compare(
      currentPassword,
      user.hashedPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // パスワードポリシーを取得
    const policy = this.passwordPolicyService.createPasswordPolicy();

    // 新しいパスワードのポリシー検証
    const validationResult = policy.validate(newPassword);
    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet policy requirements',
        error: 'Bad Request',
        errorCode: 'PASSWORD_POLICY_VIOLATION',
        errors: validationResult.errors,
      });
    }

    // パスワード履歴をチェック（平文パスワードを使用してbcrypt.compareで比較）
    // ドメイン層はインフラ層に依存しないため、ユースケース層で比較ロジックを実装
    const history = await this.passwordHistoryRepository.getPasswordHistory(
      userId,
      policy.historyCount,
    );
    let isReused = false;
    for (const hash of history) {
      const isMatch = await this.passwordService.compare(newPassword, hash);
      if (isMatch) {
        isReused = true;
        break;
      }
    }
    if (isReused) {
      throw new BadRequestException({
        message: 'Password has been used recently. Please choose a different password.',
        error: 'Bad Request',
        errorCode: 'PASSWORD_REUSED',
      });
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await this.passwordService.hash(newPassword);

    // パスワード履歴に保存
    await this.passwordHistoryRepository.savePasswordHistory(userId, newPasswordHash);

    // 古い履歴を削除（最新N個のみ保持）
    await this.passwordHistoryRepository.deleteOldHistory(userId, policy.historyCount);

    // ユーザーエンティティを更新（不変性のため新しいインスタンスを作成）
    const updatedUser = user.updatePassword(newPasswordHash);
    await this.userRepository.save(updatedUser);
  }
}
