/**
 * JWT Service
 *
 * JWTトークンの生成と検証を行うサービス
 */

import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // ユーザーID
  email: string; // メールアドレス
  iat?: number; // 発行日時（自動設定）
  exp?: number; // 有効期限（自動設定）
}

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: number = 86400; // 24時間（秒）

  constructor(secret: string, expiresIn?: number) {
    this.secret = secret;
    if (expiresIn !== undefined) {
      this.expiresIn = expiresIn;
    }
  }

  /**
   * JWTトークンを生成する
   * @param payload ペイロード
   * @returns JWTトークン
   */
  public generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  /**
   * JWTトークンを検証する
   * @param token JWTトークン
   * @returns 検証されたペイロード、検証に失敗した場合はnull
   */
  public verifyToken(token: string): JwtPayload | null {
    try {
      const decoded: unknown = jwt.verify(token, this.secret);
      if (this.isJwtPayload(decoded)) {
        return decoded;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 型ガード: JwtPayloadかどうかを判定する
   */
  private isJwtPayload(value: unknown): value is JwtPayload {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    return typeof obj.sub === 'string' && typeof obj.email === 'string';
  }
}

