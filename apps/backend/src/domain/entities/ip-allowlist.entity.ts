/**
 * IpAllowList Entity
 *
 * IP AllowListエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class IpAllowList {
  public readonly id: string;
  public readonly userId: string;
  public readonly ipAddress: string;
  public readonly description: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    userId: string,
    ipAddress: string,
    description: string | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.ipAddress = ipAddress;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * IP AllowListエンティティを作成する
   * @param id IP AllowList ID（UUID）
   * @param userId ユーザーID（UUID）
   * @param ipAddress IPアドレス（IPv4/IPv6、CIDR記法も可）
   * @param description 説明（オプション）
   * @returns IpAllowList Entity
   */
  public static create(
    id: string,
    userId: string,
    ipAddress: string,
    description?: string | null,
  ): IpAllowList {
    const trimmedIpAddress = ipAddress.trim();
    const trimmedDescription = description?.trim() || null;

    // バリデーション
    IpAllowList.validateId(id);
    IpAllowList.validateUserId(userId);
    IpAllowList.validateIpAddress(trimmedIpAddress);
    IpAllowList.validateDescription(trimmedDescription);

    const now: Date = new Date();
    return new IpAllowList(id, userId, trimmedIpAddress, trimmedDescription, now, now);
  }

  /**
   * 既存のIP AllowListエンティティを再構築する
   * @param id IP AllowList ID
   * @param userId ユーザーID
   * @param ipAddress IPアドレス
   * @param description 説明（オプション）
   * @param createdAt 作成日時
   * @param updatedAt 更新日時
   * @returns IpAllowList Entity
   */
  public static reconstruct(
    id: string,
    userId: string,
    ipAddress: string,
    description: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): IpAllowList {
    return new IpAllowList(id, userId, ipAddress, description, createdAt, updatedAt);
  }

  /**
   * IDをバリデーションする
   * @param id ID
   * @throws Error バリデーション失敗時
   */
  private static validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('IP AllowList ID cannot be empty');
    }
  }

  /**
   * ユーザーIDをバリデーションする
   * @param userId ユーザーID
   * @throws Error バリデーション失敗時
   */
  private static validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
  }

  /**
   * IPアドレスをバリデーションする
   * @param ipAddress IPアドレス
   * @throws Error バリデーション失敗時
   */
  private static validateIpAddress(ipAddress: string): void {
    if (!ipAddress || ipAddress.trim().length === 0) {
      throw new Error('IP address cannot be empty');
    }

    // 基本的な形式チェック（IPv4、IPv6、CIDR記法）
    // 詳細なバリデーションはInfrastructure層のIpAddressServiceで実施
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;
    const ipv6CompressedPattern = /^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}(\/\d{1,3})?$/;

    if (!ipv4Pattern.test(ipAddress) && !ipv6Pattern.test(ipAddress) && !ipv6CompressedPattern.test(ipAddress)) {
      throw new Error(`Invalid IP address format: ${ipAddress}`);
    }
  }

  /**
   * 説明をバリデーションする
   * @param description 説明（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validateDescription(description: string | null): void {
    if (description && description.length > 255) {
      throw new Error('Description must be 255 characters or less');
    }
  }
}
