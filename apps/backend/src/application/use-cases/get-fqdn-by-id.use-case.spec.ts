/**
 * GetFqdnByIdUseCase Test
 *
 * FQDN詳細取得処理のユースケースのテスト
 */

import { GetFqdnByIdUseCase } from './get-fqdn-by-id.use-case';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('GetFqdnByIdUseCase', () => {
  let getFqdnByIdUseCase: GetFqdnByIdUseCase;
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

    getFqdnByIdUseCase = new GetFqdnByIdUseCase(mockFqdnRepository);
  });

  describe('execute', () => {
    const fqdnId = randomUUID();
    const existingFqdn = Fqdn.create(fqdnId, 'example.com', 'サンプルドメイン');

    it('FQDN詳細を取得できる', async () => {
      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);

      const result = await getFqdnByIdUseCase.execute(fqdnId);

      expect(mockFqdnRepository.findById).toHaveBeenCalledWith(fqdnId);
      expect(result.id).toBe(fqdnId);
      expect(result.fqdn).toBe('example.com');
      expect(result.description).toBe('サンプルドメイン');
    });

    it('FQDNが見つからない場合NotFoundExceptionを投げる', async () => {
      mockFqdnRepository.findById.mockResolvedValue(null);

      await expect(getFqdnByIdUseCase.execute(fqdnId)).rejects.toThrow(NotFoundException);
    });
  });
});
