/**
 * ApiTokenRepository
 *
 * APIトークンリポジトリ（インメモリ実装）
 * 本来はデータベースに接続するが、現段階ではメモリ上でデータを管理する
 */

import { Injectable } from '@nestjs/common';
import { ApiToken } from '../../domain/entities/api-token.entity';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';

@Injectable()
export class ApiTokenRepository implements IApiTokenRepository {
  // メモリ上でAPIトークンデータを保持するマップ（IDベース）
  // 本番環境ではデータベースに置き換える
  private tokens: Map<string, ApiToken> = new Map();

  // トークンハッシュからIDを検索するためのマップ
  private tokenHashToIdMap: Map<string, string> = new Map();

  /**
   * APIトークンを保存する
   * @param token APIトークンエンティティ
   * @returns 保存されたAPIトークンエンティティ
   */
  async save(token: ApiToken): Promise<ApiToken> {
    this.tokens.set(token.id, token);
    this.tokenHashToIdMap.set(token.tokenHash, token.id);
    return token;
  }

  /**
   * APIトークンIDからAPIトークンを検索する
   * @param id APIトークンID
   * @returns APIトークンエンティティ、またはnull
   */
  async findById(id: string): Promise<ApiToken | null> {
    return this.tokens.get(id) || null;
  }

  /**
   * トークンハッシュからAPIトークンを検索する
   * @param tokenHash トークンハッシュ
   * @returns APIトークンエンティティ、またはnull
   */
  async findByTokenHash(tokenHash: string): Promise<ApiToken | null> {
    const id = this.tokenHashToIdMap.get(tokenHash);
    if (!id) {
      return null;
    }
    return this.tokens.get(id) || null;
  }

  /**
   * すべてのAPIトークンを取得する
   * @returns APIトークンエンティティの配列
   */
  async findAll(): Promise<ApiToken[]> {
    return Array.from(this.tokens.values());
  }

  /**
   * プレフィックスでAPIトークンを検索する
   * @param prefix トークンプレフィックス（例: "waf_"）
   * @returns APIトークンエンティティの配列
   */
  async findByPrefix(prefix: string): Promise<ApiToken[]> {
    return Array.from(this.tokens.values()).filter((token) => token.tokenPrefix === prefix);
  }

  /**
   * APIトークンを削除する
   * @param id APIトークンID
   * @returns 削除が成功した場合true、トークンが見つからない場合false
   */
  async delete(id: string): Promise<boolean> {
    const token = this.tokens.get(id);
    if (!token) {
      return false;
    }

    // トークンハッシュマップからも削除
    this.tokenHashToIdMap.delete(token.tokenHash);
    this.tokens.delete(id);
    return true;
  }
}
