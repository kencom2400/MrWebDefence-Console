/**
 * DashboardData Value Object
 *
 * ダッシュボードデータの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { UserRole } from '../entities/user-role.enum';

export class DashboardData {
  public readonly userId: string;
  public readonly email: string;
  public readonly role: UserRole;
  public readonly mfaEnabled: boolean;
  public readonly ipAllowListCount: number;
  public readonly accountCreatedAt: Date;
  public readonly lastLoginAt: Date | null;
  public readonly loginAttemptCount: number | null;

  private constructor(
    userId: string,
    email: string,
    role: UserRole,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: Date,
    lastLoginAt: Date | null,
    loginAttemptCount: number | null,
  ) {
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.ipAllowListCount = ipAllowListCount;
    this.accountCreatedAt = accountCreatedAt;
    this.lastLoginAt = lastLoginAt;
    this.loginAttemptCount = loginAttemptCount;
  }

  /**
   * ダッシュボードデータを作成する
   * @param userId ユーザーID
   * @param email メールアドレス
   * @param role ユーザーロール
   * @param mfaEnabled MFA有効化状態
   * @param ipAllowListCount IP AllowList数
   * @param accountCreatedAt アカウント作成日時
   * @param lastLoginAt 最終ログイン日時（オプション）
   * @param loginAttemptCount ログイン試行回数（オプション）
   * @returns DashboardData Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(
    userId: string,
    email: string,
    role: UserRole,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: Date,
    lastLoginAt?: Date | null,
    loginAttemptCount?: number | null,
  ): DashboardData {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    // メールアドレスの形式バリデーション
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Email must be a valid email address');
    }

    if (ipAllowListCount < 0) {
      throw new Error('IP AllowList count must be 0 or greater');
    }

    if (loginAttemptCount !== null && loginAttemptCount !== undefined && loginAttemptCount < 0) {
      throw new Error('Login attempt count must be 0 or greater');
    }

    return new DashboardData(
      userId,
      email,
      role,
      mfaEnabled,
      ipAllowListCount,
      accountCreatedAt,
      lastLoginAt ?? null,
      loginAttemptCount ?? null,
    );
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: DashboardData): boolean {
    return (
      this.userId === other.userId &&
      this.email === other.email &&
      this.role === other.role &&
      this.mfaEnabled === other.mfaEnabled &&
      this.ipAllowListCount === other.ipAllowListCount &&
      this.accountCreatedAt.getTime() === other.accountCreatedAt.getTime() &&
      (this.lastLoginAt?.getTime() ?? null) === (other.lastLoginAt?.getTime() ?? null) &&
      this.loginAttemptCount === other.loginAttemptCount
    );
  }
}
 * DashboardData Value Object
 *
 * ダッシュボードデータの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { UserRole } from '../entities/user-role.enum';

export class DashboardData {
  public readonly userId: string;
  public readonly email: string;
  public readonly role: UserRole;
  public readonly mfaEnabled: boolean;
  public readonly ipAllowListCount: number;
  public readonly accountCreatedAt: Date;
  public readonly lastLoginAt: Date | null;
  public readonly loginAttemptCount: number | null;

  private constructor(
    userId: string,
    email: string,
    role: UserRole,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: Date,
    lastLoginAt: Date | null,
    loginAttemptCount: number | null,
  ) {
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.ipAllowListCount = ipAllowListCount;
    this.accountCreatedAt = accountCreatedAt;
    this.lastLoginAt = lastLoginAt;
    this.loginAttemptCount = loginAttemptCount;
  }

  /**
   * ダッシュボードデータを作成する
   * @param userId ユーザーID
   * @param email メールアドレス
   * @param role ユーザーロール
   * @param mfaEnabled MFA有効化状態
   * @param ipAllowListCount IP AllowList数
   * @param accountCreatedAt アカウント作成日時
   * @param lastLoginAt 最終ログイン日時（オプション）
   * @param loginAttemptCount ログイン試行回数（オプション）
   * @returns DashboardData Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(
    userId: string,
    email: string,
    role: UserRole,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: Date,
    lastLoginAt?: Date | null,
    loginAttemptCount?: number | null,
  ): DashboardData {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    // メールアドレスの形式バリデーション
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Email must be a valid email address');
    }

    if (ipAllowListCount < 0) {
      throw new Error('IP AllowList count must be 0 or greater');
    }

    if (loginAttemptCount !== null && loginAttemptCount !== undefined && loginAttemptCount < 0) {
      throw new Error('Login attempt count must be 0 or greater');
    }

    return new DashboardData(
      userId,
      email,
      role,
      mfaEnabled,
      ipAllowListCount,
      accountCreatedAt,
      lastLoginAt ?? null,
      loginAttemptCount ?? null,
    );
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: DashboardData): boolean {
    return (
      this.userId === other.userId &&
      this.email === other.email &&
      this.role === other.role &&
      this.mfaEnabled === other.mfaEnabled &&
      this.ipAllowListCount === other.ipAllowListCount &&
      this.accountCreatedAt.getTime() === other.accountCreatedAt.getTime() &&
      (this.lastLoginAt?.getTime() ?? null) === (other.lastLoginAt?.getTime() ?? null) &&
      this.loginAttemptCount === other.loginAttemptCount
    );
  }
}
 * DashboardData Value Object
 *
 * ダッシュボードデータの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { UserRole } from '../entities/user-role.enum';

export class DashboardData {
  public readonly userId: string;
  public readonly email: string;
  public readonly role: UserRole;
  public readonly mfaEnabled: boolean;
  public readonly ipAllowListCount: number;
  public readonly accountCreatedAt: Date;
  public readonly lastLoginAt: Date | null;
  public readonly loginAttemptCount: number | null;

  private constructor(
    userId: string,
    email: string,
    role: UserRole,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: Date,
    lastLoginAt: Date | null,
    loginAttemptCount: number | null,
  ) {
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.ipAllowListCount = ipAllowListCount;
    this.accountCreatedAt = accountCreatedAt;
    this.lastLoginAt = lastLoginAt;
    this.loginAttemptCount = loginAttemptCount;
  }

  /**
   * ダッシュボードデータを作成する
   * @param userId ユーザーID
   * @param email メールアドレス
   * @param role ユーザーロール
   * @param mfaEnabled MFA有効化状態
   * @param ipAllowListCount IP AllowList数
   * @param accountCreatedAt アカウント作成日時
   * @param lastLoginAt 最終ログイン日時（オプション）
   * @param loginAttemptCount ログイン試行回数（オプション）
   * @returns DashboardData Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(
    userId: string,
    email: string,
    role: UserRole,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: Date,
    lastLoginAt?: Date | null,
    loginAttemptCount?: number | null,
  ): DashboardData {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    // メールアドレスの形式バリデーション
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Email must be a valid email address');
    }

    if (ipAllowListCount < 0) {
      throw new Error('IP AllowList count must be 0 or greater');
    }

    if (loginAttemptCount !== null && loginAttemptCount !== undefined && loginAttemptCount < 0) {
      throw new Error('Login attempt count must be 0 or greater');
    }

    return new DashboardData(
      userId,
      email,
      role,
      mfaEnabled,
      ipAllowListCount,
      accountCreatedAt,
      lastLoginAt ?? null,
      loginAttemptCount ?? null,
    );
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: DashboardData): boolean {
    return (
      this.userId === other.userId &&
      this.email === other.email &&
      this.role === other.role &&
      this.mfaEnabled === other.mfaEnabled &&
      this.ipAllowListCount === other.ipAllowListCount &&
      this.accountCreatedAt.getTime() === other.accountCreatedAt.getTime() &&
      (this.lastLoginAt?.getTime() ?? null) === (other.lastLoginAt?.getTime() ?? null) &&
      this.loginAttemptCount === other.loginAttemptCount
    );
  }
}
