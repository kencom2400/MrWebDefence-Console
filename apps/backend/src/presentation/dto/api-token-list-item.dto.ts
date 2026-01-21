/**
 * ApiTokenListItemDto
 *
 * APIトークン一覧項目のDTO
 */

export class ApiTokenListItemDto {
  id: string;
  name: string;
  description: string | null;
  tokenPreview: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  createdBy: string;
}
