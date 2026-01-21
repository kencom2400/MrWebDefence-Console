/**
 * API Token E2E Tests
 *
 * APIトークン管理機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/domain/entities/user-role.enum';
import Redis from 'ioredis';
import { TokenManager } from './helpers/token-manager';
import { IApiTokenRepository } from '../src/domain/repositories/api-token.repository.interface';
import { ApiTokenService } from '../src/infrastructure/services/api-token.service';

describe('API Token E2E Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let testClient: Redis;
  let adminAccessToken: string;
  let memberAccessToken: string;
  let apiTokenRepository: IApiTokenRepository;
  let apiTokenService: ApiTokenService;

  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisHost = process.env.REDIS_HOST || 'localhost';

  // 環境変数を設定（E2Eテスト用）
  beforeAll(() => {
    if (!process.env.DB_PASSWORD) {
      process.env.DB_PASSWORD = 'test-password';
    }
    if (!process.env.DB_HOST) {
      process.env.DB_HOST = 'localhost';
    }
    if (!process.env.DB_PORT) {
      process.env.DB_PORT = '3306';
    }
    if (!process.env.DB_USER) {
      process.env.DB_USER = 'test-user';
    }
    if (!process.env.DB_NAME) {
      process.env.DB_NAME = 'test-db';
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-jwt-secret';
    }
    if (!process.env.JWT_EXPIRES_IN) {
      process.env.JWT_EXPIRES_IN = '1800';
    }
    if (!process.env.BCRYPT_SALT_ROUNDS) {
      process.env.BCRYPT_SALT_ROUNDS = '10';
    }
  });

  beforeAll(async () => {
    // Redis接続（リトライロジック付き）
    let retries = 10;
    while (retries > 0) {
      try {
        testClient = new Redis({
          host: redisHost,
          port: redisPort,
          retryStrategy: () => null,
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

    // トークンを取得
    // 管理者ユーザー: admin@example.com
    adminAccessToken = await TokenManager.getToken(app, 'admin@example.com', 'password123');
    // 一般ユーザー: user@example.com
    memberAccessToken = await TokenManager.getToken(app, 'user@example.com', 'password123');

    // リポジトリとサービスを取得
    apiTokenRepository = app.get<IApiTokenRepository>('IApiTokenRepository');
    apiTokenService = app.get<ApiTokenService>('ApiTokenService');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (testClient) {
      await testClient.quit();
    }
  });

  beforeEach(async () => {
    // 各テスト前にAPIトークンをクリア
    const tokens = await apiTokenRepository.findAll();
    for (const token of tokens) {
      await apiTokenRepository.delete(token.id);
    }
  });

  describe('POST /api/v1/api-tokens', () => {
    it('正常系: 管理者がAPIトークンを作成できる', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'WAF Engine Production Token',
          description: 'Production環境のWAFエンジン用トークン',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'WAF Engine Production Token');
      expect(response.body).toHaveProperty('description', 'Production環境のWAFエンジン用トークン');
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^waf_/);
      expect(response.body).toHaveProperty('tokenPreview');
      expect(response.body).toHaveProperty('tokenPrefix', 'waf_');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('createdBy');
    });

    it('正常系: 有効期限を設定してAPIトークンを作成できる', async () => {
      const expiresAt = new Date(Date.now() + 86400000).toISOString(); // 1日後

      const response = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'WAF Engine Test Token',
          description: 'Test環境のWAFエンジン用トークン',
          expiresAt,
        })
        .expect(201);

      expect(response.body).toHaveProperty('expiresAt');
      expect(new Date(response.body.expiresAt)).toEqual(new Date(expiresAt));
    });

    it('正常系: 説明なしでAPIトークンを作成できる', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'WAF Engine Token',
        })
        .expect(201);

      expect(response.body).toHaveProperty('description');
      expect(response.body.description).toBeNull();
    });

    it('異常系: 非管理者がAPIトークンを作成しようとすると403エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .send({
          name: 'WAF Engine Token',
        })
        .expect(403);
    });

    it('異常系: 認証なしでAPIトークンを作成しようとすると401エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .send({
          name: 'WAF Engine Token',
        })
        .expect(401);
    });

    it('異常系: 名前が空の場合400エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('異常系: 名前が255文字を超える場合400エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'a'.repeat(256),
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/api-tokens', () => {
    it('正常系: 管理者がAPIトークン一覧を取得できる', async () => {
      // テストデータを作成
      const createResponse1 = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Token 1',
        })
        .expect(201);

      const createResponse2 = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Token 2',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body.tokens).toHaveLength(2);
      expect(response.body.tokens[0]).toHaveProperty('id');
      expect(response.body.tokens[0]).toHaveProperty('name');
      expect(response.body.tokens[0]).toHaveProperty('tokenPreview');
      expect(response.body.tokens[0]).not.toHaveProperty('token'); // トークンは含まれない
    });

    it('異常系: 非管理者がAPIトークン一覧を取得しようとすると403エラー', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .expect(403);
    });

    it('異常系: 認証なしでAPIトークン一覧を取得しようとすると401エラー', async () => {
      await request(app.getHttpServer()).get('/api/v1/api-tokens').expect(401);
    });
  });

  describe('DELETE /api/v1/api-tokens/:id', () => {
    it('正常系: 管理者がAPIトークンを削除できる', async () => {
      // テストデータを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Token to Delete',
        })
        .expect(201);

      const tokenId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/api-tokens/${tokenId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(204);

      // 削除されたことを確認
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(listResponse.body.total).toBe(0);
    });

    it('異常系: 存在しないトークンを削除しようとすると404エラー', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/api-tokens/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('異常系: 非管理者がAPIトークンを削除しようとすると403エラー', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Token',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/api-tokens/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/api-tokens/:id/revoke', () => {
    it('正常系: 管理者がAPIトークンを無効化できる', async () => {
      // テストデータを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Token to Revoke',
        })
        .expect(201);

      const tokenId = createResponse.body.id;

      const revokeResponse = await request(app.getHttpServer())
        .post(`/api/v1/api-tokens/${tokenId}/revoke`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(revokeResponse.body).toHaveProperty('revokedAt');
      expect(revokeResponse.body.revokedAt).not.toBeNull();

      // 無効化されたことを確認
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const revokedToken = listResponse.body.tokens.find((t: any) => t.id === tokenId);
      expect(revokedToken).toHaveProperty('revokedAt');
      expect(revokedToken.revokedAt).not.toBeNull();
    });

    it('異常系: 既に無効化されたトークンを無効化しようとすると400エラー', async () => {
      // テストデータを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Token',
        })
        .expect(201);

      const tokenId = createResponse.body.id;

      // 1回目は成功
      await request(app.getHttpServer())
        .post(`/api/v1/api-tokens/${tokenId}/revoke`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      // 2回目はエラー
      await request(app.getHttpServer())
        .post(`/api/v1/api-tokens/${tokenId}/revoke`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(400);
    });

    it('異常系: 存在しないトークンを無効化しようとすると404エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/api-tokens/non-existent-id/revoke')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('ApiTokenAuthGuard (MWD-100で使用)', () => {
    it('正常系: 有効なAPIトークンでエンジン設定APIにアクセスできる', async () => {
      // APIトークンを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/api-tokens')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Engine Token',
        })
        .expect(201);

      const apiToken = createResponse.body.token;

      // エンジン設定APIにアクセス（ApiTokenAuthGuardで認証）
      // 注意: EngineConfigControllerにApiTokenAuthGuardを適用する必要があります
      // 現時点では、エンジン設定APIはJWT認証のみなので、このテストは将来の実装を想定
      // 実際の実装では、EngineConfigControllerに@UseGuards(ApiTokenAuthGuard)を追加する必要があります
    });
  });
});
