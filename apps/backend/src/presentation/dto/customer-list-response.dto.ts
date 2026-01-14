/**
 * CustomerListResponseDto
 *
 * 顧客一覧レスポンスのDTO
 */

import { CustomerResponseDto } from './customer-response.dto';

export class CustomerListResponseDto {
  customers: CustomerResponseDto[];
  total: number;
  page: number;
  limit: number;
}

