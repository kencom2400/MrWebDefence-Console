/**
 * GetUserByIdUseCase
 *
 * ユーザー詳細取得処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * ユーザー詳細取得処理を実行する
   * @param id ユーザーID
   * @returns ユーザーエンティティ
   * @throws NotFoundException ユーザーが見つからない場合
   */
  public async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
