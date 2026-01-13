/**
 * Password E2E Tests
 *
 * パスワードポリシー機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import Redis from 'ioredis';
import { UserRepository } from '../src/infrastructure/repositories/user.repository';
import { PasswordHistoryRepository } from '../src/infrastructure/repositories/password-history.repository';
import { User } from '../src/domain/entities/user.entity';

describe('Password E2E Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let testClient: Redis;
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

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // userIdを取得（JWTペイロードから取得するため、一時的にログインしてトークンを取得）
    const tempLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      })
      .expect(200);

    const tempToken = tempLoginResponse.body.accessToken;
    // JWTペイロードからuserIdを取得（簡易的な実装）
    const payload = JSON.parse(
      Buffer.from(tempToken.split('.')[1], 'base64').toString('utf-8'),
    );
    userId = payload.sub;
    
    // 一時トークンは使用しない（各テストで新しいトークンを取得する）
    // accessTokenは各テストで取得する
  });

  afterAll(async () => {
    if (testClient) {
      await testClient.quit();
    }
    await app.close();
  });

  describe('GET /api/v1/auth/password/policy', () => {
    let policyToken: string;

    beforeEach(async () => {
      // 各テスト前にRedisの状態をクリア
      if (testClient) {
        try {
          await testClient.flushdb();
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`⚠️  Redis flushdb失敗（続行）: ${error}`);
        }
      }

      // ログインしてトークンを取得
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      policyToken = loginRes.body.accessToken;
      expect(policyToken).toBeDefined();

      // デバッグ: 保管されているトークンの情報
      console.log(`[GET /api/v1/auth/password/policy] beforeEach: 保管されているトークン = ${policyToken ? policyToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && policyToken) {
        const isBlacklisted = await testClient.get(`blacklist:${policyToken}`);
        console.log(`[GET /api/v1/auth/password/policy] beforeEach: ブラックリスト状態 = ${!!isBlacklisted}`);
      }
    });

    it('正常系: パスワードポリシー設定を取得できる', async () => {
      // デバッグ: 使用しているトークンの情報
      console.log(`[GET /api/v1/auth/password/policy] 使用しているトークン = ${policyToken ? policyToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[GET /api/v1/auth/password/policy] 保管されているトークン = ${policyToken ? policyToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && policyToken) {
        const isBlacklisted = await testClient.get(`blacklist:${policyToken}`);
        console.log(`[GET /api/v1/auth/password/policy] リクエスト前のブラックリスト状態 = ${!!isBlacklisted}`);
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/password/policy')
        .set('Authorization', `Bearer ${policyToken}`)
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
    let validateToken: string;

    beforeEach(async () => {
      // 各テスト前にRedisの状態をクリア
      if (testClient) {
        try {
          await testClient.flushdb();
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`⚠️  Redis flushdb失敗（続行）: ${error}`);
        }
      }

      // ログインしてトークンを取得
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      validateToken = loginRes.body.accessToken;
      expect(validateToken).toBeDefined();

      // デバッグ: 保管されているトークンの情報
      console.log(`[POST /api/v1/auth/password/validate] beforeEach: 保管されているトークン = ${validateToken ? validateToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && validateToken) {
        const isBlacklisted = await testClient.get(`blacklist:${validateToken}`);
        console.log(`[POST /api/v1/auth/password/validate] beforeEach: ブラックリスト状態 = ${!!isBlacklisted}`);
      }
    });

    it('正常系: 有効なパスワードを検証できる', async () => {
      // デバッグ: 使用しているトークンの情報
      console.log(`[POST /api/v1/auth/password/validate] 使用しているトークン = ${validateToken ? validateToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[POST /api/v1/auth/password/validate] 保管されているトークン = ${validateToken ? validateToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && validateToken) {
        const isBlacklisted = await testClient.get(`blacklist:${validateToken}`);
        console.log(`[POST /api/v1/auth/password/validate] リクエスト前のブラックリスト状態 = ${!!isBlacklisted}`);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/validate')
        .set('Authorization', `Bearer ${validateToken}`)
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
      // デバッグ: 使用しているトークンの情報
      console.log(`[POST /api/v1/auth/password/validate] 使用しているトークン = ${validateToken ? validateToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[POST /api/v1/auth/password/validate] 保管されているトークン = ${validateToken ? validateToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && validateToken) {
        const isBlacklisted = await testClient.get(`blacklist:${validateToken}`);
        console.log(`[POST /api/v1/auth/password/validate] リクエスト前のブラックリスト状態 = ${!!isBlacklisted}`);
      }

      // DTOバリデーションを通過するが、ポリシー違反のパスワード（記号なし）
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/validate')
        .set('Authorization', `Bearer ${validateToken}`)
        .send({
          password: 'nouppercase123',
        });

      if (response.status !== 200) {
        console.error(`[POST /api/v1/auth/password/validate] リクエスト失敗: ${response.status}`, response.body);
        if (testClient && validateToken) {
          const isBlacklistedAfter = await testClient.get(`blacklist:${validateToken}`);
          console.error(`[POST /api/v1/auth/password/validate] リクエスト後のブラックリスト状態 = ${!!isBlacklistedAfter}`);
        }
      }
      expect(response.status).toBe(200);

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
    let testToken: string;

    beforeEach(async () => {
      // 各テスト前にRedisの状態をクリア
      if (testClient) {
        try {
          await testClient.flushdb();
          // Redisの操作が完了するまで少し待機
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.warn(`⚠️  Redis flushdb失敗（続行）: ${error}`);
        }
      }

      // ユーザーのパスワードを初期状態（password123）に戻す
      const userRepository = moduleFixture.get<UserRepository>('IUserRepository');
      const passwordHistoryRepository = moduleFixture.get<PasswordHistoryRepository>(
        'IPasswordHistoryRepository',
      );

      // テストユーザーを取得
      const testUser = await userRepository.findByEmail('user@example.com');
      if (testUser) {
        // パスワードを初期状態に戻す
        const initialPasswordHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // password123のハッシュ
        const resetUser = User.reconstruct(
          testUser.id,
          testUser.email,
          initialPasswordHash,
          testUser.role,
          testUser.mfaEnabled,
          testUser.mfaSecret,
          testUser.createdAt,
          new Date(),
        );
        await userRepository.save(resetUser);

        // パスワード履歴をクリア
        // PasswordHistoryRepositoryはインメモリなので、直接削除する方法がない
        // 代わりに、古い履歴を削除するメソッドを使用（keepCount=0で全削除）
        await passwordHistoryRepository.deleteOldHistory(testUser.id, 0);
      }

      // ログインしてトークンを取得（各テストで確実に有効なトークンを使用）
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      testToken = loginRes.body.accessToken;
      expect(testToken).toBeDefined();

      // デバッグ: 保管されているトークンの情報
      console.log(`[POST /api/v1/auth/password/change] beforeEach: 保管されているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && testToken) {
        const isBlacklisted = await testClient.get(`blacklist:${testToken}`);
        console.log(`[POST /api/v1/auth/password/change] beforeEach: ブラックリスト状態 = ${!!isBlacklisted}`);
        if (isBlacklisted) {
          console.warn(`⚠️  [POST /api/v1/auth/password/change] beforeEach: トークンがブラックリストに登録されています`);
        }
      }
    });

    it('正常系: パスワード変更に成功する', async () => {
      // デバッグ: 使用しているトークンの情報
      console.log(`[POST /api/v1/auth/password/change] 使用しているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[POST /api/v1/auth/password/change] 保管されているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
      if (testClient && testToken) {
        const isBlacklisted = await testClient.get(`blacklist:${testToken}`);
        console.log(`[POST /api/v1/auth/password/change] リクエスト前のブラックリスト状態 = ${!!isBlacklisted}`);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'NewPassword456@',
        });

      if (response.status !== 200) {
        console.error(`[POST /api/v1/auth/password/change] リクエスト失敗: ${response.status}`, response.body);
        console.error(`[POST /api/v1/auth/password/change] 使用したトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
        if (testClient && testToken) {
          const isBlacklistedAfter = await testClient.get(`blacklist:${testToken}`);
          console.error(`[POST /api/v1/auth/password/change] リクエスト後のブラックリスト状態 = ${!!isBlacklistedAfter}`);
        }
      }
      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Password changed successfully');

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'NewPassword456@',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('異常系: 現在のパスワードが間違っている場合、401エラー', async () => {
      // デバッグ: 使用しているトークンの情報
      console.log(`[POST /api/v1/auth/password/change] 使用しているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[POST /api/v1/auth/password/change] 保管されているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);

      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456@',
        })
        .expect(401);
    });

    it('異常系: 新しいパスワードがポリシーに違反する場合、400エラー', async () => {
      // デバッグ: 使用しているトークンの情報
      console.log(`[POST /api/v1/auth/password/change] 使用しているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[POST /api/v1/auth/password/change] 保管されているトークン = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);

      // ポリシー違反のパスワードで変更を試みる（記号なし）
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'nouppercase123',
        })
        .expect(400);

      // DTOバリデーションエラーの場合はerrorCodeがない
      // Use Caseレベルのエラーの場合はerrorCodeがある
      if (response.body.errorCode) {
        expect(response.body.errorCode).toBe('PASSWORD_POLICY_VIOLATION');
        expect(response.body).toHaveProperty('errors');
        expect(response.body.errors.length).toBeGreaterThan(0);
      } else {
        // DTOバリデーションエラーの場合
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      }
    });

    it('異常系: 新しいパスワードが再利用されている場合、400エラー', async () => {
      // デバッグ: 使用しているトークンの情報
      console.log(`[POST /api/v1/auth/password/change] 使用しているトークン（再利用テスト開始時） = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);
      console.log(`[POST /api/v1/auth/password/change] 保管されているトークン（再利用テスト開始時） = ${testToken ? testToken.substring(0, 20) + '...' : 'undefined'}`);

      // まずパスワードを変更
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'NewPassword456@',
        })
        .expect(200);

      // 再度ログインしてトークンを取得（パスワード変更後はトークンが無効化されるため）
      const loginResponse1 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'NewPassword456@',
        })
        .expect(200);

      const newAccessToken1 = loginResponse1.body.accessToken;
      console.log(`[POST /api/v1/auth/password/change] 再利用テスト: 1回目のパスワード変更後のトークン = ${newAccessToken1 ? newAccessToken1.substring(0, 20) + '...' : 'undefined'}`);

      // さらに別のパスワードに変更
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${newAccessToken1}`)
        .send({
          currentPassword: 'NewPassword456@',
          newPassword: 'AnotherPassword789!',
        })
        .expect(200);

      // 再度ログインしてトークンを取得
      const loginResponse2 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'AnotherPassword789!',
        })
        .expect(200);

      const newAccessToken2 = loginResponse2.body.accessToken;
      console.log(`[POST /api/v1/auth/password/change] 再利用テスト: 2回目のパスワード変更後のトークン = ${newAccessToken2 ? newAccessToken2.substring(0, 20) + '...' : 'undefined'}`);

      // 以前のパスワード（NewPassword456@）に戻そうとするとエラー
      console.log(`[POST /api/v1/auth/password/change] 再利用テスト: 再利用チェック用のトークン = ${newAccessToken2 ? newAccessToken2.substring(0, 20) + '...' : 'undefined'}`);
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${newAccessToken2}`)
        .send({
          currentPassword: 'AnotherPassword789!',
          newPassword: 'NewPassword456@',
        });

      if (response.status !== 400) {
        console.error(`[POST /api/v1/auth/password/change] 再利用テスト: 期待される400エラーが発生しませんでした。ステータス = ${response.status}`, response.body);
      }
      expect(response.status).toBe(400);

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

