import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

export class AuthenticationError extends Error {
  constructor() {
    super('Authentication failed');
    this.name = 'AuthenticationError';
  }
}

@Injectable()
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
   * @returns アクセストークンと有効期限情報
   */
  public async execute(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; tokenType: string; expiresIn: number }> {
    // ユーザー検索
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError();
    }

    // パスワード検証
    const isPasswordValid = await this.passwordService.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new AuthenticationError();
    }

    // JWTトークン生成
    // ユーザーのロールを含める
    const accessToken = this.jwtService.generateToken(user.id, user.email, user.role);

    // 有効期限の取得
    const expiresIn = this.jwtService.getExpiresIn();

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }
}
