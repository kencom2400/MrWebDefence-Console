/**
 * FqdnStatus Value Object テスト
 */

import { FqdnStatus, FqdnStatusEnum } from './fqdn-status.value-object';
import { BadRequestException } from '@nestjs/common';

describe('FqdnStatus', () => {
  describe('create', () => {
    it('有効な値でFQDNステータスを作成できる', () => {
      const status = FqdnStatus.create('ACTIVE');
      expect(status.getValue()).toBe(FqdnStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
      expect(status.isInactive()).toBe(false);
    });

    it('小文字の値でもFQDNステータスを作成できる', () => {
      const status = FqdnStatus.create('active');
      expect(status.getValue()).toBe(FqdnStatusEnum.ACTIVE);
    });

    it('INACTIVEステータスを作成できる', () => {
      const status = FqdnStatus.create('INACTIVE');
      expect(status.getValue()).toBe(FqdnStatusEnum.INACTIVE);
      expect(status.isActive()).toBe(false);
      expect(status.isInactive()).toBe(true);
    });

    it('空の値の場合エラーを投げる', () => {
      expect(() => FqdnStatus.create('')).toThrow(BadRequestException);
      expect(() => FqdnStatus.create('   ')).toThrow(BadRequestException);
    });

    it('無効な値の場合エラーを投げる', () => {
      expect(() => FqdnStatus.create('INVALID')).toThrow(BadRequestException);
      expect(() => FqdnStatus.create('PENDING')).toThrow(BadRequestException);
    });
  });

  describe('reconstruct', () => {
    it('既存のFQDNステータスを再構築できる', () => {
      const status = FqdnStatus.reconstruct(FqdnStatusEnum.ACTIVE);
      expect(status.getValue()).toBe(FqdnStatusEnum.ACTIVE);
    });

    it('INACTIVEステータスを再構築できる', () => {
      const status = FqdnStatus.reconstruct(FqdnStatusEnum.INACTIVE);
      expect(status.getValue()).toBe(FqdnStatusEnum.INACTIVE);
    });
  });

  describe('active', () => {
    it('アクティブなステータスを作成できる', () => {
      const status = FqdnStatus.active();
      expect(status.getValue()).toBe(FqdnStatusEnum.ACTIVE);
      expect(status.isActive()).toBe(true);
    });
  });

  describe('inactive', () => {
    it('非アクティブなステータスを作成できる', () => {
      const status = FqdnStatus.inactive();
      expect(status.getValue()).toBe(FqdnStatusEnum.INACTIVE);
      expect(status.isInactive()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('ACTIVEステータスの場合trueを返す', () => {
      const status = FqdnStatus.active();
      expect(status.isActive()).toBe(true);
    });

    it('INACTIVEステータスの場合falseを返す', () => {
      const status = FqdnStatus.inactive();
      expect(status.isActive()).toBe(false);
    });
  });

  describe('isInactive', () => {
    it('INACTIVEステータスの場合trueを返す', () => {
      const status = FqdnStatus.inactive();
      expect(status.isInactive()).toBe(true);
    });

    it('ACTIVEステータスの場合falseを返す', () => {
      const status = FqdnStatus.active();
      expect(status.isInactive()).toBe(false);
    });
  });

  describe('equals', () => {
    it('同じステータスの場合trueを返す', () => {
      const status1 = FqdnStatus.active();
      const status2 = FqdnStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it('異なるステータスの場合falseを返す', () => {
      const status1 = FqdnStatus.active();
      const status2 = FqdnStatus.inactive();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
