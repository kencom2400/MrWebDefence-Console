/**
 * User Entity
 *
 * ユーザーエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly hashedPassword: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(id: string, email: string, hashedPassword: string, createdAt: Date, updatedAt: Date) {
    this.id = id;
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * ユーザーエンティティを作成する
   */
  public static create(id: string, email: string, hashedPassword: string): User {
    const now: Date = new Date();
    return new User(id, email, hashedPassword, now, now);
  }

  /**
   * 既存のユーザーエンティティを再構築する
   */
  public static reconstruct(
    id: string,
    email: string,
    hashedPassword: string,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, email, hashedPassword, createdAt, updatedAt);
  }
}

