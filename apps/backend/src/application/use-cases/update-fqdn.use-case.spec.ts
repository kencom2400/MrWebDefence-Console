/**
 * UpdateFqdnUseCase Test
 *
 * FQDN更新処理のユースケースのテスト
 */

import { UpdateFqdnUseCase } from './update-fqdn.use-case';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('UpdateFqdnUseCase', () => {
  let updateFqdnUseCase: UpdateFqdnUseCase;
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

    updateFqdnUseCase = new UpdateFqdnUseCase(mockFqdnRepository);
  });

  describe('execute', () => {
    const fqdnId = randomUUID();
    const existingFqdn = Fqdn.create(fqdnId, 'example.com', '既存の説明');

    it('FQDN文字列を更新できる', async () => {
      const updatedFqdn = existingFqdn.update('example.org');

      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.findByFqdn.mockResolvedValue(null);
      mockFqdnRepository.update.mockResolvedValue(updatedFqdn);

      const result = await updateFqdnUseCase.execute(fqdnId, 'example.org');

      expect(mockFqdnRepository.findById).toHaveBeenCalledWith(fqdnId);
      expect(mockFqdnRepository.findByFqdn).toHaveBeenCalledWith('example.org');
      expect(mockFqdnRepository.update).toHaveBeenCalled();
      expect(result.fqdn).toBe('example.org');
    });

    it('説明を更新できる', async () => {
      const updatedFqdn = existingFqdn.update(undefined, '更新された説明');

      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.update.mockResolvedValue(updatedFqdn);

      const result = await updateFqdnUseCase.execute(fqdnId, undefined, '更新された説明');

      expect(result.description).toBe('更新された説明');
    });

    it('FQDNが見つからない場合NotFoundExceptionを投げる', async () => {
      mockFqdnRepository.findById.mockResolvedValue(null);

      await expect(updateFqdnUseCase.execute(fqdnId, 'example.org')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFqdnRepository.update).not.toHaveBeenCalled();
    });

    it('重複するFQDNに更新しようとした場合ConflictExceptionを投げる', async () => {
      const duplicateFqdn = Fqdn.create(randomUUID(), 'example.org');

      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.findByFqdn.mockResolvedValue(duplicateFqdn);

      await expect(updateFqdnUseCase.execute(fqdnId, 'example.org')).rejects.toThrow(
        ConflictException,
      );
      expect(mockFqdnRepository.update).not.toHaveBeenCalled();
    });

    it('同じFQDNに更新しようとした場合、重複チェックをスキップする', async () => {
      const updatedFqdn = existingFqdn.update('example.com');

      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.update.mockResolvedValue(updatedFqdn);

      await updateFqdnUseCase.execute(fqdnId, 'example.com');

      expect(mockFqdnRepository.findByFqdn).not.toHaveBeenCalled();
      expect(mockFqdnRepository.update).toHaveBeenCalled();
    });
  });
});
