/**
 * GetEngineConfigUseCase Test
 *
 * WAFエンジン向け設定情報取得処理のユースケースのテスト
 */

import { GetEngineConfigUseCase } from './get-engine-config.use-case';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { IIpAllowListRepository } from '../../domain/repositories/ip-allowlist.repository.interface';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { IpAllowList } from '../../domain/entities/ip-allowlist.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { EngineConfig } from '../../domain/value-objects/engine-config.value-object';
import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';
import { CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

describe('GetEngineConfigUseCase', () => {
  let getEngineConfigUseCase: GetEngineConfigUseCase;
  let mockFqdnRepository: jest.Mocked<IFqdnRepository>;
  let mockIpAllowListRepository: jest.Mocked<IIpAllowListRepository>;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;

  beforeEach(() => {
    mockFqdnRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByFqdn: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<IFqdnRepository>;

    mockIpAllowListRepository = {
      countByUserId: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<IIpAllowListRepository>;

    mockCustomerRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<ICustomerRepository>;

    getEngineConfigUseCase = new GetEngineConfigUseCase(
      mockFqdnRepository,
      mockIpAllowListRepository,
      mockCustomerRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('execute', () => {
    it('正常系: 設定情報を取得できる', async () => {
      // Arrange
      const fqdn1 = Fqdn.create('fqdn-1', 'example.com', 'Description 1');
      const fqdn2 = Fqdn.create('fqdn-2', 'test.example.com', 'Description 2');
      const fqdns = [fqdn1, fqdn2];

      const ipAllowList1 = IpAllowList.create('ip-allowlist-1', 'user-1', '192.168.1.1');
      const ipAllowList2 = IpAllowList.create('ip-allowlist-2', 'user-1', '192.168.1.0/24');
      const ipAllowLists = [ipAllowList1, ipAllowList2];

      const customer1 = Customer.create('customer-1', 'Customer A', 'customer-a@example.com');
      const customer2 = Customer.create('customer-2', 'Customer B', 'customer-b@example.com');
      const customers = [customer1, customer2];

      mockFqdnRepository.findAll.mockResolvedValue({
        fqdns,
        total: 2,
        page: 1,
        limit: 10000,
      });
      mockIpAllowListRepository.findAll.mockResolvedValue(ipAllowLists);
      mockCustomerRepository.findAll.mockResolvedValue({
        customers,
        total: 2,
        page: 1,
        limit: 10000,
      });

      // Act
      const result = await getEngineConfigUseCase.execute();

      // Assert
      expect(result).toBeInstanceOf(EngineConfig);
      expect(result.fqdns).toHaveLength(2);
      expect(result.fqdns.map((f) => f.id)).toEqual(expect.arrayContaining(['fqdn-1', 'fqdn-2']));
      expect(result.ipAllowLists).toHaveLength(2);
      expect(result.ipAllowLists.map((i) => i.id)).toEqual(
        expect.arrayContaining(['ip-allowlist-1', 'ip-allowlist-2']),
      );
      expect(result.customers).toHaveLength(2);
      expect(result.customers.map((c) => c.id)).toEqual(
        expect.arrayContaining(['customer-1', 'customer-2']),
      );
      expect(result.lastUpdated).toBeInstanceOf(Date);

      expect(mockFqdnRepository.findAll).toHaveBeenCalledWith({
        status: FqdnStatusEnum.ACTIVE,
        page: 1,
        limit: 10000,
      });
      expect(mockIpAllowListRepository.findAll).toHaveBeenCalled();
      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith({
        status: CustomerStatusEnum.ACTIVE,
        page: 1,
        limit: 10000,
      });
    });

    it('正常系: 空のデータで設定情報を取得できる', async () => {
      // Arrange
      mockFqdnRepository.findAll.mockResolvedValue({
        fqdns: [],
        total: 0,
        page: 1,
        limit: 10000,
      });
      mockIpAllowListRepository.findAll.mockResolvedValue([]);
      mockCustomerRepository.findAll.mockResolvedValue({
        customers: [],
        total: 0,
        page: 1,
        limit: 10000,
      });

      // Act
      const result = await getEngineConfigUseCase.execute();

      // Assert
      expect(result).toBeInstanceOf(EngineConfig);
      expect(result.fqdns).toHaveLength(0);
      expect(result.ipAllowLists).toHaveLength(0);
      expect(result.customers).toHaveLength(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('正常系: 並列実行でデータを取得する', async () => {
      // Arrange
      jest.useFakeTimers();
      const fqdn = Fqdn.create('fqdn-1', 'example.com');
      const ipAllowList = IpAllowList.create('ip-allowlist-1', 'user-1', '192.168.1.1');
      const customer = Customer.create('customer-1', 'Customer A', 'customer-a@example.com');

      // Promise.allで並列実行されることを確認するため、遅延を追加
      mockFqdnRepository.findAll.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  fqdns: [fqdn],
                  total: 1,
                  page: 1,
                  limit: 10000,
                }),
              10,
            ),
          ),
      );
      mockIpAllowListRepository.findAll.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([ipAllowList]), 10)),
      );
      mockCustomerRepository.findAll.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  customers: [customer],
                  total: 1,
                  page: 1,
                  limit: 10000,
                }),
              10,
            ),
          ),
      );

      // Act
      const executePromise = getEngineConfigUseCase.execute();

      // タイマーを進めて、すべてのPromiseを解決
      jest.runAllTimers();

      // Assert
      await executePromise;

      // すべてのリポジトリメソッドが呼ばれたことを確認
      expect(mockFqdnRepository.findAll).toHaveBeenCalled();
      expect(mockIpAllowListRepository.findAll).toHaveBeenCalled();
      expect(mockCustomerRepository.findAll).toHaveBeenCalled();

      // クリーンアップ
      jest.useRealTimers();
    });
  });
});
