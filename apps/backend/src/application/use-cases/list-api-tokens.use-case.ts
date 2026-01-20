/**
 * ListApiTokensUseCase
 *
 * APIトークン一覧取得処理のユースケース
 */

import { Injectable, Inject } from '@nestjs/common';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';
import { ApiToken } from '../../domain/entities/api-token.entity';

export interface ApiTokenListItem {
  id: string;
  name: string;
  description: string | null;
  tokenPreview: string; // トークンのプレビュー表示
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  createdBy: string;
}

export interface ListApiTokensResult {
  tokens: ApiTokenListItem[];
  total: number;
}

@Injectable()
export class ListApiTokensUseCase {
  constructor(
    @Inject('IApiTokenRepository')
    private readonly apiTokenRepository: IApiTokenRepository,
  ) {}

  /**
   * APIトークン一覧取得処理を実行する
   * @returns APIトークン一覧
   */
  public async execute(): Promise<ListApiTokensResult> {
    const tokens = await this.apiTokenRepository.findAll();

    // トークンプレビューを作成（プレフィックス + 最初の10文字 + "..."）
    const items: ApiTokenListItem[] = tokens.map((token) => {
      const previewLength = 10;
      const preview = token.tokenPrefix + 'x'.repeat(previewLength) + '...';
      return {
        id: token.id,
        name: token.name,
        description: token.description,
        tokenPreview: preview,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
        createdBy: token.createdBy,
      };
    });

    return {
      tokens: items,
      total: items.length,
    };
  }
}
