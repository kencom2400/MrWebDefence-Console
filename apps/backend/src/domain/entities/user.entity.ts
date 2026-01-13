/**
 * User Entity
 *
 * ユーザーエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { UserRole } from './user-role.enum';

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly hashedPassword: string;
  public readonly role: UserRole;
  public readonly mfaEnabled: boolean;
  public readonly mfaSecret: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.mfaSecret = mfaSecret;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * ユーザーエンティティを作成する
   */
  public static create(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole = UserRole.SERVICE_MEMBER,
  ): User {
    const now: Date = new Date();
    return new User(id, email, hashedPassword, role, false, null, now, now);
  }

  /**
   * 既存のユーザーエンティティを再構築する
   */
  public static reconstruct(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt);
  }

  /**
   * MFAを有効化する
   * @param secret MFAシークレット
   * @returns 新しいUserエンティティ（MFA有効化済み）
   */
  public enableMfa(secret: string): User {
    if (!secret || secret.trim().length === 0) {
      throw new Error('MFA secret cannot be empty');
    }
    return new User(
      this.id,
      this.email,
      this.hashedPassword,
      this.role,
      true,
      secret,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * MFAを無効化する
   * @returns 新しいUserエンティティ（MFA無効化済み）
   */
  public disableMfa(): User {
    return new User(
      this.id,
      this.email,
      this.hashedPassword,
      this.role,
      false,
      null,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * パスワードを更新する
   * @param newHashedPassword 新しいハッシュ化されたパスワード
   * @returns 新しいUserエンティティ（パスワード更新済み）
   */
  public updatePassword(newHashedPassword: string): User {
    if (!newHashedPassword || newHashedPassword.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    return new User(
      this.id,
      this.email,
      newHashedPassword,
      this.role,
      this.mfaEnabled,
      this.mfaSecret,
      this.createdAt,
      new Date(),
    );
  }
}

 *
 * ユーザーエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { UserRole } from './user-role.enum';

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly hashedPassword: string;
  public readonly role: UserRole;
  public readonly mfaEnabled: boolean;
  public readonly mfaSecret: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.mfaSecret = mfaSecret;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * ユーザーエンティティを作成する
   */
  public static create(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole = UserRole.SERVICE_MEMBER,
  ): User {
    const now: Date = new Date();
    return new User(id, email, hashedPassword, role, false, null, now, now);
  }

  /**
   * 既存のユーザーエンティティを再構築する
   */
  public static reconstruct(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt);
  }

  /**
   * MFAを有効化する
   * @param secret MFAシークレット
   * @returns 新しいUserエンティティ（MFA有効化済み）
   */
  public enableMfa(secret: string): User {
    if (!secret || secret.trim().length === 0) {
      throw new Error('MFA secret cannot be empty');
    }
    return new User(
      this.id,
      this.email,
      this.hashedPassword,
      this.role,
      true,
      secret,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * MFAを無効化する
   * @returns 新しいUserエンティティ（MFA無効化済み）
   */
  public disableMfa(): User {
    return new User(
      this.id,
      this.email,
      this.hashedPassword,
      this.role,
      false,
      null,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * パスワードを更新する
   * @param newHashedPassword 新しいハッシュ化されたパスワード
   * @returns 新しいUserエンティティ（パスワード更新済み）
   */
  public updatePassword(newHashedPassword: string): User {
    if (!newHashedPassword || newHashedPassword.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    return new User(
      this.id,
      this.email,
      newHashedPassword,
      this.role,
      this.mfaEnabled,
      this.mfaSecret,
      this.createdAt,
      new Date(),
    );
  }
}

 *
 * ユーザーエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { UserRole } from './user-role.enum';

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly hashedPassword: string;
  public readonly role: UserRole;
  public readonly mfaEnabled: boolean;
  public readonly mfaSecret: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.mfaSecret = mfaSecret;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * ユーザーエンティティを作成する
   */
  public static create(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole = UserRole.SERVICE_MEMBER,
  ): User {
    const now: Date = new Date();
    return new User(id, email, hashedPassword, role, false, null, now, now);
  }

  /**
   * 既存のユーザーエンティティを再構築する
   */
  public static reconstruct(
    id: string,
    email: string,
    hashedPassword: string,
    role: UserRole,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, email, hashedPassword, role, mfaEnabled, mfaSecret, createdAt, updatedAt);
  }

  /**
   * MFAを有効化する
   * @param secret MFAシークレット
   * @returns 新しいUserエンティティ（MFA有効化済み）
   */
  public enableMfa(secret: string): User {
    if (!secret || secret.trim().length === 0) {
      throw new Error('MFA secret cannot be empty');
    }
    return new User(
      this.id,
      this.email,
      this.hashedPassword,
      this.role,
      true,
      secret,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * MFAを無効化する
   * @returns 新しいUserエンティティ（MFA無効化済み）
   */
  public disableMfa(): User {
    return new User(
      this.id,
      this.email,
      this.hashedPassword,
      this.role,
      false,
      null,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * パスワードを更新する
   * @param newHashedPassword 新しいハッシュ化されたパスワード
   * @returns 新しいUserエンティティ（パスワード更新済み）
   */
  public updatePassword(newHashedPassword: string): User {
    if (!newHashedPassword || newHashedPassword.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    return new User(
      this.id,
      this.email,
      newHashedPassword,
      this.role,
      this.mfaEnabled,
      this.mfaSecret,
      this.createdAt,
      new Date(),
    );
  }
}
