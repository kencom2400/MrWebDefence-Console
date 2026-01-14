/**
 * FqdnRepository
 *
 * FQDNリポジトリ（インメモリ実装）
 * 本来はデータベースに接続するが、現段階ではメモリ上でデータを管理する
 */

import { Injectable } from '@nestjs/common';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import {
  IFqdnRepository,
  FqdnListQuery,
  FqdnListResult,
} from '../../domain/repositories/fqdn.repository.interface';

@Injectable()
export class FqdnRepository implements IFqdnRepository {
  // メモリ上でFQDNデータを保持するマップ（IDベース）
  // 本番環境ではデータベースに置き換える
  private fqdns: Map<string, Fqdn> = new Map();

  // FQDN文字列からIDを検索するためのマップ（大文字小文字を区別しない）
  private fqdnToIdMap: Map<string, string> = new Map();

  /**
   * FQDNを作成する
   * @param fqdn FQDNエンティティ
   * @returns 作成されたFQDNエンティティ
   */
  async create(fqdn: Fqdn): Promise<Fqdn> {
    this.fqdns.set(fqdn.id, fqdn);
    this.fqdnToIdMap.set(fqdn.fqdn.toLowerCase(), fqdn.id);
    return fqdn;
  }

  /**
   * FQDNを更新する
   * @param fqdn FQDNエンティティ
   * @returns 更新されたFQDNエンティティ
   */
  async update(fqdn: Fqdn): Promise<Fqdn> {
    if (!this.fqdns.has(fqdn.id)) {
      throw new Error(`FQDN with id ${fqdn.id} not found`);
    }

    // FQDN文字列が変更された場合、fqdnToIdMapを更新
    const existingFqdn = this.fqdns.get(fqdn.id)!;
    if (existingFqdn.fqdn.toLowerCase() !== fqdn.fqdn.toLowerCase()) {
      // 古いFQDN文字列のマッピングを削除
      this.fqdnToIdMap.delete(existingFqdn.fqdn.toLowerCase());
      // 新しいFQDN文字列のマッピングを追加
      this.fqdnToIdMap.set(fqdn.fqdn.toLowerCase(), fqdn.id);
    }

    this.fqdns.set(fqdn.id, fqdn);
    return fqdn;
  }

  /**
   * FQDNを削除する
   * @param id FQDN ID
   */
  async delete(id: string): Promise<void> {
    const fqdn = this.fqdns.get(id);
    if (!fqdn) {
      throw new Error(`FQDN with id ${id} not found`);
    }

    // FQDN文字列のマッピングを削除
    this.fqdnToIdMap.delete(fqdn.fqdn.toLowerCase());
    this.fqdns.delete(id);
  }

  /**
   * FQDN IDからFQDNを検索する
   * @param id FQDN ID
   * @returns FQDNエンティティ、またはnull
   */
  async findById(id: string): Promise<Fqdn | null> {
    return this.fqdns.get(id) || null;
  }

  /**
   * FQDN文字列からFQDNを検索する
   * @param fqdn FQDN文字列
   * @returns FQDNエンティティ、またはnull
   */
  async findByFqdn(fqdn: string): Promise<Fqdn | null> {
    const normalizedFqdn = fqdn.toLowerCase().trim();
    const fqdnId = this.fqdnToIdMap.get(normalizedFqdn);
    if (!fqdnId) {
      return null;
    }
    return this.fqdns.get(fqdnId) || null;
  }

  /**
   * FQDN一覧を取得・検索する
   * @param query 検索クエリ（検索条件とページネーション情報）
   * @returns FQDN一覧とページネーション情報
   */
  async findAll(query: FqdnListQuery): Promise<FqdnListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let filteredFqdns = Array.from(this.fqdns.values());

    // 検索条件でフィルタリング
    if (query.fqdn) {
      filteredFqdns = filteredFqdns.filter((f) =>
        f.fqdn.toLowerCase().includes(query.fqdn!.toLowerCase()),
      );
    }
    if (query.status) {
      filteredFqdns = filteredFqdns.filter((f) => f.status.getValue() === query.status);
    }

    // 総件数を取得
    const total = filteredFqdns.length;

    // ページネーション
    const offset = (page - 1) * limit;
    const paginatedFqdns = filteredFqdns.slice(offset, offset + limit);

    return {
      fqdns: paginatedFqdns,
      total,
      page,
      limit,
    };
  }

  /**
   * リポジトリの状態をクリアする（テスト用）
   * すべてのFQDNデータとマッピングを削除する
   */
  clear(): void {
    this.fqdns.clear();
    this.fqdnToIdMap.clear();
  }
}
