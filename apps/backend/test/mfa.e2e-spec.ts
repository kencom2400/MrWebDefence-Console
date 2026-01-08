/**
 * MFA E2E Tests
 *
 * MFA機能のE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/domain/entities/user-role.enum';
import { authenticator } from 'otplib';

describe('MFA E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let mfaSecret: string;
  let backupCodes: string[];

  beforeAll(async () => {
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
    await app.close();
  });

  describe('MFA Setup Flow', () => {
    it('正常系: ログインしてMFAセットアップを開始する', async () => {
      // ログイン
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
      expect(accessToken).toBeDefined();

      // MFAセットアップ開始
      const setupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(setupResponse.body.qrCodeDataUrl).toBeDefined();
      expect(setupResponse.body.secret).toBeDefined();
      expect(setupResponse.body.expiresIn).toBe(300);

      mfaSecret = setupResponse.body.secret;
    });

    it('正常系: MFAセットアップ検証に成功する', async () => {
      // TOTPコードを生成
      const totpCode = authenticator.generate(mfaSecret);

      // MFAセットアップ検証
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify-setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          secret: mfaSecret,
          code: totpCode,
        })
        .expect(200);

      expect(verifyResponse.body.message).toBe('MFA has been enabled successfully');
      expect(verifyResponse.body.backupCodes).toBeDefined();
      expect(verifyResponse.body.backupCodes).toHaveLength(10);
      expect(verifyResponse.body.warning).toBeDefined();

      backupCodes = verifyResponse.body.backupCodes;
    });

    it('異常系: 既にMFAが有効な場合はエラーを返す', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409); // Conflict
    });
  });

  describe('MFA Login Flow', () => {
    let loginToken: string;

    beforeAll(async () => {
      // 新しいセッションでログイン（MFA有効なユーザー）
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      // MFA有効なユーザーは中間状態を返す
      expect(loginResponse.body.requiresMfa).toBe(true);
      expect(loginResponse.body.userId).toBeDefined();
      userId = loginResponse.body.userId;
    });

    it('正常系: TOTPコードでログインに成功する', async () => {
      // TOTPコードを生成
      const totpCode = authenticator.generate(mfaSecret);

      // MFA検証
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: userId,
          code: totpCode,
        })
        .expect(200);

      expect(verifyResponse.body.accessToken).toBeDefined();
      expect(verifyResponse.body.tokenType).toBe('Bearer');
      expect(verifyResponse.body.expiresIn).toBeDefined();

      loginToken = verifyResponse.body.accessToken;
    });

    it('正常系: バックアップコードでログインに成功する', async () => {
      // 新しいセッションでログイン
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(loginResponse.body.requiresMfa).toBe(true);
      const currentUserId = loginResponse.body.userId;

      // バックアップコードを使用
      const backupCode = backupCodes[0];

      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: currentUserId,
          code: backupCode,
        })
        .expect(200);

      expect(verifyResponse.body.accessToken).toBeDefined();
    });

    it('異常系: 間違ったTOTPコードでログインに失敗する', async () => {
      // 新しいセッションでログイン
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      const currentUserId = loginResponse.body.userId;

      // 間違ったTOTPコード
      const wrongCode = '000000';

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify')
        .send({
          userId: currentUserId,
          code: wrongCode,
        })
        .expect(401); // Unauthorized
    });
  });

  describe('MFA Backup Codes Management', () => {
    it('正常系: バックアップコード一覧を取得する', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/backup-codes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.backupCodes).toBeDefined();
      expect(response.body.totalCount).toBe(10);
      expect(response.body.unusedCount).toBeGreaterThan(0);
      expect(response.body.usedCount).toBeGreaterThanOrEqual(0);
    });

    it('正常系: バックアップコードを再生成する', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/backup-codes/regenerate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
        })
        .expect(200);

      expect(response.body.message).toBeDefined();
      expect(response.body.backupCodes).toBeDefined();
      expect(response.body.backupCodes).toHaveLength(10);
      expect(response.body.warning).toBeDefined();

      // 新しいバックアップコードを保存
      backupCodes = response.body.backupCodes;
    });

    it('異常系: 間違ったパスワードでバックアップコード再生成に失敗する', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/backup-codes/regenerate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'wrong-password',
        })
        .expect(401); // Unauthorized
    });
  });

  describe('MFA Disable', () => {
    it('正常系: MFAを無効化する', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
        })
        .expect(200);

      expect(response.body.message).toBe('MFA has been disabled successfully');
    });

    it('異常系: 既にMFAが無効な場合はエラーを返す', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'password123',
        })
        .expect(404); // Not Found
    });

    it('異常系: 間違ったパスワードでMFA無効化に失敗する', async () => {
      // 再度MFAを有効化
      const setupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const newSecret = setupResponse.body.secret;
      const totpCode = authenticator.generate(newSecret);

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/verify-setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          secret: newSecret,
          code: totpCode,
        })
        .expect(200);

      // 間違ったパスワードで無効化を試みる
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password: 'wrong-password',
        })
        .expect(401); // Unauthorized
    });
  });
});

