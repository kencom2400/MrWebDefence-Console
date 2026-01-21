/**
 * ListApiTokensResponseDto
 *
 * APIトークン一覧取得レスポンスのDTO
 */

import { ApiTokenListItemDto } from './api-token-list-item.dto';

export class ListApiTokensResponseDto {
  tokens: ApiTokenListItemDto[];
  total: number;
}
