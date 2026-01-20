/**
 * IpAllowListConfig DTO
 *
 * IP AllowList設定情報のDTO
 * WAFエンジン向け設定配信APIのレスポンスで使用
 */

export class IpAllowListConfig {
  id: string; // UUID
  userId: string; // ユーザーID (UUID)
  ipAddress: string; // IPアドレス（IPv4/IPv6、CIDR記法も可）
}
