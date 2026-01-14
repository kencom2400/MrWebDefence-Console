/**
 * Token Manager for E2E Tests
 *
 * E2Eテスト用のトークン管理ヘルパー
 * トークンの取得、キャッシュ、有効期限チェックを提供します
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp (秒)
  userId?: string;
  email?: string;
}

/**
 * トークンマネージャークラス
 * トークンの取得、キャッシュ、有効期限チェックを管理します
 */
export class TokenManager {
  private static cache: Map<string, TokenCache> = new Map();
  private static readonly DEFAULT_TEST_USER_EMAIL = 'user@example.com';
  private static readonly DEFAULT_TEST_USER_PASSWORD = 'password123';
  private static readonly TOKEN_REFRESH_BUFFER_SECONDS = 60; // 有効期限の60秒前にリフレッシュ

  /**
   * トークンを取得します（キャッシュがあれば再利用）
   * @param app NestJSアプリケーションインスタンス
   * @param email ユーザーのメールアドレス（デフォルト: 'user@example.com'）
   * @param password ユーザーのパスワード（デフォルト: 'password123'）
   * @param forceRefresh 強制的に再取得するか（デフォルト: false）
   * @returns アクセストークン
   */
  static async getToken(
    app: INestApplication,
    email: string = this.DEFAULT_TEST_USER_EMAIL,
    password: string = this.DEFAULT_TEST_USER_PASSWORD,
    forceRefresh: boolean = false,
  ): Promise<string> {
    const cacheKey = `${email}:${password}`;

    // キャッシュをチェック
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const now = Math.floor(Date.now() / 1000);

      // 有効期限をチェック（バッファ時間を考慮）
      if (cached.expiresAt > now + this.TOKEN_REFRESH_BUFFER_SECONDS) {
        return cached.token;
      }

      // 期限切れの場合はキャッシュを削除
      this.cache.delete(cacheKey);
    }

    // 新しいトークンを取得
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const token = loginResponse.body.accessToken;
    if (!token) {
      throw new Error('Failed to get access token from login response');
    }

    // トークンから有効期限を取得
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    if (!decoded || !decoded.exp) {
      throw new Error('Failed to decode token or token does not have expiration');
    }

    // キャッシュに保存
    this.cache.set(cacheKey, {
      token,
      expiresAt: decoded.exp,
      userId: decoded.sub,
      email: decoded.email,
    });

    return token;
  }

  /**
   * キャッシュをクリアします
   * @param email ユーザーのメールアドレス（指定しない場合はすべてクリア）
   */
  static clearCache(email?: string): void {
    if (email) {
      // 特定のユーザーのキャッシュをクリア
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(`${email}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => this.cache.delete(key));
    } else {
      // すべてのキャッシュをクリア
      this.cache.clear();
    }
  }

  /**
   * キャッシュされたトークンを取得します（再取得はしない）
   * @param email ユーザーのメールアドレス（デフォルト: 'user@example.com'）
   * @param password ユーザーのパスワード（デフォルト: 'password123'）
   * @returns キャッシュされたトークン、またはundefined
   */
  static getCachedToken(
    email: string = this.DEFAULT_TEST_USER_EMAIL,
    password: string = this.DEFAULT_TEST_USER_PASSWORD,
  ): string | undefined {
    const cacheKey = `${email}:${password}`;
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    if (cached.expiresAt <= now) {
      // 期限切れの場合はキャッシュを削除
      this.cache.delete(cacheKey);
      return undefined;
    }

    return cached.token;
  }

  /**
   * すべてのキャッシュをクリアします
   */
  static clearAllCache(): void {
    this.cache.clear();
  }
}

