/**
 * UpdateFqdnStatusDto
 *
 * FQDNステータス更新リクエストのDTO
 */

import { IsEnum } from 'class-validator';
import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';

export class UpdateFqdnStatusDto {
  @IsEnum(FqdnStatusEnum)
  status: FqdnStatusEnum;
}
