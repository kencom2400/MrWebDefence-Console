/**
 * ApiTokenResponseDto
 *
 * APIトークン情報のDTO
 * 生成時のみtokenフィールドが含まれる
 */

export class ApiTokenResponseDto {
  id: string;
  name: string;
  description: string | null;
  token?: string; // 生成時のみ含まれる
  tokenPreview: string;
  tokenPrefix: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  createdBy: string;
}
