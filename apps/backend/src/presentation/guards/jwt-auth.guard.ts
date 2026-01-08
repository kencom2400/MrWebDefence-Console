import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService, JwtPayload } from '../../infrastructure/services/jwt.service';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Inject('JwtService')
    private readonly jwtService: JwtService,
    @Inject('ITokenBlacklistRepository')
    private readonly tokenBlacklistRepository: ITokenBlacklistRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    const handlerName = context.getHandler().name;

    // デバッグログは必要に応じて有効化
    // this.logger.debug(
    //   `[${handlerName}] Public: ${isPublic}, Token: ${!!token}, TokenPreview: ${token ? token.substring(0, 20) + '...' : 'none'}`,
    // );

    // 公開エンドポイントでトークンがない場合はスルー（RolesGuardに任せる）
    if (isPublic && !token) {
      // this.logger.debug(`[${handlerName}] Public endpoint without token, allowing`);
      return true;
    }

    if (!token) {
      // 公開エンドポイントでないのにトークンがない場合はエラー
      this.logger.warn(`[${handlerName}] No token provided for protected endpoint`);
      throw new UnauthorizedException();
    }

    // ブラックリストチェック
    try {
      const isBlacklisted = await this.tokenBlacklistRepository.isBlacklisted(token);
      // this.logger.debug(`[${handlerName}] Token blacklisted: ${isBlacklisted}`);
      if (isBlacklisted) {
        this.logger.warn(`[${handlerName}] Token is blacklisted`);
        throw new UnauthorizedException('Token is invalidated');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`[${handlerName}] Error checking blacklist:`, error);
      throw error;
    }

    // トークン検証
    const payload: JwtPayload | null = this.jwtService.verifyToken(token);
    if (!payload) {
      // トークンが無効な場合
      this.logger.warn(`[${handlerName}] Token verification failed`);
      throw new UnauthorizedException();
    }

    // this.logger.debug(`[${handlerName}] Token verified successfully, userId: ${payload.sub}`);

    // リクエストにユーザー情報を付与
    // 型アサーションを使用して型安全性を維持
    (request as Request & { user: JwtPayload }).user = payload;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
