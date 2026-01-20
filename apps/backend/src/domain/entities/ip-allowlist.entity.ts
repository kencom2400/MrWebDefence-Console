/**
 * IpAllowList Entity
 *
 * IP AllowListエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import * as isIp from 'is-ip';

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
   * @note is-ipライブラリを使用して、IPv4/IPv6およびCIDR記法を堅牢に検証します。
   */
  private static validateIpAddress(ipAddress: string): void {
    if (!ipAddress || ipAddress.trim().length === 0) {
      throw new Error('IP address cannot be empty');
    }

    // CIDR記法を考慮し、IPアドレス部分とプレフィックスを分離
    const parts = ipAddress.split('/');
    const ip = parts[0];

    // is-ipライブラリでIPアドレスの妥当性を検証
    if (!isIp.isIP(ip)) {
      throw new Error(`Invalid IP address format: ${ipAddress}`);
    }

    // CIDRプレフィックスのバリデーション
    if (parts.length > 1) {
      if (parts.length > 2) {
        throw new Error(`Invalid CIDR format: ${ipAddress}`);
      }
      const prefix = parseInt(parts[1], 10);
      const maxPrefix = isIp.isIPv6(ip) ? 128 : 32;
      if (isNaN(prefix) || prefix < 0 || prefix > maxPrefix) {
        throw new Error(`Invalid CIDR prefix in ${ipAddress}`);
      }
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
