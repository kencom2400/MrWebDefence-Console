/**
 * Fqdn Entity テスト
 */

import { Fqdn } from './fqdn.entity';
import { FqdnStatus } from '../value-objects/fqdn-status.value-object';
import { randomUUID } from 'crypto';

describe('Fqdn', () => {
  const validId = randomUUID();
  const validFqdn = 'example.com';
  const validDescription = 'サンプルドメイン';

  describe('create', () => {
    it('有効な値でFQDNを作成できる', () => {
      const fqdn = Fqdn.create(validId, validFqdn);
      expect(fqdn.id).toBe(validId);
      expect(fqdn.fqdn).toBe(validFqdn);
      expect(fqdn.description).toBeNull();
      expect(fqdn.status.isActive()).toBe(true);
      expect(fqdn.createdAt).toBeInstanceOf(Date);
      expect(fqdn.updatedAt).toBeInstanceOf(Date);
    });

    it('説明を含めてFQDNを作成できる', () => {
      const fqdn = Fqdn.create(validId, validFqdn, validDescription);
      expect(fqdn.fqdn).toBe(validFqdn);
      expect(fqdn.description).toBe(validDescription);
    });

    it('FQDNを小文字に正規化する', () => {
      const fqdn = Fqdn.create(validId, 'EXAMPLE.COM');
      expect(fqdn.fqdn).toBe('example.com');
    });

    it('FQDNが空の場合エラーを投げる', () => {
      expect(() => Fqdn.create(validId, '')).toThrow('FQDN cannot be empty');
      expect(() => Fqdn.create(validId, '   ')).toThrow('FQDN cannot be empty');
    });

    it('FQDNが253文字を超える場合エラーを投げる', () => {
      const longFqdn = 'a'.repeat(250) + '.com';
      expect(() => Fqdn.create(validId, longFqdn)).toThrow('FQDN must be 253 characters or less');
    });

    it('ピリオドを含まない場合エラーを投げる', () => {
      expect(() => Fqdn.create(validId, 'example')).toThrow(
        'FQDN must contain at least one dot (at least 2 labels required)',
      );
    });

    it('ラベルが63文字を超える場合エラーを投げる', () => {
      const longLabel = 'a'.repeat(64);
      const invalidFqdn = `${longLabel}.com`;
      expect(() => Fqdn.create(validId, invalidFqdn)).toThrow(
        'Each label in FQDN must be 63 characters or less',
      );
    });

    it('空のラベルを含む場合エラーを投げる', () => {
      expect(() => Fqdn.create(validId, 'example..com')).toThrow(
        'FQDN cannot contain empty labels',
      );
    });

    it('ラベルの先頭がハイフンの場合エラーを投げる', () => {
      expect(() => Fqdn.create(validId, '-example.com')).toThrow(
        'FQDN labels cannot start or end with a hyphen',
      );
    });

    it('ラベルの末尾がハイフンの場合エラーを投げる', () => {
      expect(() => Fqdn.create(validId, 'example-.com')).toThrow(
        'FQDN labels cannot start or end with a hyphen',
      );
    });

    it('無効な文字を含むラベルの場合エラーを投げる', () => {
      expect(() => Fqdn.create(validId, 'example_com.com')).toThrow(
        'FQDN labels can only contain lowercase letters, numbers, and hyphens',
      );
    });

    it('有効なFQDN形式を作成できる', () => {
      const validFqdns = [
        'example.com',
        'subdomain.example.com',
        'test-123.example.org',
        'a.b.c.d.example.com',
      ];

      validFqdns.forEach((fqdnStr) => {
        const fqdn = Fqdn.create(validId, fqdnStr);
        expect(fqdn.fqdn).toBe(fqdnStr);
      });
    });

    it('説明の前後の空白をトリムする', () => {
      const fqdn = Fqdn.create(validId, validFqdn, '  サンプルドメイン  ');
      expect(fqdn.description).toBe('サンプルドメイン');
    });
  });

  describe('reconstruct', () => {
    it('既存のFQDNを再構築できる', () => {
      const createdAt = new Date('2026-01-13T10:00:00.000Z');
      const updatedAt = new Date('2026-01-13T11:00:00.000Z');
      const status = FqdnStatus.active();

      const fqdn = Fqdn.reconstruct(
        validId,
        validFqdn,
        validDescription,
        status,
        createdAt,
        updatedAt,
      );

      expect(fqdn.id).toBe(validId);
      expect(fqdn.fqdn).toBe(validFqdn);
      expect(fqdn.description).toBe(validDescription);
      expect(fqdn.status).toBe(status);
      expect(fqdn.createdAt).toBe(createdAt);
      expect(fqdn.updatedAt).toBe(updatedAt);
    });
  });

  describe('update', () => {
    let fqdn: Fqdn;

    beforeEach(() => {
      fqdn = Fqdn.create(validId, validFqdn, validDescription);
    });

    it('FQDN文字列を更新できる', () => {
      const updated = fqdn.update('example.org');
      expect(updated.fqdn).toBe('example.org');
      expect(updated.description).toBe(validDescription);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(fqdn.updatedAt.getTime());
    });

    it('説明を更新できる', () => {
      const newDescription = '更新されたサンプルドメイン';
      const updated = fqdn.update(undefined, newDescription);
      expect(updated.fqdn).toBe(validFqdn);
      expect(updated.description).toBe(newDescription);
    });

    it('FQDN文字列と説明を同時に更新できる', () => {
      const updated = fqdn.update('example.org', '更新されたサンプルドメイン');
      expect(updated.fqdn).toBe('example.org');
      expect(updated.description).toBe('更新されたサンプルドメイン');
    });

    it('説明をnullに更新できる', () => {
      const updated = fqdn.update(undefined, null);
      expect(updated.description).toBeNull();
    });

    it('更新時にFQDNが無効な場合エラーを投げる', () => {
      expect(() => fqdn.update('invalid')).toThrow(
        'FQDN must contain at least one dot (at least 2 labels required)',
      );
    });

    it('更新時に説明が500文字を超える場合エラーを投げる', () => {
      const longDescription = 'a'.repeat(501);
      expect(() => fqdn.update(undefined, longDescription)).toThrow(
        'Description must be 500 characters or less',
      );
    });

    it('更新時にFQDNを小文字に正規化する', () => {
      const updated = fqdn.update('EXAMPLE.ORG');
      expect(updated.fqdn).toBe('example.org');
    });
  });

  describe('activate', () => {
    it('既にアクティブな場合、同じエンティティを返す', () => {
      const fqdn = Fqdn.create(validId, validFqdn);
      const activated = fqdn.activate();
      expect(activated).toBe(fqdn);
    });

    it('非アクティブなFQDNをアクティブにできる', () => {
      const fqdn = Fqdn.reconstruct(
        validId,
        validFqdn,
        validDescription,
        FqdnStatus.inactive(),
        new Date(),
        new Date(),
      );
      const activated = fqdn.activate();
      expect(activated.status.isActive()).toBe(true);
      expect(activated.updatedAt.getTime()).toBeGreaterThanOrEqual(fqdn.updatedAt.getTime());
    });
  });

  describe('deactivate', () => {
    it('既に非アクティブな場合、同じエンティティを返す', () => {
      const fqdn = Fqdn.reconstruct(
        validId,
        validFqdn,
        validDescription,
        FqdnStatus.inactive(),
        new Date(),
        new Date(),
      );
      const deactivated = fqdn.deactivate();
      expect(deactivated).toBe(fqdn);
    });

    it('アクティブなFQDNを非アクティブにできる', () => {
      const fqdn = Fqdn.create(validId, validFqdn);
      const deactivated = fqdn.deactivate();
      expect(deactivated.status.isInactive()).toBe(true);
      expect(deactivated.updatedAt.getTime()).toBeGreaterThanOrEqual(fqdn.updatedAt.getTime());
    });
  });
});
