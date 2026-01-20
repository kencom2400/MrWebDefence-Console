/**
 * ApiTokenAuthGuard
 *
 * APIトークン認証ガード
 * WAFエンジン向け設定配信API（MWD-100）で使用
 * Bearerトークンとして送信されたAPIトークンを検証する
 */

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';
import { ApiTokenService } from '../../infrastructure/services/api-token.service';

@Injectable()
export class ApiTokenAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiTokenAuthGuard.name);

  constructor(
    @Inject('IApiTokenRepository')
    private readonly apiTokenRepository: IApiTokenRepository,
    @Inject('ApiTokenService')
    private readonly apiTokenService: ApiTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handlerName = context.getHandler().name;

    // ヘッダーからフルトークンを抽出
    const fullToken = this.extractTokenFromHeader(request);
    if (!fullToken) {
      this.logger.warn(`[${handlerName}] No API token provided`);
      throw new UnauthorizedException('API token is required');
    }

    try {
      // フルトークンからプレフィックスを抽出
      const tokenPrefix = this.apiTokenService.extractPrefix(fullToken);

      // フルトークンからシークレット部分を抽出
      const secret = this.apiTokenService.extractSecret(fullToken, tokenPrefix);

      // プレフィックスで検索対象を絞り込み（将来の拡張性のため）
      // 現時点では、token_hashのUNIQUE制約により直接検索が可能だが、
      // 将来複数のトークンタイプをサポートする可能性を考慮してプレフィックスを分離している

      // すべてのトークンを取得して検証（将来的にはプレフィックスで絞り込みを最適化）
      const allTokens = await this.apiTokenRepository.findAll();
      const matchingTokens = allTokens.filter((token) => token.tokenPrefix === tokenPrefix);

      // シークレットを検証
      let apiToken = null;
      for (const token of matchingTokens) {
        const isValid = await this.apiTokenService.verifyToken(secret, token.tokenHash);
        if (isValid) {
          apiToken = token;
          break;
        }
      }

      if (!apiToken) {
        this.logger.warn(`[${handlerName}] API token not found or invalid`);
        throw new UnauthorizedException('Invalid API token');
      }

      // トークンの有効性を確認
      if (!apiToken.isValid()) {
        if (apiToken.isExpired()) {
          this.logger.warn(`[${handlerName}] API token is expired`);
          throw new UnauthorizedException('API token is expired');
        }
        if (apiToken.isRevoked()) {
          this.logger.warn(`[${handlerName}] API token is revoked`);
          throw new UnauthorizedException('API token is revoked');
        }
        this.logger.warn(`[${handlerName}] API token is invalid`);
        throw new UnauthorizedException('API token is invalid');
      }

      // 認証成功
      // リクエストにAPIトークン情報を付与（必要に応じて）
      (request as Request & { apiToken: { id: string; name: string } }).apiToken = {
        id: apiToken.id,
        name: apiToken.name,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`[${handlerName}] Error validating API token:`, error);
      throw new UnauthorizedException('API token validation failed');
    }
  }

  /**
   * リクエストヘッダーからAPIトークンを抽出する
   * @param request HTTPリクエスト
   * @returns APIトークン（フルトークン）、またはundefined
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
