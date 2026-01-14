/**
 * CreateUserUseCase
 *
 * ユーザー作成処理のユースケース
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { PasswordService } from '../../infrastructure/services/password.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * ユーザー作成処理を実行する
   * @param command ユーザー作成コマンド（email, password, role）
   * @returns 作成されたユーザーエンティティ
   * @throws ConflictException 同じメールアドレスのユーザーが既に存在する場合
   */
  public async execute(command: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // パスワードをハッシュ化
    const hashedPassword = await this.passwordService.hash(command.password);

    // ユーザーエンティティを作成
    const userId = randomUUID();
    const user = User.create(
      userId,
      command.email,
      hashedPassword,
      command.role ?? UserRole.SERVICE_MEMBER,
    );

    // リポジトリに保存
    return await this.userRepository.create(user);
  }
}
