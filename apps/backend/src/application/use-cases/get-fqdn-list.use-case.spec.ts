/**
 * GetFqdnListUseCase Test
 *
 * FQDN一覧取得・検索処理のユースケースのテスト
 */

import { GetFqdnListUseCase } from './get-fqdn-list.use-case';
import {
  IFqdnRepository,
  FqdnListResult,
} from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('GetFqdnListUseCase', () => {
  let getFqdnListUseCase: GetFqdnListUseCase;
  let mockFqdnRepository: jest.Mocked<IFqdnRepository>;

  beforeEach(() => {
    mockFqdnRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByFqdn: jest.fn(),
      findAll: jest.fn(),
    } as any;

    getFqdnListUseCase = new GetFqdnListUseCase(mockFqdnRepository);
  });

  describe('execute', () => {
    it('FQDN一覧を取得できる', async () => {
      const fqdn1 = Fqdn.create(randomUUID(), 'example.com');
      const fqdn2 = Fqdn.create(randomUUID(), 'test.com');
      const result: FqdnListResult = {
        fqdns: [fqdn1, fqdn2],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockFqdnRepository.findAll.mockResolvedValue(result);

      const response = await getFqdnListUseCase.execute({});

      expect(mockFqdnRepository.findAll).toHaveBeenCalledWith({
        fqdn: undefined,
        status: undefined,
        page: 1,
        limit: 10,
      });
      expect(response.fqdns).toHaveLength(2);
      expect(response.total).toBe(2);
    });

    it('検索条件を指定してFQDN一覧を取得できる', async () => {
      const fqdn = Fqdn.create(randomUUID(), 'example.com');
      const result: FqdnListResult = {
        fqdns: [fqdn],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockFqdnRepository.findAll.mockResolvedValue(result);

      const response = await getFqdnListUseCase.execute({
        fqdn: 'example',
        status: 'ACTIVE' as any,
        page: 1,
        limit: 10,
      });

      expect(mockFqdnRepository.findAll).toHaveBeenCalledWith({
        fqdn: 'example',
        status: 'ACTIVE',
        page: 1,
        limit: 10,
      });
      expect(response.fqdns).toHaveLength(1);
    });

    it('ページ番号が1未満の場合BadRequestExceptionを投げる', async () => {
      await expect(getFqdnListUseCase.execute({ page: 0 })).rejects.toThrow(BadRequestException);
      expect(mockFqdnRepository.findAll).not.toHaveBeenCalled();
    });

    it('limitが1未満の場合BadRequestExceptionを投げる', async () => {
      await expect(getFqdnListUseCase.execute({ limit: 0 })).rejects.toThrow(BadRequestException);
      expect(mockFqdnRepository.findAll).not.toHaveBeenCalled();
    });

    it('limitが100を超える場合BadRequestExceptionを投げる', async () => {
      await expect(getFqdnListUseCase.execute({ limit: 101 })).rejects.toThrow(BadRequestException);
      expect(mockFqdnRepository.findAll).not.toHaveBeenCalled();
    });
  });
});
