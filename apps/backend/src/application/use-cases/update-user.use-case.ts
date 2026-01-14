/**
 * UpdateUserUseCase
 *
 * ユーザー更新処理のユースケース
 */

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * ユーザー更新処理を実行する
   * @param id ユーザーID
   * @param email メールアドレス（オプション）
   * @returns 更新されたユーザーエンティティ
   * @throws NotFoundException ユーザーが見つからない場合
   * @throws ConflictException メールアドレスが他のユーザーと重複している場合
   */
  public async execute(id: string, email?: string): Promise<User> {
    // ユーザーを取得
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // メールアドレスが変更される場合、重複チェック
    if (email && email !== existingUser.email) {
      const duplicateUser = await this.userRepository.findByEmail(email);
      if (duplicateUser && duplicateUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // ユーザー情報を更新
    const updatedUser = email ? existingUser.updateEmail(email) : existingUser;

    // リポジトリに保存
    return await this.userRepository.update(updatedUser);
  }
}
