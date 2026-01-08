import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole; // ロールを追加
  exp?: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: number,
  ) {}

  /**
   * JWTトークンを生成する
   * @param userId ユーザーID
   * @param email メールアドレス
   * @param role ユーザーロール
   */
  public generateToken(userId: string, email: string, role: UserRole): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   * JWTトークンを検証する
   * @param token JWTトークン
   * @returns ペイロード、または検証失敗時はnull
   */
  public verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}
