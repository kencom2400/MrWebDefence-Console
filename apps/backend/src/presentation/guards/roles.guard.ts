import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../infrastructure/services/jwt.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Publicデコレータがついている場合は認可をスキップして許可
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Rolesデコレータから必要なロールを取得
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail Safe: Publicでもなく、Roleも指定されていない場合はアクセス拒否
    if (!requiredRoles) {
      throw new ForbiddenException('Access denied (No roles defined)');
    }

    // リクエストからユーザー情報を取得 (JwtAuthGuardによってセットされている前提)
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    // ユーザー情報がない、またはロールがない場合は拒否
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied (User role not found)');
    }

    // ユーザーのロールが必要なロールに含まれているかチェック
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Access denied (Insufficient permissions)');
    }

    return true;
  }
}
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../infrastructure/services/jwt.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Publicデコレータがついている場合は認可をスキップして許可
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Rolesデコレータから必要なロールを取得
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail Safe: Publicでもなく、Roleも指定されていない場合はアクセス拒否
    if (!requiredRoles) {
      throw new ForbiddenException('Access denied (No roles defined)');
    }

    // リクエストからユーザー情報を取得 (JwtAuthGuardによってセットされている前提)
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    // ユーザー情報がない、またはロールがない場合は拒否
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied (User role not found)');
    }

    // ユーザーのロールが必要なロールに含まれているかチェック
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Access denied (Insufficient permissions)');
    }

    return true;
  }
}
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../infrastructure/services/jwt.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Publicデコレータがついている場合は認可をスキップして許可
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Rolesデコレータから必要なロールを取得
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail Safe: Publicでもなく、Roleも指定されていない場合はアクセス拒否
    if (!requiredRoles) {
      throw new ForbiddenException('Access denied (No roles defined)');
    }

    // リクエストからユーザー情報を取得 (JwtAuthGuardによってセットされている前提)
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    // ユーザー情報がない、またはロールがない場合は拒否
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied (User role not found)');
    }

    // ユーザーのロールが必要なロールに含まれているかチェック
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Access denied (Insufficient permissions)');
    }

    return true;
  }
}
