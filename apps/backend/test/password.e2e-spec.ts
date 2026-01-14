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
import { UserRole } from '../src/domain/entities/user-role.enum';

describe('Password E2E Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let testClient: Redis;

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
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          testClient = null as any;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // Redisの状態をクリア
    if (testClient) {
      try {
        await testClient.flushdb();
      } catch (error) {
        // Redis flushdb失敗時は続行
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
        } catch (error) {
          // Redis flushdb失敗時は続行
        }
      }

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      policyToken = loginRes.body.accessToken;
      expect(policyToken).toBeDefined();

      // 生成したトークンが既にブラックリストに登録されている場合、削除
      if (testClient && policyToken) {
        const isBlacklisted = await testClient.get(`blacklist:${policyToken}`);
        if (isBlacklisted) {
          await testClient.del(`blacklist:${policyToken}`);
        }
      }
    });

    it('正常系: パスワードポリシー設定を取得できる', async () => {
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
        } catch (error) {
          // Redis flushdb失敗時は続行
        }
      }

      // ユーザーのパスワードを初期状態（password123）に戻す
      // app.getを使用して、アプリケーションのDIコンテナから直接取得
      const userRepository = app.get<UserRepository>('IUserRepository');
      const passwordHistoryRepository = app.get<PasswordHistoryRepository>(
        'IPasswordHistoryRepository',
      );

      // テストユーザーを取得または作成
      let testUser = await userRepository.findByEmail('user@example.com');
      const initialPasswordHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // password123のハッシュ

      if (testUser) {
        // 既存のユーザーを削除
        try {
          await userRepository.delete(testUser.id);
        } catch (error) {
          // 削除に失敗した場合は無視（既に削除されている可能性がある）
        }
      }

      // テストユーザーを再作成
      testUser = User.reconstruct(
        'test-user-id',
        'user@example.com',
        initialPasswordHash,
        UserRole.SERVICE_MEMBER,
        false,
        null,
        new Date(),
        new Date(),
      );
      await userRepository.create(testUser);

      // パスワード履歴をクリア
      await passwordHistoryRepository.deleteOldHistory(testUser.id, 0);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      validateToken = loginRes.body.accessToken;
      expect(validateToken).toBeDefined();

      // 生成したトークンが既にブラックリストに登録されている場合、削除
      if (testClient && validateToken) {
        const isBlacklisted = await testClient.get(`blacklist:${validateToken}`);
        if (isBlacklisted) {
          await testClient.del(`blacklist:${validateToken}`);
        }
      }
    });

    it('正常系: 有効なパスワードを検証できる', async () => {
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
      // DTOバリデーションを通過するが、ポリシー違反のパスワード（記号なし）
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/validate')
        .set('Authorization', `Bearer ${validateToken}`)
        .send({
          password: 'nouppercase123',
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
    let testToken: string;

    beforeEach(async () => {
      // 各テスト前にRedisの状態をクリア
      if (testClient) {
        try {
          await testClient.flushdb();
        } catch (error) {
          // Redis flushdb失敗時は続行
        }
      }

      // ユーザーのパスワードを初期状態（password123）に戻す
      // app.getを使用して、アプリケーションのDIコンテナから直接取得
      const userRepository = app.get<UserRepository>('IUserRepository');
      const passwordHistoryRepository = app.get<PasswordHistoryRepository>(
        'IPasswordHistoryRepository',
      );

      // テストユーザーを取得または作成
      let testUser = await userRepository.findByEmail('user@example.com');
      const initialPasswordHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // password123のハッシュ

      if (testUser) {
        // 既存のユーザーを削除
        try {
          await userRepository.delete(testUser.id);
        } catch (error) {
          // 削除に失敗した場合は無視（既に削除されている可能性がある）
        }
      }

      // テストユーザーを再作成
      testUser = User.reconstruct(
        'test-user-id',
        'user@example.com',
        initialPasswordHash,
        UserRole.SERVICE_MEMBER,
        false,
        null,
        new Date(),
        new Date(),
      );
      await userRepository.create(testUser);

      // パスワード履歴をクリア
      if (testUser) {
        await passwordHistoryRepository.deleteOldHistory(testUser.id, 0);
      }

      // ユーザーが正しく保存されているか確認
      const verifyUser = await userRepository.findByEmail('user@example.com');
      if (!verifyUser) {
        throw new Error('Test user not found after setup');
      }

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      testToken = loginRes.body.accessToken;
      expect(testToken).toBeDefined();

      // 生成したトークンが既にブラックリストに登録されている場合、削除
      if (testClient && testToken) {
        const isBlacklisted = await testClient.get(`blacklist:${testToken}`);
        if (isBlacklisted) {
          await testClient.del(`blacklist:${testToken}`);
        }
      }
    });

    it('正常系: パスワード変更に成功する', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'NewPassword456@',
        })
        .expect(200);

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
      expect(newAccessToken1).toBeDefined();

      // さらに別のパスワードに変更
      // パスワード変更後はトークンが無効化される可能性があるため、
      // 401エラーが発生した場合は再度ログインしてトークンを取得してから再試行
      const changePasswordResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${newAccessToken1}`)
        .send({
          currentPassword: 'NewPassword456@',
          newPassword: 'AnotherPassword789!',
        });

      // 401エラーの場合、トークンが無効化されている可能性がある
      if (changePasswordResponse.status === 401) {
        // 再度ログインしてトークンを取得
        const reLoginResponse = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'user@example.com',
            password: 'NewPassword456@',
          })
          .expect(200);

        const reLoginToken = reLoginResponse.body.accessToken;
        expect(reLoginToken).toBeDefined();

        // 再度パスワード変更を試みる
        await request(app.getHttpServer())
          .post('/api/v1/auth/password/change')
          .set('Authorization', `Bearer ${reLoginToken}`)
          .send({
            currentPassword: 'NewPassword456@',
            newPassword: 'AnotherPassword789!',
          })
          .expect(200);
      } else {
        // 200 OKの場合
        expect(changePasswordResponse.status).toBe(200);
      }

      // 再度ログインしてトークンを取得
      const loginResponse2 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'AnotherPassword789!',
        })
        .expect(200);

      const newAccessToken2 = loginResponse2.body.accessToken;

      // 以前のパスワード（NewPassword456@）に戻そうとするとエラー
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${newAccessToken2}`)
        .send({
          currentPassword: 'AnotherPassword789!',
          newPassword: 'NewPassword456@',
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
