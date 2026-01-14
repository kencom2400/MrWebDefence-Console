/**
 * UpdateFqdnUseCase
 *
 * FQDN更新処理のユースケース
 */

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';

@Injectable()
export class UpdateFqdnUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
  ) {}

  /**
   * FQDN更新処理を実行する
   * @param id FQDN ID
   * @param fqdn FQDN文字列（オプション）
   * @param description 説明（オプション）
   * @returns 更新されたFQDNエンティティ
   * @throws NotFoundException FQDNが見つからない場合
   * @throws ConflictException FQDNが他のFQDNと重複している場合
   */
  public async execute(id: string, fqdn?: string, description?: string | null): Promise<Fqdn> {
    // FQDNを取得
    const existingFqdn = await this.fqdnRepository.findById(id);
    if (!existingFqdn) {
      throw new NotFoundException('FQDN not found');
    }

    // FQDN文字列が変更される場合、重複チェック
    if (fqdn) {
      const normalizedFqdn = fqdn.trim().toLowerCase();
      if (normalizedFqdn !== existingFqdn.fqdn) {
        const duplicateFqdn = await this.fqdnRepository.findByFqdn(normalizedFqdn);
        if (duplicateFqdn) {
          throw new ConflictException('FQDN already exists');
        }
      }
    }

    // FQDN情報を更新
    const updatedFqdn = existingFqdn.update(fqdn, description);

    // リポジトリに保存
    return await this.fqdnRepository.update(updatedFqdn);
  }
}
