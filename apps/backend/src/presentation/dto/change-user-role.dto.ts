/**
 * ChangeUserRoleDto
 *
 * ユーザーロール変更リクエストのDTO
 */

import { IsEnum } from 'class-validator';
import { UserRole } from '../../domain/entities/user-role.enum';

export class ChangeUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
