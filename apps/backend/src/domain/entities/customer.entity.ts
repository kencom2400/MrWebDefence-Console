/**
 * Customer Entity
 *
 * 顧客エンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { CustomerStatus, CustomerStatusEnum } from '../value-objects/customer-status.value-object';

export class Customer {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly phone: string | null;
  public readonly company: string | null;
  public readonly address: string | null;
  public readonly status: CustomerStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    phone: string | null,
    company: string | null,
    address: string | null,
    status: CustomerStatus,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.company = company;
    this.address = address;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * 顧客エンティティを作成する
   * @param id 顧客ID（UUID）
   * @param name 顧客名
   * @param email メールアドレス
   * @param phone 電話番号（オプション）
   * @param company 会社名（オプション）
   * @param address 住所（オプション）
   * @returns Customer Entity
   */
  public static create(
    id: string,
    name: string,
    email: string,
    phone?: string | null,
    company?: string | null,
    address?: string | null,
  ): Customer {
    // バリデーション
    Customer.validateName(name);
    Customer.validateEmail(email);
    Customer.validatePhone(phone);
    Customer.validateCompany(company);
    Customer.validateAddress(address);

    const now: Date = new Date();
    return new Customer(
      id,
      name.trim(),
      email.trim(),
      phone?.trim() || null,
      company?.trim() || null,
      address?.trim() || null,
      CustomerStatus.active(),
      now,
      now,
    );
  }

  /**
   * 既存の顧客エンティティを再構築する
   * @param id 顧客ID
   * @param name 顧客名
   * @param email メールアドレス
   * @param phone 電話番号（オプション）
   * @param company 会社名（オプション）
   * @param address 住所（オプション）
   * @param status ステータス
   * @param createdAt 作成日時
   * @param updatedAt 更新日時
   * @returns Customer Entity
   */
  public static reconstruct(
    id: string,
    name: string,
    email: string,
    phone: string | null,
    company: string | null,
    address: string | null,
    status: CustomerStatus,
    createdAt: Date,
    updatedAt: Date,
  ): Customer {
    return new Customer(id, name, email, phone, company, address, status, createdAt, updatedAt);
  }

  /**
   * 顧客情報を更新する
   * @param name 顧客名（オプション）
   * @param email メールアドレス（オプション）
   * @param phone 電話番号（オプション）
   * @param company 会社名（オプション）
   * @param address 住所（オプション）
   * @returns 新しいCustomerエンティティ（更新済み）
   */
  public update(
    name?: string,
    email?: string,
    phone?: string | null,
    company?: string | null,
    address?: string | null,
  ): Customer {
    const newName = name !== undefined ? name.trim() : this.name;
    const newEmail = email !== undefined ? email.trim() : this.email;
    const newPhone = phone !== undefined ? (phone?.trim() || null) : this.phone;
    const newCompany = company !== undefined ? (company?.trim() || null) : this.company;
    const newAddress = address !== undefined ? (address?.trim() || null) : this.address;

    // バリデーション
    Customer.validateName(newName);
    Customer.validateEmail(newEmail);
    Customer.validatePhone(newPhone);
    Customer.validateCompany(newCompany);
    Customer.validateAddress(newAddress);

    return new Customer(
      this.id,
      newName,
      newEmail,
      newPhone,
      newCompany,
      newAddress,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 顧客を有効化する
   * @returns 新しいCustomerエンティティ（有効化済み）
   */
  public activate(): Customer {
    if (this.status.isActive()) {
      return this;
    }
    return new Customer(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.company,
      this.address,
      CustomerStatus.active(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 顧客を無効化する
   * @returns 新しいCustomerエンティティ（無効化済み）
   */
  public deactivate(): Customer {
    if (this.status.isInactive()) {
      return this;
    }
    return new Customer(
      this.id,
      this.name,
      this.email,
      this.phone,
      this.company,
      this.address,
      CustomerStatus.inactive(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 顧客名をバリデーションする
   * @param name 顧客名
   * @throws Error バリデーション失敗時
   */
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Customer name cannot be empty');
    }
    if (name.length > 100) {
      throw new Error('Customer name must be 100 characters or less');
    }
  }

  /**
   * メールアドレスをバリデーションする
   * @param email メールアドレス
   * @throws Error バリデーション失敗時
   */
  private static validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Customer email cannot be empty');
    }
    // 簡易的なメールアドレス形式チェック
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * 電話番号をバリデーションする
   * @param phone 電話番号（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validatePhone(phone: string | null | undefined): void {
    if (phone && phone.length > 20) {
      throw new Error('Phone number must be 20 characters or less');
    }
  }

  /**
   * 会社名をバリデーションする
   * @param company 会社名（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validateCompany(company: string | null | undefined): void {
    if (company && company.length > 100) {
      throw new Error('Company name must be 100 characters or less');
    }
  }

  /**
   * 住所をバリデーションする
   * @param address 住所（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validateAddress(address: string | null | undefined): void {
    if (address && address.length > 200) {
      throw new Error('Address must be 200 characters or less');
    }
  }
}

