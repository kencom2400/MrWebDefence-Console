/**
 * UserListResponseDto
 *
 * ユーザー一覧レスポンスのDTO
 */

import { UserResponseDto } from './user-response.dto';

export class UserListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}

