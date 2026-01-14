/**
 * CustomerResponseDto
 *
 * 顧客情報レスポンスのDTO
 */

import { CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

export class CustomerResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  status: CustomerStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

