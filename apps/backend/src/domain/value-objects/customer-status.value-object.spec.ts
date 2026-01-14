/**
 * CustomerStatus Value Object テスト
 */

import { CustomerStatus, CustomerStatusEnum } from './customer-status.value-object';

describe('CustomerStatus', () => {
  describe('create', () => {
    it('有効なACTIVEステータスを作成できる', () => {
      const status = CustomerStatus.create('ACTIVE');
      expect(status.getValue()).toBe(CustomerStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
      expect(status.isInactive()).toBe(false);
    });

    it('有効なINACTIVEステータスを作成できる', () => {
      const status = CustomerStatus.create('INACTIVE');
      expect(status.getValue()).toBe(CustomerStatusEnum.INACTIVE);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(true);
    });

    it('大文字小文字を区別せずに作成できる', () => {
      const status1 = CustomerStatus.create('active');
      expect(status1.getValue()).toBe(CustomerStatusEnum.ACTIVE);

      const status2 = CustomerStatus.create('inactive');
      expect(status2.getValue()).toBe(CustomerStatusEnum.INACTIVE);
    });

    it('空文字列の場合エラーを投げる', () => {
      expect(() => CustomerStatus.create('')).toThrow('Customer status cannot be empty');
      expect(() => CustomerStatus.create('   ')).toThrow('Customer status cannot be empty');
    });

    it('無効な値の場合エラーを投げる', () => {
      expect(() => CustomerStatus.create('INVALID')).toThrow("Invalid customer status: INVALID. Must be 'ACTIVE' or 'INACTIVE'");
    });
  });

  describe('reconstruct', () => {
    it('既存のACTIVEステータスを再構築できる', () => {
      const status = CustomerStatus.reconstruct(CustomerStatusEnum.ACTIVE);
      expect(status.getValue()).toBe(CustomerStatusEnum.ACTIVE);
    });

    it('既存のINACTIVEステータスを再構築できる', () => {
      const status = CustomerStatus.reconstruct(CustomerStatusEnum.INACTIVE);
      expect(status.getValue()).toBe(CustomerStatusEnum.INACTIVE);
    });
  });

  describe('active', () => {
    it('ACTIVEステータスを作成できる', () => {
      const status = CustomerStatus.active();
      expect(status.getValue()).toBe(CustomerStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
    });
  });

  describe('inactive', () => {
    it('INACTIVEステータスを作成できる', () => {
      const status = CustomerStatus.inactive();
      expect(status.getValue()).toBe(CustomerStatusEnum.INACTIVE);
      expect(status.isInactive()).toBe(true);
    });
  });

  describe('equals', () => {
    it('同じステータスの場合trueを返す', () => {
      const status1 = CustomerStatus.active();
      const status2 = CustomerStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it('異なるステータスの場合falseを返す', () => {
      const status1 = CustomerStatus.active();
      const status2 = CustomerStatus.inactive();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});

