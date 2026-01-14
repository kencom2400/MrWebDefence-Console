/**
 * ChangeUserRoleUseCase
 *
 * ユーザーロール変更処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * ユーザーロール変更処理を実行する
   * @param id ユーザーID
   * @param role 新しいロール
   * @returns 更新されたユーザーエンティティ
   * @throws NotFoundException ユーザーが見つからない場合
   */
  public async execute(id: string, role: UserRole): Promise<User> {
    // ユーザーを取得
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ロールを変更
    const updatedUser = user.updateRole(role);

    // リポジトリに保存
    return await this.userRepository.update(updatedUser);
  }
}

