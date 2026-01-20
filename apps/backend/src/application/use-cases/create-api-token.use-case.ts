/**
 * CreateApiTokenUseCase
 *
 * APIトークン作成処理のユースケース
 */

import { Injectable, Inject } from '@nestjs/common';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';
import { ApiToken } from '../../domain/entities/api-token.entity';
import { ApiTokenService } from '../../infrastructure/services/api-token.service';
import { randomUUID } from 'crypto';

export interface CreateApiTokenCommand {
  name: string;
  description?: string | null;
  expiresAt?: Date | null;
  createdBy: string; // 作成者ID（ユーザーID）
}

export interface CreateApiTokenResult {
  id: string;
  name: string;
  description: string | null;
  token: string; // フルトークン（この時点でしか表示されない）
  tokenPreview: string; // トークンのプレビュー表示
  tokenPrefix: string;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: string;
}

@Injectable()
export class CreateApiTokenUseCase {
  constructor(
    @Inject('IApiTokenRepository')
    private readonly apiTokenRepository: IApiTokenRepository,
    @Inject('ApiTokenService')
    private readonly apiTokenService: ApiTokenService,
  ) {}

  /**
   * APIトークン作成処理を実行する
   * @param command APIトークン作成コマンド
   * @returns 作成されたAPIトークンの情報（フルトークンを含む）
   */
  public async execute(command: CreateApiTokenCommand): Promise<CreateApiTokenResult> {
    // シークレットを生成
    const secret = this.apiTokenService.generateSecret();

    // シークレットをハッシュ化
    const tokenHash = await this.apiTokenService.hashToken(secret);

    // プレフィックスを取得
    const prefix = this.apiTokenService.getDefaultPrefix();

    // フルトークンを作成
    const fullToken = this.apiTokenService.buildFullToken(prefix, secret);

    // トークンプレビューを作成（最初の20文字を表示）
    const tokenPreview = fullToken.substring(0, Math.min(20, fullToken.length)) + '...';

    // APIトークンエンティティを作成
    const tokenId = randomUUID();
    const apiToken = ApiToken.create(
      tokenId,
      command.name,
      command.description ?? null,
      tokenHash,
      prefix,
      command.expiresAt ?? null,
      command.createdBy,
    );

    // リポジトリに保存
    await this.apiTokenRepository.save(apiToken);

    // 結果を返す（フルトークンを含む）
    return {
      id: apiToken.id,
      name: apiToken.name,
      description: apiToken.description,
      token: fullToken, // この時点でしか表示されない
      tokenPreview,
      tokenPrefix: apiToken.tokenPrefix,
      expiresAt: apiToken.expiresAt,
      createdAt: apiToken.createdAt,
      createdBy: apiToken.createdBy,
    };
  }
}
