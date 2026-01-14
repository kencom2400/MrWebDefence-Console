/**
 * ToggleCustomerStatusDto
 *
 * 顧客ステータス変更リクエストのDTO
 */

import { IsEnum } from 'class-validator';
import { CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

export class ToggleCustomerStatusDto {
  @IsEnum(CustomerStatusEnum)
  status: CustomerStatusEnum;
}
