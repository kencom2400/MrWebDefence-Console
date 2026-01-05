/**
 * Login Use Case
 *
 * ログイン処理のユースケース
 * アプリケーション層に位置し、ドメイン層とインフラ層に依存する
 */

import { Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

export interface LoginResult {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Invalid credentials') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class LoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('PasswordService')
    private readonly passwordService: PasswordService,
    @Inject('JwtService')
    private readonly jwtService: JwtService,
  ) {}

  /**
   * ログイン処理を実行する
   * @param email メールアドレス
   * @param password パスワード
   * @returns ログイン結果（JWTトークンを含む）
   * @throws AuthenticationError 認証に失敗した場合
   */
  public async execute(email: string, password: string): Promise<LoginResult> {
    // ユーザーを検索
    const user: User | null = await this.userRepository.findByEmail(email);
    if (user === null) {
      throw new AuthenticationError();
    }

    // パスワードを検証
    const isValid: boolean = await this.passwordService.compare(password, user.hashedPassword);
    if (!isValid) {
      throw new AuthenticationError();
    }

    // JWTトークンを生成
    const accessToken: string = this.jwtService.generateToken({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24時間（秒）
    };
  }
}
