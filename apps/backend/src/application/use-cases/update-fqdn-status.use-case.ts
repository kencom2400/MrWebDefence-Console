/**
 * UpdateFqdnStatusUseCase
 *
 * FQDNステータス更新処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';

@Injectable()
export class UpdateFqdnStatusUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
  ) {}

  /**
   * FQDNステータス更新処理を実行する
   * @param id FQDN ID
   * @param status ステータス（'ACTIVE' または 'INACTIVE'）
   * @returns 更新されたFQDNエンティティ
   * @throws NotFoundException FQDNが見つからない場合
   */
  public async execute(id: string, status: FqdnStatusEnum): Promise<Fqdn> {
    // FQDNを取得
    const fqdn = await this.fqdnRepository.findById(id);
    if (!fqdn) {
      throw new NotFoundException('FQDN not found');
    }

    // ステータスを変更
    let updatedFqdn: Fqdn;
    if (status === FqdnStatusEnum.ACTIVE) {
      updatedFqdn = fqdn.activate();
    } else {
      updatedFqdn = fqdn.deactivate();
    }

    // リポジトリに保存
    return await this.fqdnRepository.update(updatedFqdn);
  }
}
