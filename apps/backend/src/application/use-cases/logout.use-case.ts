import { Inject, Injectable } from '@nestjs/common';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';
import { JwtService, JwtPayload } from '../../infrastructure/services/jwt.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject('ITokenBlacklistRepository')
    private readonly tokenBlacklistRepository: ITokenBlacklistRepository,
    @Inject('JwtService')
    private readonly jwtService: JwtService,
  ) {}

  /**
   * ログアウト処理（トークンの無効化）を実行する
   * @param token JWTトークン
   */
  public async execute(token: string): Promise<void> {
    // トークンを検証して有効期限を取得
    const payload: JwtPayload | null = this.jwtService.verifyToken(token);

    // 既に無効なトークンの場合でも、セキュリティ上は成功として扱うか、エラーにするか。
    // ここでは、ペイロードが取得できればブラックリストに追加し、できなければ何もしない（既に無効）とする。
    if (payload && payload.exp) {
      await this.tokenBlacklistRepository.add(token, payload.exp);
    }
  }
}
