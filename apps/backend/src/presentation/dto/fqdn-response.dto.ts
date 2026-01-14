/**
 * FqdnResponseDto
 *
 * FQDN情報レスポンスのDTO
 */

import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';

export class FqdnResponseDto {
  id: string;
  fqdn: string;
  description: string | null;
  status: FqdnStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}
