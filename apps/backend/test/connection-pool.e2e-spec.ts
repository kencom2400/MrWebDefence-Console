/**
 * Connection Pool E2E Tests
 *
 * データベース接続プールのE2Eテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DatabaseModule } from '../src/presentation/database.module';
import { DatabaseConnectionPool } from '../src/infrastructure/connection-pool/database-connection-pool';
import { IConnectionPool } from '../src/domain/repositories/connection-pool.repository.interface';
import { ConnectionPoolConfig } from '../src/domain/value-objects/connection-pool-config.value-object';

describe('Connection Pool (e2e)', () => {
  let app: INestApplication;
  let connectionPool: IConnectionPool;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connectionPool = app.get<IConnectionPool>('IConnectionPool');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('接続プールの初期化', () => {
    it('正常系: 接続プールが初期化されている', () => {
      const status = connectionPool.getStatus();
      expect(status).toBeDefined();
      expect(status.totalConnections).toBeGreaterThanOrEqual(0);
      expect(status.activeConnections).toBeGreaterThanOrEqual(0);
      expect(status.idleConnections).toBeGreaterThanOrEqual(0);
    });
  });

  describe('接続の取得と解放', () => {
    it('正常系: 接続を取得して解放できる', async () => {
      const connection = await connectionPool.getConnection();

      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.createdAt).toBeInstanceOf(Date);
      expect(connection.lastUsedAt).toBeInstanceOf(Date);

      const statusBefore = connectionPool.getStatus();
      expect(statusBefore.activeConnections).toBeGreaterThanOrEqual(1);

      await connectionPool.releaseConnection(connection);

      const statusAfter = connectionPool.getStatus();
      expect(statusAfter.idleConnections).toBeGreaterThanOrEqual(1);
    });

    it('正常系: 複数の接続を取得して解放できる', async () => {
      const connection1 = await connectionPool.getConnection();
      const connection2 = await connectionPool.getConnection();

      expect(connection1.id).not.toBe(connection2.id);

      await connectionPool.releaseConnection(connection1);
      await connectionPool.releaseConnection(connection2);

      const status = connectionPool.getStatus();
      expect(status.idleConnections).toBeGreaterThanOrEqual(2);
    });
  });

  describe('接続プールの状態', () => {
    it('正常系: 接続プールの状態を取得できる', () => {
      const status = connectionPool.getStatus();

      expect(status).toBeDefined();
      expect(status.activeConnections).toBeGreaterThanOrEqual(0);
      expect(status.idleConnections).toBeGreaterThanOrEqual(0);
      expect(status.totalConnections).toBeGreaterThanOrEqual(0);
      expect(status.waitingRequests).toBeGreaterThanOrEqual(0);
      expect(typeof status.isHealthy).toBe('boolean');
    });
  });
});

