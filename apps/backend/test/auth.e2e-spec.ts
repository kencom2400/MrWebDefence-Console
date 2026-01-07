/**
 * Auth E2E Test
 *
 * 認証機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const testDataFile: string = path.join(process.cwd(), 'data', 'users.json');
  const testUserEmail: string = 'test@example.com';
  const testUserPassword: string = 'password123';

  beforeAll(async () => {
    // テスト用ユーザーを作成
    const hashedPassword: string = await bcrypt.hash(testUserPassword, 10);
    const testUser = {
      id: 'test-user-id',
      email: testUserEmail,
      hashedPassword: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // データディレクトリが存在しない場合は作成
    const dataDir: string = path.dirname(testDataFile);
    await fs.mkdir(dataDir, { recursive: true });

    // テスト用ユーザーを保存
    await fs.writeFile(testDataFile, JSON.stringify([testUser], null, 2), 'utf-8');

    // アプリケーションを起動
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
    // テスト用データファイルを削除
    try {
      await fs.unlink(testDataFile);
    } catch {
      // ファイルが存在しない場合は無視
    }
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('正常系: 正しい認証情報でログインに成功する', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('tokenType', 'Bearer');
          expect(res.body).toHaveProperty('expiresIn', 1800);
          expect(typeof res.body.accessToken).toBe('string');
          expect(res.body.accessToken.length).toBeGreaterThan(0);
        });
    });

    it('異常系: 存在しないメールアドレスでログインに失敗する', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUserPassword,
        })
        .expect(401)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('message', 'Invalid credentials');
          expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    it('異常系: 間違ったパスワードでログインに失敗する', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('message', 'Invalid credentials');
          expect(res.body).toHaveProperty('statusCode', 401);
        });
    });

    it('異常系: メールアドレスのバリデーションエラー', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: testUserPassword,
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('異常系: パスワードのバリデーションエラー（短すぎる）', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'short',
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('異常系: 必須フィールドが欠けている', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
        })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Session Management', () => {
    let accessToken: string;

    it('正常系: ログインして30分有効なトークンを取得する', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      accessToken = res.body.accessToken;
      expect(res.body.expiresIn).toBe(1800);
    });

    it('正常系: 有効なトークンでプロフィールにアクセスできる', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.email).toBe(testUserEmail);
        });
    });

    it('異常系: トークンなしでプロフィールにアクセスできない', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
    });

    it('正常系: ログアウトする', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('異常系: ログアウト後に同じトークンでプロフィールにアクセスできない', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401)
        .expect((res: request.Response) => {
          expect(res.body.message).toBe('Token is invalidated');
        });
    });
  });
});
