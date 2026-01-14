/**
 * FqdnStatus Value Object
 *
 * FQDNステータスの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { BadRequestException } from '@nestjs/common';

export enum FqdnStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class FqdnStatus {
  private readonly value: FqdnStatusEnum;

  private constructor(value: FqdnStatusEnum) {
    this.value = value;
  }

  /**
   * FQDNステータスを作成する
   * @param value ステータス値（'ACTIVE' または 'INACTIVE'）
   * @returns FqdnStatus Value Object
   * @throws BadRequestException バリデーション失敗時
   */
  public static create(value: string): FqdnStatus {
    if (!value || value.trim().length === 0) {
      throw new BadRequestException('FQDN status cannot be empty');
    }

    const normalizedValue = value.toUpperCase();
    if (normalizedValue !== FqdnStatusEnum.ACTIVE && normalizedValue !== FqdnStatusEnum.INACTIVE) {
      throw new BadRequestException(
        `Invalid FQDN status: ${value}. Must be 'ACTIVE' or 'INACTIVE'`,
      );
    }

    return new FqdnStatus(normalizedValue as FqdnStatusEnum);
  }

  /**
   * 既存のFQDNステータスを再構築する
   * @param value ステータス値
   * @returns FqdnStatus Value Object
   */
  public static reconstruct(value: FqdnStatusEnum): FqdnStatus {
    return new FqdnStatus(value);
  }

  /**
   * アクティブなステータスを作成する
   * @returns FqdnStatus Value Object (ACTIVE)
   */
  public static active(): FqdnStatus {
    return new FqdnStatus(FqdnStatusEnum.ACTIVE);
  }

  /**
   * 非アクティブなステータスを作成する
   * @returns FqdnStatus Value Object (INACTIVE)
   */
  public static inactive(): FqdnStatus {
    return new FqdnStatus(FqdnStatusEnum.INACTIVE);
  }

  /**
   * ステータス値を取得する
   * @returns ステータス値
   */
  public getValue(): FqdnStatusEnum {
    return this.value;
  }

  /**
   * アクティブかどうかを判定する
   * @returns アクティブの場合true
   */
  public isActive(): boolean {
    return this.value === FqdnStatusEnum.ACTIVE;
  }

  /**
   * 非アクティブかどうかを判定する
   * @returns 非アクティブの場合true
   */
  public isInactive(): boolean {
    return this.value === FqdnStatusEnum.INACTIVE;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: FqdnStatus): boolean {
    return this.value === other.value;
  }
}
