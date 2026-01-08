import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService, JwtPayload } from '../../infrastructure/services/jwt.service';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('JwtService')
    private readonly jwtService: JwtService,
    @Inject('ITokenBlacklistRepository')
    private readonly tokenBlacklistRepository: ITokenBlacklistRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
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
      throw new UnauthorizedException();
    }

    // リクエストにユーザー情報を付与
    // @ts-expect-error request.user is not typed in Express.Request by default
    request['user'] = payload;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
