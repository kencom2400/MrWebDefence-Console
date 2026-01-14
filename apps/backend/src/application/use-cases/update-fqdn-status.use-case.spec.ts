/**
 * UpdateFqdnStatusUseCase Test
 *
 * FQDNステータス更新処理のユースケースのテスト
 */

import { UpdateFqdnStatusUseCase } from './update-fqdn-status.use-case';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';
import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('UpdateFqdnStatusUseCase', () => {
  let updateFqdnStatusUseCase: UpdateFqdnStatusUseCase;
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

    updateFqdnStatusUseCase = new UpdateFqdnStatusUseCase(mockFqdnRepository);
  });

  describe('execute', () => {
    const fqdnId = randomUUID();
    const existingFqdn = Fqdn.create(fqdnId, 'example.com');

    it('FQDNステータスをACTIVEに更新できる', async () => {
      const activatedFqdn = existingFqdn.activate();

      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.update.mockResolvedValue(activatedFqdn);

      const result = await updateFqdnStatusUseCase.execute(fqdnId, FqdnStatusEnum.ACTIVE);

      expect(mockFqdnRepository.findById).toHaveBeenCalledWith(fqdnId);
      expect(mockFqdnRepository.update).toHaveBeenCalled();
      expect(result.status.isActive()).toBe(true);
    });

    it('FQDNステータスをINACTIVEに更新できる', async () => {
      const deactivatedFqdn = existingFqdn.deactivate();

      mockFqdnRepository.findById.mockResolvedValue(existingFqdn);
      mockFqdnRepository.update.mockResolvedValue(deactivatedFqdn);

      const result = await updateFqdnStatusUseCase.execute(fqdnId, FqdnStatusEnum.INACTIVE);

      expect(result.status.isInactive()).toBe(true);
    });

    it('FQDNが見つからない場合NotFoundExceptionを投げる', async () => {
      mockFqdnRepository.findById.mockResolvedValue(null);

      await expect(updateFqdnStatusUseCase.execute(fqdnId, FqdnStatusEnum.ACTIVE)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFqdnRepository.update).not.toHaveBeenCalled();
    });
  });
});
