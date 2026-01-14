/**
 * UserResponseDto
 *
 * ユーザー情報レスポンスのDTO
 */

import { UserRole } from '../../domain/entities/user-role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

