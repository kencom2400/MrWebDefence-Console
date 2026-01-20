/**
 * ApiToken Entity
 *
 * APIトークンエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class ApiToken {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly tokenHash: string;
  public readonly tokenPrefix: string;
  public readonly expiresAt: Date | null;
  public readonly revokedAt: Date | null;
  public readonly createdAt: Date;
  public readonly createdBy: string;

  private constructor(
    id: string,
    name: string,
    description: string | null,
    tokenHash: string,
    tokenPrefix: string,
    expiresAt: Date | null,
    revokedAt: Date | null,
    createdAt: Date,
    createdBy: string,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.tokenHash = tokenHash;
    this.tokenPrefix = tokenPrefix;
    this.expiresAt = expiresAt;
    this.revokedAt = revokedAt;
    this.createdAt = createdAt;
    this.createdBy = createdBy;
  }

  /**
   * APIトークンエンティティを作成する
   * @param id APIトークンID（UUID）
   * @param name トークン名
   * @param description 説明（オプション）
   * @param tokenHash トークンのハッシュ値（シークレット部分のみをハッシュ化）
   * @param tokenPrefix トークンのプレフィックス（例: "waf_"）
   * @param expiresAt 有効期限（オプション、nullの場合は無期限）
   * @param createdBy 作成者ID（UUID）
   * @returns ApiToken Entity
   */
  public static create(
    id: string,
    name: string,
    description: string | null,
    tokenHash: string,
    tokenPrefix: string,
    expiresAt: Date | null,
    createdBy: string,
  ): ApiToken {
    const trimmedName = name.trim();
    const trimmedDescription = description?.trim() || null;

    ApiToken.validateId(id);
    ApiToken.validateName(trimmedName);
    ApiToken.validateDescription(trimmedDescription);
    ApiToken.validateTokenHash(tokenHash);
    ApiToken.validateTokenPrefix(tokenPrefix);
    ApiToken.validateExpiresAt(expiresAt);
    ApiToken.validateCreatedBy(createdBy);

    const now: Date = new Date();
    return new ApiToken(
      id,
      trimmedName,
      trimmedDescription,
      tokenHash,
      tokenPrefix,
      expiresAt,
      null, // revokedAtは初期値としてnull
      now,
      createdBy,
    );
  }

  /**
   * 既存のAPIトークンエンティティを再構築する
   * @param id APIトークンID
   * @param name トークン名
   * @param description 説明（オプション）
   * @param tokenHash トークンのハッシュ値
   * @param tokenPrefix トークンのプレフィックス
   * @param expiresAt 有効期限（オプション）
   * @param revokedAt 無効化日時（オプション）
   * @param createdAt 作成日時
   * @param createdBy 作成者ID
   * @returns ApiToken Entity
   */
  public static reconstruct(
    id: string,
    name: string,
    description: string | null,
    tokenHash: string,
    tokenPrefix: string,
    expiresAt: Date | null,
    revokedAt: Date | null,
    createdAt: Date,
    createdBy: string,
  ): ApiToken {
    return new ApiToken(
      id,
      name,
      description,
      tokenHash,
      tokenPrefix,
      expiresAt,
      revokedAt,
      createdAt,
      createdBy,
    );
  }

  /**
   * トークンを無効化する
   * @returns 新しいApiTokenエンティティ（無効化済み）
   */
  public revoke(): ApiToken {
    if (this.revokedAt !== null) {
      throw new Error('API token is already revoked');
    }
    return new ApiToken(
      this.id,
      this.name,
      this.description,
      this.tokenHash,
      this.tokenPrefix,
      this.expiresAt,
      new Date(), // revokedAtを現在日時に設定
      this.createdAt,
      this.createdBy,
    );
  }

  /**
   * トークンが有効かどうかを判定する
   * @returns 有効期限が切れておらず、無効化されていない場合true
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  /**
   * トークンが有効期限切れかどうかを判定する
   * @returns 有効期限が設定されており、現在日時が有効期限を過ぎている場合true
   */
  public isExpired(): boolean {
    if (this.expiresAt === null) {
      return false; // 無期限の場合は期限切れではない
    }
    return new Date() > this.expiresAt;
  }

  /**
   * トークンが無効化されているかどうかを判定する
   * @returns 無効化日時が設定されている場合true
   */
  public isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  /**
   * IDをバリデーションする
   * @param id ID
   * @throws Error バリデーション失敗時
   */
  private static validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('API token ID cannot be empty');
    }
  }

  /**
   * トークン名をバリデーションする
   * @param name トークン名
   * @throws Error バリデーション失敗時
   */
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('API token name cannot be empty');
    }
    if (name.length > 255) {
      throw new Error('API token name must be 255 characters or less');
    }
  }

  /**
   * 説明をバリデーションする
   * @param description 説明（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validateDescription(description: string | null): void {
    if (description && description.length > 1000) {
      throw new Error('Description must be 1000 characters or less');
    }
  }

  /**
   * トークンハッシュをバリデーションする
   * @param tokenHash トークンハッシュ
   * @throws Error バリデーション失敗時
   */
  private static validateTokenHash(tokenHash: string): void {
    if (!tokenHash || tokenHash.trim().length === 0) {
      throw new Error('Token hash cannot be empty');
    }
    // bcryptハッシュは60文字
    if (tokenHash.length < 60) {
      throw new Error('Token hash appears to be invalid (bcrypt hash should be at least 60 characters)');
    }
  }

  /**
   * トークンプレフィックスをバリデーションする
   * @param tokenPrefix トークンプレフィックス
   * @throws Error バリデーション失敗時
   */
  private static validateTokenPrefix(tokenPrefix: string): void {
    if (!tokenPrefix || tokenPrefix.trim().length === 0) {
      throw new Error('Token prefix cannot be empty');
    }
    if (tokenPrefix.length > 10) {
      throw new Error('Token prefix must be 10 characters or less');
    }
    // プレフィックスは英数字とアンダースコアのみ許可
    if (!/^[a-zA-Z0-9_]+$/.test(tokenPrefix)) {
      throw new Error('Token prefix must contain only alphanumeric characters and underscores');
    }
  }

  /**
   * 有効期限をバリデーションする
   * @param expiresAt 有効期限（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validateExpiresAt(expiresAt: Date | null): void {
    if (expiresAt !== null && expiresAt <= new Date()) {
      throw new Error('Expires at must be in the future');
    }
  }

  /**
   * 作成者IDをバリデーションする
   * @param createdBy 作成者ID
   * @throws Error バリデーション失敗時
   */
  private static validateCreatedBy(createdBy: string): void {
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('Created by cannot be empty');
    }
  }
}
