/**
 * FQDN E2E Tests
 *
 * FQDN管理機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import Redis from 'ioredis';
import { IFqdnRepository } from '../src/domain/repositories/fqdn.repository.interface';
import { UserRepository } from '../src/infrastructure/repositories/user.repository';
import { User } from '../src/domain/entities/user.entity';
import { UserRole } from '../src/domain/entities/user-role.enum';

describe('FQDN E2E Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let testClient: Redis;
  let accessToken: string;

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

    // テストユーザーを取得または作成
    const userRepository = app.get<UserRepository>('IUserRepository') as any as UserRepository;
    let testUser = await userRepository.findByEmail('user@example.com');
    const initialPasswordHash = '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O'; // password123のハッシュ

    if (testUser) {
      await userRepository.delete(testUser.id);
    }

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

    // ログインしてアクセストークンを取得
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      })
      .expect(200);

    accessToken = loginRes.body.accessToken;
    expect(accessToken).toBeDefined();

    // 生成したトークンが既にブラックリストに登録されている場合、削除
    if (testClient && accessToken) {
      const isBlacklisted = await testClient.get(`blacklist:${accessToken}`);
      if (isBlacklisted) {
        await testClient.del(`blacklist:${accessToken}`);
      }
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (testClient) {
      await testClient.quit();
    }
  });

  describe('POST /api/v1/fqdns', () => {
    beforeEach(async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }
    });

    it('正常系: FQDNを作成できる', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'create-test.com',
          description: 'サンプルドメイン',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fqdn).toBe('create-test.com');
      expect(response.body.description).toBe('サンプルドメイン');
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('正常系: 説明なしでFQDNを作成できる', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'no-description-test.com',
        })
        .expect(201);

      expect(response.body.fqdn).toBe('no-description-test.com');
      expect(response.body.description).toBeNull();
    });

    it('正常系: 大文字のFQDNを小文字に正規化して作成できる', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'EXAMPLE.COM',
        })
        .expect(201);

      expect(response.body.fqdn).toBe('example.com');
    });

    it('異常系: 認証なしでアクセスすると401エラー', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .send({
          fqdn: 'example.com',
        })
        .expect(401);
    });

    it('異常系: 無効なFQDN形式の場合400エラー', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'invalid',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('異常系: 重複するFQDNを作成しようとすると409エラー', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      // 最初のFQDNを作成
      await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'duplicate-test.com',
        })
        .expect(201);

      // 同じFQDNを再度作成しようとする
      const response = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'duplicate-test.com',
        })
        .expect(409);

      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PATCH /api/v1/fqdns/:id', () => {
    let createdFqdnId: string;

    beforeEach(async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }
    });

    it('正常系: FQDN文字列を更新できる', async () => {
      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'update-fqdn-test.com',
          description: '更新テスト用',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${testFqdnId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'updated-fqdn-test.com',
        })
        .expect(200);

      expect(response.body.fqdn).toBe('updated-fqdn-test.com');
      expect(response.body.description).toBe('更新テスト用');
    });

    it('正常系: 説明を更新できる', async () => {
      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'update-description-test.com',
          description: '更新テスト用',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${testFqdnId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: '更新された説明',
        })
        .expect(200);

      expect(response.body.fqdn).toBe('update-description-test.com');
      expect(response.body.description).toBe('更新された説明');
    });

    it('異常系: 存在しないFQDNを更新しようとすると404エラー', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'updated.com',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/fqdns/:id', () => {
    beforeEach(async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }
    });

    it('正常系: FQDNを削除できる', async () => {
      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'delete-test.com',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/fqdns/${testFqdnId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // 削除されたことを確認
      await request(app.getHttpServer())
        .get(`/api/v1/fqdns/${testFqdnId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('異常系: 存在しないFQDNを削除しようとすると404エラー', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/api/v1/fqdns/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/fqdns', () => {
    beforeEach(async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }
    });

    it('正常系: FQDN一覧を取得できる', async () => {
      // テスト用のFQDNを作成
      const fqdns = [
        { fqdn: 'list1.com', description: '一覧テスト1' },
        { fqdn: 'list2.com', description: '一覧テスト2' },
      ];

      for (const fqdnData of fqdns) {
        await request(app.getHttpServer())
          .post('/api/v1/fqdns')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(fqdnData)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('fqdns');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.fqdns)).toBe(true);
    });

    it('正常系: FQDNで検索できる', async () => {
      // 各テスト前にFQDNリポジトリをクリアして再作成
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      // テスト用のFQDNを作成
      const fqdns = [
        { fqdn: 'search-filter1.com', description: '検索テスト1' },
        { fqdn: 'search-filter2.com', description: '検索テスト2' },
        { fqdn: 'other-filter.com', description: 'その他' },
      ];

      for (const fqdnData of fqdns) {
        await request(app.getHttpServer())
          .post('/api/v1/fqdns')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(fqdnData)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/fqdns?fqdn=search-filter')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.fqdns.length).toBeGreaterThan(0);
      response.body.fqdns.forEach((fqdn: any) => {
        expect(fqdn.fqdn).toContain('search-filter');
      });
    });

    it('正常系: ページネーションが動作する', async () => {
      // 各テスト前にFQDNリポジトリをクリアして再作成
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      // テスト用のFQDNを作成
      const fqdns = [
        { fqdn: 'pagination1.com', description: 'ページ1' },
        { fqdn: 'pagination2.com', description: 'ページ2' },
        { fqdn: 'pagination3.com', description: 'ページ3' },
      ];

      for (const fqdnData of fqdns) {
        await request(app.getHttpServer())
          .post('/api/v1/fqdns')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(fqdnData)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/fqdns?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.fqdns.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/v1/fqdns/:id', () => {
    beforeEach(async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }
    });

    it('正常系: FQDN詳細を取得できる', async () => {
      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'detail-test.com',
          description: '詳細取得テスト用',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/fqdns/${testFqdnId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testFqdnId);
      expect(response.body.fqdn).toBe('detail-test.com');
      expect(response.body.description).toBe('詳細取得テスト用');
    });

    it('異常系: 存在しないFQDNを取得しようとすると404エラー', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/api/v1/fqdns/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/fqdns/:id/status', () => {
    beforeEach(async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }
    });

    it('正常系: FQDNステータスをINACTIVEに更新できる', async () => {
      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'status-inactive-test.com',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${testFqdnId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'INACTIVE',
        })
        .expect(200);

      expect(response.body.status).toBe('INACTIVE');
    });

    it('正常系: FQDNステータスをACTIVEに更新できる', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'status-active-update-test.com',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      // まずINACTIVEに変更
      await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${testFqdnId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'INACTIVE',
        })
        .expect(200);

      // 再度ACTIVEに変更
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${testFqdnId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'ACTIVE',
        })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });

    it('異常系: 無効なステータスを指定すると400エラー', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      // テスト用のFQDNを作成
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/fqdns')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fqdn: 'status-invalid-status-test.com',
        })
        .expect(201);

      const testFqdnId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${testFqdnId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'INVALID',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('異常系: 存在しないFQDNのステータスを更新しようとすると404エラー', async () => {
      // 各テスト前にFQDNリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/api/v1/fqdns/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'INACTIVE',
        })
        .expect(404);
    });
  });
});

