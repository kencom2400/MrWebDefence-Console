/**
 * DeleteFqdnUseCase Test
 *
 * FQDN削除処理のユースケースのテスト
 */

import { DeleteFqdnUseCase } from './delete-fqdn.use-case';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('DeleteFqdnUseCase', () => {
  let deleteFqdnUseCase: DeleteFqdnUseCase;
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

    deleteFqdnUseCase = new DeleteFqdnUseCase(mockFqdnRepository);
  });

  describe('execute', () => {
    const fqdnId = randomUUID();
    const existingFqdn = Fqdn.create(fqdnId, 'example.com');

    it('FQDNを削除できる', async () => {
      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.delete.mockResolvedValue(undefined);

      await deleteFqdnUseCase.execute(fqdnId);

      expect(mockFqdnRepository.findById).toHaveBeenCalledWith(fqdnId);
      expect(mockFqdnRepository.delete).toHaveBeenCalledWith(fqdnId);
    });

    it('FQDNが見つからない場合NotFoundExceptionを投げる', async () => {
      mockFqdnRepository.findById.mockResolvedValue(null);

      await expect(deleteFqdnUseCase.execute(fqdnId)).rejects.toThrow(NotFoundException);
      expect(mockFqdnRepository.delete).not.toHaveBeenCalled();
    });
  });
});
