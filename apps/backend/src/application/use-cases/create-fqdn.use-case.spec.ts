/**
 * CreateFqdnUseCase Test
 *
 * FQDN作成処理のユースケースのテスト
 */

import { CreateFqdnUseCase } from './create-fqdn.use-case';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('CreateFqdnUseCase', () => {
  let createFqdnUseCase: CreateFqdnUseCase;
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

    createFqdnUseCase = new CreateFqdnUseCase(mockFqdnRepository);
  });

  describe('execute', () => {
    const validFqdn = 'example.com';
    const validDescription = 'サンプルドメイン';

    it('有効なFQDNを作成できる', async () => {
      const fqdnId = randomUUID();
      const createdFqdn = Fqdn.create(fqdnId, validFqdn, validDescription);

      mockFqdnRepository.findByFqdn.mockResolvedValue(null);
      mockFqdnRepository.create.mockResolvedValue(createdFqdn);

      const result = await createFqdnUseCase.execute(validFqdn, validDescription);

      expect(mockFqdnRepository.findByFqdn).toHaveBeenCalledWith(validFqdn.toLowerCase());
      expect(mockFqdnRepository.create).toHaveBeenCalled();
      expect(result.fqdn).toBe(validFqdn);
      expect(result.description).toBe(validDescription);
    });

    it('説明なしでFQDNを作成できる', async () => {
      const fqdnId = randomUUID();
      const createdFqdn = Fqdn.create(fqdnId, validFqdn);

      mockFqdnRepository.findByFqdn.mockResolvedValue(null);
      mockFqdnRepository.create.mockResolvedValue(createdFqdn);

      const result = await createFqdnUseCase.execute(validFqdn);

      expect(result.description).toBeNull();
    });

    it('大文字のFQDNを小文字に正規化して作成できる', async () => {
      const fqdnId = randomUUID();
      const createdFqdn = Fqdn.create(fqdnId, 'example.com');

      mockFqdnRepository.findByFqdn.mockResolvedValue(null);
      mockFqdnRepository.create.mockResolvedValue(createdFqdn);

      await createFqdnUseCase.execute('EXAMPLE.COM');

      expect(mockFqdnRepository.findByFqdn).toHaveBeenCalledWith('example.com');
    });

    it('既に存在するFQDNの場合ConflictExceptionを投げる', async () => {
      const existingFqdn = Fqdn.create(randomUUID(), validFqdn);

      mockFqdnRepository.findByFqdn.mockResolvedValue(existingFqdn);

      await expect(createFqdnUseCase.execute(validFqdn)).rejects.toThrow(ConflictException);
      expect(mockFqdnRepository.findByFqdn).toHaveBeenCalledWith(validFqdn.toLowerCase());
      expect(mockFqdnRepository.create).not.toHaveBeenCalled();
    });
  });
});
