/**
 * Engine Config E2E Tests
 *
 * WAFエンジン向け設定配信APIのE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import Redis from 'ioredis';
import { IFqdnRepository } from '../src/domain/repositories/fqdn.repository.interface';
import { ICustomerRepository } from '../src/domain/repositories/customer.repository.interface';
import { UserRepository } from '../src/infrastructure/repositories/user.repository';
import { User } from '../src/domain/entities/user.entity';
import { UserRole } from '../src/domain/entities/user-role.enum';
import { TokenManager } from './helpers/token-manager';
import { Fqdn } from '../src/domain/entities/fqdn.entity';
import { Customer } from '../src/domain/entities/customer.entity';
import { FqdnStatus } from '../src/domain/value-objects/fqdn-status.value-object';
import { CustomerStatus } from '../src/domain/value-objects/customer-status.value-object';

describe('Engine Config E2E Tests', () => {
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

    // トークンマネージャーからトークンを取得（キャッシュがあれば再利用）
    accessToken = await TokenManager.getToken(app);
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

  describe('GET /engine/v1/config', () => {
    let sharedToken: string;

    beforeEach(async () => {
      // 各テスト前にRedisをクリア（テストの独立性を保つため）
      if (testClient) {
        try {
          await testClient.flushdb();
          // Redisをクリアしたので、トークンキャッシュもクリア
          TokenManager.clearAllCache();
        } catch (error) {
          // Redis flushdb失敗時は続行
        }
      }

      // 各テスト前にリポジトリをクリア
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      if (fqdnRepository && typeof fqdnRepository.clear === 'function') {
        fqdnRepository.clear();
      } else if (fqdnRepository && typeof fqdnRepository.findAll === 'function') {
        // clear()メソッドがない場合は、findAll()で取得して削除
        const result = await fqdnRepository.findAll({ page: 1, limit: 10000 });
        for (const fqdn of result.fqdns) {
          try {
            await fqdnRepository.delete(fqdn.id);
          } catch (error) {
            // 削除に失敗した場合は無視
          }
        }
      }

      const customerRepository = app.get<ICustomerRepository>('ICustomerRepository') as any;
      if (customerRepository && typeof customerRepository.clear === 'function') {
        customerRepository.clear();
      } else if (customerRepository && typeof customerRepository.findAll === 'function') {
        // clear()メソッドがない場合は、findAll()で取得して削除
        const result = await customerRepository.findAll({ page: 1, limit: 10000 });
        for (const customer of result.customers) {
          try {
            await customerRepository.delete(customer.id);
          } catch (error) {
            // 削除に失敗した場合は無視
          }
        }
      }

      // このdescribeブロック内で共有するトークンを取得
      sharedToken = await TokenManager.getToken(app);
    });

    it('正常系: 設定情報を取得できる（データあり）', async () => {
      // Arrange: テストデータを作成
      const fqdnRepository = app.get<IFqdnRepository>('IFqdnRepository') as any;
      const customerRepository = app.get<ICustomerRepository>('ICustomerRepository') as any;

      // 有効なFQDNを作成
      const fqdn1 = Fqdn.create('fqdn-1', 'example.com', 'Description 1');
      const fqdn2 = Fqdn.create('fqdn-2', 'test.example.com', 'Description 2');
      await fqdnRepository.create(fqdn1);
      await fqdnRepository.create(fqdn2);

      // 無効なFQDNを作成（返却されないことを確認するため）
      const inactiveFqdn = Fqdn.reconstruct(
        'fqdn-inactive',
        'inactive.example.com',
        'Inactive FQDN',
        FqdnStatus.inactive(),
        new Date(),
        new Date(),
      );
      await fqdnRepository.create(inactiveFqdn);

      // 有効な顧客を作成
      const customer1 = Customer.create('customer-1', 'Customer A', 'customer-a@example.com');
      const customer2 = Customer.create('customer-2', 'Customer B', 'customer-b@example.com');
      await customerRepository.create(customer1);
      await customerRepository.create(customer2);

      // 無効な顧客を作成（返却されないことを確認するため）
      const inactiveCustomer = Customer.reconstruct(
        'customer-inactive',
        'Inactive Customer',
        'inactive@example.com',
        null,
        null,
        null,
        CustomerStatus.inactive(),
        new Date(),
        new Date(),
      );
      await customerRepository.create(inactiveCustomer);

      // Act
      const response = await request(app.getHttpServer())
        .get('/engine/v1/config')
        .set('Authorization', `Bearer ${sharedToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('fqdns');
      expect(response.body).toHaveProperty('ipAllowLists');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('lastUpdated');

      // 有効なFQDNのみが返却される
      expect(response.body.fqdns).toHaveLength(2);
      expect(response.body.fqdns.every((f: { status: string }) => f.status === 'ACTIVE')).toBe(
        true,
      );
      expect(response.body.fqdns.map((f: { id: string }) => f.id)).toEqual(
        expect.arrayContaining(['fqdn-1', 'fqdn-2']),
      );
      expect(response.body.fqdns.some((f: { id: string }) => f.id === 'fqdn-inactive')).toBe(
        false,
      );

      // IP AllowListは空配列（スタブ実装のため）
      expect(response.body.ipAllowLists).toHaveLength(0);

      // 有効な顧客のみが返却される
      expect(response.body.customers).toHaveLength(2);
      expect(response.body.customers.every((c: { status: string }) => c.status === 'ACTIVE')).toBe(
        true,
      );
      expect(response.body.customers.map((c: { id: string }) => c.id)).toEqual(
        expect.arrayContaining(['customer-1', 'customer-2']),
      );
      expect(
        response.body.customers.some((c: { id: string }) => c.id === 'customer-inactive'),
      ).toBe(false);

      // lastUpdatedはISO 8601形式の文字列
      expect(response.body.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('正常系: 空のデータで設定情報を取得できる', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/engine/v1/config')
        .set('Authorization', `Bearer ${sharedToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('fqdns');
      expect(response.body).toHaveProperty('ipAllowLists');
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('lastUpdated');

      expect(response.body.fqdns).toHaveLength(0);
      expect(response.body.ipAllowLists).toHaveLength(0);
      expect(response.body.customers).toHaveLength(0);
      expect(response.body.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('異常系: 認証トークンがない場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get('/engine/v1/config').expect(401);
    });

    it('異常系: 無効な認証トークンの場合は401 Unauthorizedを返す', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/engine/v1/config')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
