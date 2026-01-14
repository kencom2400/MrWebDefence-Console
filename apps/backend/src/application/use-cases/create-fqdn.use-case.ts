/**
 * CreateFqdnUseCase
 *
 * FQDN作成処理のユースケース
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateFqdnUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
  ) {}

  /**
   * FQDN作成処理を実行する
   * @param fqdn FQDN文字列
   * @param description 説明（オプション）
   * @returns 作成されたFQDNエンティティ
   * @throws ConflictException 同じFQDNが既に存在する場合
   */
  public async execute(fqdn: string, description?: string | null): Promise<Fqdn> {
    // FQDNを小文字に正規化して重複チェック
    const normalizedFqdn = fqdn.trim().toLowerCase();
    const existingFqdn = await this.fqdnRepository.findByFqdn(normalizedFqdn);
    if (existingFqdn) {
      throw new ConflictException('FQDN already exists');
    }

    // FQDNエンティティを作成
    const fqdnId = randomUUID();
    const fqdnEntity = Fqdn.create(fqdnId, normalizedFqdn, description);

    // リポジトリに保存
    return await this.fqdnRepository.create(fqdnEntity);
  }
}
