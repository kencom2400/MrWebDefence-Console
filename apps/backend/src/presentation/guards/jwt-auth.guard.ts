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

    // this.logger.debug(`Handler: ${context.getHandler().name}, Public: ${isPublic}, Token: ${!!token}`);

    // 公開エンドポイントでトークンがない場合はスルー（RolesGuardに任せる）
    if (isPublic && !token) {
      return true;
    }

    if (!token) {
      // 公開エンドポイントでないのにトークンがない場合はエラー
      throw new UnauthorizedException();
    }

    // ブラックリストチェック
    const isBlacklisted = await this.tokenBlacklistRepository.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token is invalidated');
    }

    // トークン検証
    const payload: JwtPayload | null = this.jwtService.verifyToken(token);
    if (!payload) {
      // トークンが無効な場合
      // 公開エンドポイントであればスルー（RolesGuardに任せる）ことも考えられるが、
      // 無効なトークンが送られてきた場合は明示的にエラーにする方が安全かつデバッグしやすい
      throw new UnauthorizedException();
    }

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
