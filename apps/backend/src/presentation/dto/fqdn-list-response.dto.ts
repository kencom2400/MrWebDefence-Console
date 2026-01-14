/**
 * FqdnListResponseDto
 *
 * FQDN一覧レスポンスのDTO
 */

import { FqdnResponseDto } from './fqdn-response.dto';

export class FqdnListResponseDto {
  fqdns: FqdnResponseDto[];
  total: number;
  page: number;
  limit: number;
}
