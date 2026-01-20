/**
 * CustomerConfig DTO
 *
 * 顧客設定情報のDTO
 * WAFエンジン向け設定配信APIのレスポンスで使用
 */

export class CustomerConfig {
  id: string; // UUID
  name: string; // 顧客名
  status: 'ACTIVE' | 'INACTIVE';
}
