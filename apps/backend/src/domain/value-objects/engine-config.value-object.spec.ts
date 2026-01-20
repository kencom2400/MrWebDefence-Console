/**
 * EngineConfig Value Object Test
 *
 * WAFエンジン向け設定情報の値オブジェクトのテスト
 */

import { EngineConfig } from './engine-config.value-object';
import { Fqdn } from '../entities/fqdn.entity';
import { IpAllowList } from '../entities/ip-allowlist.entity';
import { Customer } from '../entities/customer.entity';
import { FqdnStatus } from './fqdn-status.value-object';
import { CustomerStatus } from './customer-status.value-object';

describe('EngineConfig', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('正常系: EngineConfigを作成できる', () => {
      // Arrange
      const fqdn1 = Fqdn.create('fqdn-1', 'example.com', 'Description 1');
      const fqdn2 = Fqdn.create('fqdn-2', 'test.example.com', 'Description 2');
      const fqdns = [fqdn1, fqdn2];

      const ipAllowList1 = IpAllowList.create(
        'ip-allowlist-1',
        'user-1',
        '192.168.1.1',
        'Description 1',
      );
      const ipAllowList2 = IpAllowList.create('ip-allowlist-2', 'user-1', '192.168.1.0/24');
      const ipAllowLists = [ipAllowList1, ipAllowList2];

      const customer1 = Customer.create(
        'customer-1',
        'Customer A',
        'customer-a@example.com',
      );
      const customer2 = Customer.create(
        'customer-2',
        'Customer B',
        'customer-b@example.com',
      );
      const customers = [customer1, customer2];

      // Act
      const engineConfig = EngineConfig.create(fqdns, ipAllowLists, customers);

      // Assert
      expect(engineConfig.fqdns).toHaveLength(2);
      expect(engineConfig.fqdns[0].id).toBe('fqdn-1');
      expect(engineConfig.fqdns[1].id).toBe('fqdn-2');
      expect(engineConfig.ipAllowLists).toHaveLength(2);
      expect(engineConfig.ipAllowLists[0].id).toBe('ip-allowlist-1');
      expect(engineConfig.ipAllowLists[1].id).toBe('ip-allowlist-2');
      expect(engineConfig.customers).toHaveLength(2);
      expect(engineConfig.customers[0].id).toBe('customer-1');
      expect(engineConfig.customers[1].id).toBe('customer-2');
      expect(engineConfig.lastUpdated).toBeInstanceOf(Date);
    });

    it('正常系: 空の配列でEngineConfigを作成できる', () => {
      // Arrange
      const fqdns: Fqdn[] = [];
      const ipAllowLists: IpAllowList[] = [];
      const customers: Customer[] = [];

      // Act
      const engineConfig = EngineConfig.create(fqdns, ipAllowLists, customers);

      // Assert
      expect(engineConfig.fqdns).toHaveLength(0);
      expect(engineConfig.ipAllowLists).toHaveLength(0);
      expect(engineConfig.customers).toHaveLength(0);
      expect(engineConfig.lastUpdated).toBeInstanceOf(Date);
    });

    it('正常系: 配列が読み取り専用になる', () => {
      // Arrange
      const fqdn = Fqdn.create('fqdn-1', 'example.com');
      const fqdns = [fqdn];
      const ipAllowLists: IpAllowList[] = [];
      const customers: Customer[] = [];

      // Act
      const engineConfig = EngineConfig.create(fqdns, ipAllowLists, customers);

      // Assert
      expect(() => {
        // @ts-expect-error - 読み取り専用であることを確認するため
        engineConfig.fqdns.push(fqdn);
      }).toThrow();
    });
  });

  describe('equals', () => {
    it('正常系: 同じ値のEngineConfigは等しいと判定される', () => {
      // Arrange
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));

      const fqdn1 = Fqdn.create('fqdn-1', 'example.com');
      const fqdn2 = Fqdn.create('fqdn-2', 'test.example.com');
      const fqdns = [fqdn1, fqdn2];

      const ipAllowList1 = IpAllowList.create('ip-allowlist-1', 'user-1', '192.168.1.1');
      const ipAllowLists = [ipAllowList1];

      const customer1 = Customer.create('customer-1', 'Customer A', 'customer-a@example.com');
      const customers = [customer1];

      // 同じ時刻で作成（fake timersを使用）
      const engineConfig1 = EngineConfig.create(fqdns, ipAllowLists, customers);
      const engineConfig2 = EngineConfig.create(fqdns, ipAllowLists, customers);

      // Act & Assert
      expect(engineConfig1.equals(engineConfig2)).toBe(true);

      // クリーンアップ
      jest.useRealTimers();
    });

    it('正常系: 順序が異なっていても等価と判定される', () => {
      // Arrange
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));

      const fqdn1 = Fqdn.create('fqdn-1', 'example.com');
      const fqdn2 = Fqdn.create('fqdn-2', 'test.example.com');
      const fqdns1 = [fqdn1, fqdn2];
      const fqdns2 = [fqdn2, fqdn1]; // 順序を入れ替え

      const ipAllowList1 = IpAllowList.create('ip-allowlist-1', 'user-1', '192.168.1.1');
      const ipAllowList2 = IpAllowList.create('ip-allowlist-2', 'user-1', '192.168.1.0/24');
      const ipAllowLists1 = [ipAllowList1, ipAllowList2];
      const ipAllowLists2 = [ipAllowList2, ipAllowList1]; // 順序を入れ替え

      const customer1 = Customer.create('customer-1', 'Customer A', 'customer-a@example.com');
      const customer2 = Customer.create('customer-2', 'Customer B', 'customer-b@example.com');
      const customers1 = [customer1, customer2];
      const customers2 = [customer2, customer1]; // 順序を入れ替え

      // 同じ時刻で作成（fake timersを使用）
      const engineConfig1 = EngineConfig.create(fqdns1, ipAllowLists1, customers1);
      const engineConfig2 = EngineConfig.create(fqdns2, ipAllowLists2, customers2);

      // Act & Assert
      expect(engineConfig1.equals(engineConfig2)).toBe(true);

      // クリーンアップ
      jest.useRealTimers();
    });

    it('正常系: 異なるFQDN数のEngineConfigは等しくないと判定される', () => {
      // Arrange
      const fqdn1 = Fqdn.create('fqdn-1', 'example.com');
      const fqdns1 = [fqdn1];
      const fqdns2 = [fqdn1, Fqdn.create('fqdn-2', 'test.example.com')];

      const ipAllowLists: IpAllowList[] = [];
      const customers: Customer[] = [];

      const engineConfig1 = EngineConfig.create(fqdns1, ipAllowLists, customers);
      const engineConfig2 = EngineConfig.create(fqdns2, ipAllowLists, customers);

      // Act & Assert
      expect(engineConfig1.equals(engineConfig2)).toBe(false);
    });

    it('正常系: 異なるIP AllowList数のEngineConfigは等しくないと判定される', () => {
      // Arrange
      const fqdns: Fqdn[] = [];
      const ipAllowList1 = IpAllowList.create('ip-allowlist-1', 'user-1', '192.168.1.1');
      const ipAllowLists1 = [ipAllowList1];
      const ipAllowLists2: IpAllowList[] = [];

      const customers: Customer[] = [];

      const engineConfig1 = EngineConfig.create(fqdns, ipAllowLists1, customers);
      const engineConfig2 = EngineConfig.create(fqdns, ipAllowLists2, customers);

      // Act & Assert
      expect(engineConfig1.equals(engineConfig2)).toBe(false);
    });

    it('正常系: 異なるCustomer数のEngineConfigは等しくないと判定される', () => {
      // Arrange
      const fqdns: Fqdn[] = [];
      const ipAllowLists: IpAllowList[] = [];
      const customer1 = Customer.create('customer-1', 'Customer A', 'customer-a@example.com');
      const customers1 = [customer1];
      const customers2: Customer[] = [];

      const engineConfig1 = EngineConfig.create(fqdns, ipAllowLists, customers1);
      const engineConfig2 = EngineConfig.create(fqdns, ipAllowLists, customers2);

      // Act & Assert
      expect(engineConfig1.equals(engineConfig2)).toBe(false);
    });
  });
});
