/**
 * FqdnConfig DTO
 *
 * FQDN設定情報のDTO
 * WAFエンジン向け設定配信APIのレスポンスで使用
 */

export class FqdnConfig {
  id: string; // UUID
  fqdn: string; // FQDN文字列
  status: 'ACTIVE' | 'INACTIVE';
}
