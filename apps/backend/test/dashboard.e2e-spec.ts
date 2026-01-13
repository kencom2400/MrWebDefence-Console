/**
 * Dashboard E2E Test
 *
 * ダッシュボード機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // Redis接続を待つ（最大10秒、1秒間隔でリトライ）
    // CI環境ではREDIS_PORT=6379、ローカル環境ではREDIS_PORT=6381（docker-compose経由の場合）
    // デフォルトは6379（CI環境に合わせる）
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const maxRetries = 10;
    let retries = 0;
    let redisReady = false;

    while (retries < maxRetries && !redisReady) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require('ioredis');
        const testClient = new Redis({
          host: redisHost,
          port: redisPort,
          connectTimeout: 1000,
          lazyConnect: true,
        });
        await testClient.connect();
        await testClient.ping();
        await testClient.quit();
        redisReady = true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Redis connection failed after ${maxRetries} retries: ${error}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

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

    // ログインしてアクセストークンを取得
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/dashboard', () => {
    it('正常系: ダッシュボードデータを取得できる', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', 'user@example.com');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('mfaEnabled');
      expect(response.body).toHaveProperty('ipAllowListCount', 0);
      expect(response.body).toHaveProperty('accountCreatedAt');
      expect(response.body).toHaveProperty('lastLoginAt', null);
      expect(response.body).toHaveProperty('loginAttemptCount', null);
    });

    it('異常系: 認証トークンがない場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .expect(401);
    });

    it('異常系: 無効な認証トークンの場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});


 *
 * ダッシュボード機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // Redis接続を待つ（最大10秒、1秒間隔でリトライ）
    // CI環境ではREDIS_PORT=6379、ローカル環境ではREDIS_PORT=6381（docker-compose経由の場合）
    // デフォルトは6379（CI環境に合わせる）
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const maxRetries = 10;
    let retries = 0;
    let redisReady = false;

    while (retries < maxRetries && !redisReady) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require('ioredis');
        const testClient = new Redis({
          host: redisHost,
          port: redisPort,
          connectTimeout: 1000,
          lazyConnect: true,
        });
        await testClient.connect();
        await testClient.ping();
        await testClient.quit();
        redisReady = true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Redis connection failed after ${maxRetries} retries: ${error}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

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

    // ログインしてアクセストークンを取得
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/dashboard', () => {
    it('正常系: ダッシュボードデータを取得できる', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', 'user@example.com');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('mfaEnabled');
      expect(response.body).toHaveProperty('ipAllowListCount', 0);
      expect(response.body).toHaveProperty('accountCreatedAt');
      expect(response.body).toHaveProperty('lastLoginAt', null);
      expect(response.body).toHaveProperty('loginAttemptCount', null);
    });

    it('異常系: 認証トークンがない場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .expect(401);
    });

    it('異常系: 無効な認証トークンの場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});


 *
 * ダッシュボード機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // Redis接続を待つ（最大10秒、1秒間隔でリトライ）
    // CI環境ではREDIS_PORT=6379、ローカル環境ではREDIS_PORT=6381（docker-compose経由の場合）
    // デフォルトは6379（CI環境に合わせる）
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const maxRetries = 10;
    let retries = 0;
    let redisReady = false;

    while (retries < maxRetries && !redisReady) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Redis = require('ioredis');
        const testClient = new Redis({
          host: redisHost,
          port: redisPort,
          connectTimeout: 1000,
          lazyConnect: true,
        });
        await testClient.connect();
        await testClient.ping();
        await testClient.quit();
        redisReady = true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(`Redis connection failed after ${maxRetries} retries: ${error}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

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

    // ログインしてアクセストークンを取得
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123',
      })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/v1/dashboard', () => {
    it('正常系: ダッシュボードデータを取得できる', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', 'user@example.com');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('mfaEnabled');
      expect(response.body).toHaveProperty('ipAllowListCount', 0);
      expect(response.body).toHaveProperty('accountCreatedAt');
      expect(response.body).toHaveProperty('lastLoginAt', null);
      expect(response.body).toHaveProperty('loginAttemptCount', null);
    });

    it('異常系: 認証トークンがない場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .expect(401);
    });

    it('異常系: 無効な認証トークンの場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});

