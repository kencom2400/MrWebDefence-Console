/**
 * EngineConfigResponseDto
 *
 * WAFエンジン向け設定配信APIのレスポンスDTO
 */

import { FqdnConfig } from './fqdn-config.dto';
import { IpAllowListConfig } from './ip-allowlist-config.dto';
import { CustomerConfig } from './customer-config.dto';

export class EngineConfigResponseDto {
  fqdns: FqdnConfig[];
  ipAllowLists: IpAllowListConfig[];
  customers: CustomerConfig[];
  lastUpdated: string; // ISO 8601形式の文字列
}
