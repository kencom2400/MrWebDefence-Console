/**
 * Password E2E Tests
 *
 * パスワードポリシー機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import Redis from 'ioredis';

describe('Password E2E Tests', () => {
  let app: INestApplication;
  let testClient: Redis;
  let accessToken: string;
  let userId: string;

  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisHost = process.env.REDIS_HOST || 'localhost';

  beforeAll(async () => {
    // Redis接続（リトライロジック付き）
    let retries = 10;
    while (retries > 0) {
      try {
        testClient = new Redis({
          host: redisHost,
          port: redisPort,
          retryStrategy: () => null, // リトライを無効化（手動でリトライするため）
        });

        await testClient.ping();
        console.log(`✅ Redis接続成功: ${redisHost}:${redisPort}`);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.warn(`⚠️  Redis接続失敗（続行）: ${error}`);
          testClient = null as any;
        } else {
          console.log(`🔄 Redis接続リトライ中... (残り${retries}回)`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // Redisの状態をクリア
    if (testClient) {
      try {
        await testClient.flushdb();
      } catch (error) {
        console.warn(`⚠️  Redis flushdb失敗（続行）: ${error}`);
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // テスト用ユーザーでログインしてトークンを取得
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'member@example.com',
        password: 'MemberPassword123!',
      });

    if (loginResponse.status === 200) {
      accessToken = loginResponse.body.accessToken;
      // JWTペイロードからuserIdを取得（簡易的な実装）
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString('utf-8'),
      );
      userId = payload.sub;
    }
  });

  afterAll(async () => {
    if (testClient) {
      await testClient.quit();
    }
    await app.close();
  });

  describe('GET /api/v1/auth/password/policy', () => {
    it('正常系: パスワードポリシー設定を取得できる', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/password/policy')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('minLength');
      expect(response.body).toHaveProperty('maxLength');
      expect(response.body).toHaveProperty('requireUppercase');
      expect(response.body).toHaveProperty('requireLowercase');
      expect(response.body).toHaveProperty('requireNumbers');
      expect(response.body).toHaveProperty('requireSymbols');
      expect(response.body).toHaveProperty('historyCount');
      expect(response.body.minLength).toBe(8);
      expect(response.body.maxLength).toBe(128);
      expect(response.body.requireUppercase).toBe(true);
      expect(response.body.requireLowercase).toBe(true);
      expect(response.body.requireNumbers).toBe(true);
      expect(response.body.requireSymbols).toBe(true);
      expect(response.body.historyCount).toBe(5);
    });

    it('異常系: 認証なしでアクセスすると401エラー', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/password/policy').expect(401);
    });
  });

  describe('POST /api/v1/auth/password/validate', () => {
    it('正常系: 有効なパスワードを検証できる', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'ValidPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('strengthScore');
      expect(response.body).toHaveProperty('isReused');
      expect(response.body.isValid).toBe(true);
      expect(response.body.errors).toHaveLength(0);
      expect(response.body.strengthScore).toBeGreaterThanOrEqual(0);
      expect(response.body.strengthScore).toBeLessThanOrEqual(100);
      expect(response.body.isReused).toBe(false);
    });

    it('正常系: 無効なパスワードを検証できる', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'short',
        })
        .expect(200);

      expect(response.body.isValid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.strengthScore).toBeGreaterThanOrEqual(0);
      expect(response.body.strengthScore).toBeLessThanOrEqual(100);
    });

    it('異常系: 認証なしでアクセスすると401エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/validate')
        .send({
          password: 'ValidPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/password/change', () => {
    beforeEach(async () => {
      // 各テスト前にRedisの状態をクリア
      if (testClient) {
        try {
          await testClient.flushdb();
        } catch (error) {
          console.warn(`⚠️  Redis flushdb失敗（続行）: ${error}`);
        }
      }
    });

    it('正常系: パスワード変更に成功する', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'MemberPassword123!',
          newPassword: 'NewPassword456@',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Password changed successfully');

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'member@example.com',
          password: 'NewPassword456@',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('異常系: 現在のパスワードが間違っている場合、401エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456@',
        })
        .expect(401);
    });

    it('異常系: 新しいパスワードがポリシーに違反する場合、400エラー', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'MemberPassword123!',
          newPassword: 'short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errorCode');
      expect(response.body.errorCode).toBe('PASSWORD_POLICY_VIOLATION');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('異常系: 新しいパスワードが再利用されている場合、400エラー', async () => {
      // まずパスワードを変更
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'MemberPassword123!',
          newPassword: 'NewPassword456@',
        })
        .expect(200);

      // 再度ログインしてトークンを取得
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'member@example.com',
          password: 'NewPassword456@',
        })
        .expect(200);

      const newAccessToken = loginResponse.body.accessToken;

      // 以前のパスワードに戻そうとするとエラー
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          currentPassword: 'NewPassword456@',
          newPassword: 'MemberPassword123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errorCode');
      expect(response.body.errorCode).toBe('PASSWORD_REUSED');
    });

    it('異常系: 認証なしでアクセスすると401エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .send({
          currentPassword: 'MemberPassword123!',
          newPassword: 'NewPassword456@',
        })
        .expect(401);
    });
  });
});

