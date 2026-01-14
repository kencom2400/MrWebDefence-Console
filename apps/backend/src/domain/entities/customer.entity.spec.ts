/**
 * Customer Entity テスト
 */

import { Customer } from './customer.entity';
import { CustomerStatus } from '../value-objects/customer-status.value-object';
import { randomUUID } from 'crypto';

describe('Customer', () => {
  const validId = randomUUID();
  const validName = '山田太郎';
  const validEmail = 'yamada@example.com';
  const validPhone = '090-1234-5678';
  const validCompany = '株式会社サンプル';
  const validAddress = '東京都渋谷区...';

  describe('create', () => {
    it('有効な値で顧客を作成できる', () => {
      const customer = Customer.create(validId, validName, validEmail);
      expect(customer.id).toBe(validId);
      expect(customer.name).toBe(validName);
      expect(customer.email).toBe(validEmail);
      expect(customer.phone).toBeNull();
      expect(customer.company).toBeNull();
      expect(customer.address).toBeNull();
      expect(customer.status.isActive()).toBe(true);
      expect(customer.createdAt).toBeInstanceOf(Date);
      expect(customer.updatedAt).toBeInstanceOf(Date);
    });

    it('オプションフィールドを含めて顧客を作成できる', () => {
      const customer = Customer.create(
        validId,
        validName,
        validEmail,
        validPhone,
        validCompany,
        validAddress,
      );
      expect(customer.phone).toBe(validPhone);
      expect(customer.company).toBe(validCompany);
      expect(customer.address).toBe(validAddress);
    });

    it('名前が空の場合エラーを投げる', () => {
      expect(() => Customer.create(validId, '', validEmail)).toThrow(
        'Customer name cannot be empty',
      );
      expect(() => Customer.create(validId, '   ', validEmail)).toThrow(
        'Customer name cannot be empty',
      );
    });

    it('名前が100文字を超える場合エラーを投げる', () => {
      const longName = 'a'.repeat(101);
      expect(() => Customer.create(validId, longName, validEmail)).toThrow(
        'Customer name must be 100 characters or less',
      );
    });

    it('メールアドレスが空の場合エラーを投げる', () => {
      expect(() => Customer.create(validId, validName, '')).toThrow(
        'Customer email cannot be empty',
      );
    });

    it('無効なメールアドレスの場合エラーを投げる', () => {
      expect(() => Customer.create(validId, validName, 'invalid-email')).toThrow(
        'Invalid email format',
      );
      expect(() => Customer.create(validId, validName, 'invalid@')).toThrow('Invalid email format');
      expect(() => Customer.create(validId, validName, '@example.com')).toThrow(
        'Invalid email format',
      );
    });

    it('電話番号が20文字を超える場合エラーを投げる', () => {
      const longPhone = '0'.repeat(21);
      expect(() => Customer.create(validId, validName, validEmail, longPhone)).toThrow(
        'Phone number must be 20 characters or less',
      );
    });

    it('会社名が100文字を超える場合エラーを投げる', () => {
      const longCompany = 'a'.repeat(101);
      expect(() => Customer.create(validId, validName, validEmail, null, longCompany)).toThrow(
        'Company name must be 100 characters or less',
      );
    });

    it('住所が200文字を超える場合エラーを投げる', () => {
      const longAddress = 'a'.repeat(201);
      expect(() =>
        Customer.create(validId, validName, validEmail, null, null, longAddress),
      ).toThrow('Address must be 200 characters or less');
    });

    it('名前とメールアドレスの前後の空白をトリムする', () => {
      const customer = Customer.create(validId, '  山田太郎  ', '  yamada@example.com  ');
      expect(customer.name).toBe('山田太郎');
      expect(customer.email).toBe('yamada@example.com');
    });
  });

  describe('reconstruct', () => {
    it('既存の顧客を再構築できる', () => {
      const createdAt = new Date('2026-01-13T10:00:00.000Z');
      const updatedAt = new Date('2026-01-13T11:00:00.000Z');
      const status = CustomerStatus.active();

      const customer = Customer.reconstruct(
        validId,
        validName,
        validEmail,
        validPhone,
        validCompany,
        validAddress,
        status,
        createdAt,
        updatedAt,
      );

      expect(customer.id).toBe(validId);
      expect(customer.name).toBe(validName);
      expect(customer.email).toBe(validEmail);
      expect(customer.phone).toBe(validPhone);
      expect(customer.company).toBe(validCompany);
      expect(customer.address).toBe(validAddress);
      expect(customer.status).toBe(status);
      expect(customer.createdAt).toBe(createdAt);
      expect(customer.updatedAt).toBe(updatedAt);
    });
  });

  describe('update', () => {
    let customer: Customer;

    beforeEach(() => {
      customer = Customer.create(
        validId,
        validName,
        validEmail,
        validPhone,
        validCompany,
        validAddress,
      );
    });

    it('名前を更新できる', () => {
      const updated = customer.update('山田花子');
      expect(updated.name).toBe('山田花子');
      expect(updated.email).toBe(validEmail);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(customer.updatedAt.getTime());
    });

    it('メールアドレスを更新できる', () => {
      const newEmail = 'yamada-hanako@example.com';
      const updated = customer.update(undefined, newEmail);
      expect(updated.name).toBe(validName);
      expect(updated.email).toBe(newEmail);
    });

    it('複数のフィールドを同時に更新できる', () => {
      const updated = customer.update('山田花子', 'yamada-hanako@example.com', '090-9876-5432');
      expect(updated.name).toBe('山田花子');
      expect(updated.email).toBe('yamada-hanako@example.com');
      expect(updated.phone).toBe('090-9876-5432');
    });

    it('電話番号をnullに更新できる', () => {
      const updated = customer.update(undefined, undefined, null);
      expect(updated.phone).toBeNull();
    });

    it('更新時に名前が空の場合エラーを投げる', () => {
      expect(() => customer.update('')).toThrow('Customer name cannot be empty');
    });

    it('更新時に無効なメールアドレスの場合エラーを投げる', () => {
      expect(() => customer.update(undefined, 'invalid-email')).toThrow('Invalid email format');
    });
  });

  describe('activate', () => {
    it('既にアクティブな場合、同じエンティティを返す', () => {
      const customer = Customer.create(validId, validName, validEmail);
      const activated = customer.activate();
      expect(activated).toBe(customer);
    });

    it('非アクティブな顧客をアクティブにできる', () => {
      const customer = Customer.reconstruct(
        validId,
        validName,
        validEmail,
        null,
        null,
        null,
        CustomerStatus.inactive(),
        new Date(),
        new Date(),
      );
      const activated = customer.activate();
      expect(activated.status.isActive()).toBe(true);
      expect(activated.updatedAt.getTime()).toBeGreaterThanOrEqual(customer.updatedAt.getTime());
    });
  });

  describe('deactivate', () => {
    it('既に非アクティブな場合、同じエンティティを返す', () => {
      const customer = Customer.reconstruct(
        validId,
        validName,
        validEmail,
        null,
        null,
        null,
        CustomerStatus.inactive(),
        new Date(),
        new Date(),
      );
      const deactivated = customer.deactivate();
      expect(deactivated).toBe(customer);
    });

    it('アクティブな顧客を非アクティブにできる', () => {
      const customer = Customer.create(validId, validName, validEmail);
      const deactivated = customer.deactivate();
      expect(deactivated.status.isInactive()).toBe(true);
      expect(deactivated.updatedAt.getTime()).toBeGreaterThanOrEqual(customer.updatedAt.getTime());
    });
  });
});
