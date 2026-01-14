/**
 * CustomerStatus Value Object
 *
 * 顧客ステータスの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export enum CustomerStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CustomerStatus {
  private readonly value: CustomerStatusEnum;

  private constructor(value: CustomerStatusEnum) {
    this.value = value;
  }

  /**
   * 顧客ステータスを作成する
   * @param value ステータス値（'ACTIVE' または 'INACTIVE'）
   * @returns CustomerStatus Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(value: string): CustomerStatus {
    if (!value || value.trim().length === 0) {
      throw new Error('Customer status cannot be empty');
    }

    const normalizedValue = value.toUpperCase();
    if (normalizedValue !== CustomerStatusEnum.ACTIVE && normalizedValue !== CustomerStatusEnum.INACTIVE) {
      throw new Error(`Invalid customer status: ${value}. Must be 'ACTIVE' or 'INACTIVE'`);
    }

    return new CustomerStatus(normalizedValue as CustomerStatusEnum);
  }

  /**
   * 既存の顧客ステータスを再構築する
   * @param value ステータス値
   * @returns CustomerStatus Value Object
   */
  public static reconstruct(value: CustomerStatusEnum): CustomerStatus {
    return new CustomerStatus(value);
  }

  /**
   * アクティブなステータスを作成する
   * @returns CustomerStatus Value Object (ACTIVE)
   */
  public static active(): CustomerStatus {
    return new CustomerStatus(CustomerStatusEnum.ACTIVE);
  }

  /**
   * 非アクティブなステータスを作成する
   * @returns CustomerStatus Value Object (INACTIVE)
   */
  public static inactive(): CustomerStatus {
    return new CustomerStatus(CustomerStatusEnum.INACTIVE);
  }

  /**
   * ステータス値を取得する
   * @returns ステータス値
   */
  public getValue(): CustomerStatusEnum {
    return this.value;
  }

  /**
   * アクティブかどうかを判定する
   * @returns アクティブの場合true
   */
  public isActive(): boolean {
    return this.value === CustomerStatusEnum.ACTIVE;
  }

  /**
   * 非アクティブかどうかを判定する
   * @returns 非アクティブの場合true
   */
  public isInactive(): boolean {
    return this.value === CustomerStatusEnum.INACTIVE;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: CustomerStatus): boolean {
    return this.value === other.value;
  }
}

