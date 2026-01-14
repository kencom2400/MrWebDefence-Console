/**
 * DeleteUserUseCase
 *
 * ユーザー削除処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * ユーザー削除処理を実行する
   * @param id ユーザーID
   * @throws NotFoundException ユーザーが見つからない場合
   */
  public async execute(id: string): Promise<void> {
    // ユーザーの存在確認
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ユーザーを削除
    await this.userRepository.delete(id);
  }
}
