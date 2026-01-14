/**
 * DeleteFqdnUseCase
 *
 * FQDN削除処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';

@Injectable()
export class DeleteFqdnUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
  ) {}

  /**
   * FQDN削除処理を実行する
   * @param id FQDN ID
   * @throws NotFoundException FQDNが見つからない場合
   */
  public async execute(id: string): Promise<void> {
    // FQDNの存在確認
    const fqdn = await this.fqdnRepository.findById(id);
    if (!fqdn) {
      throw new NotFoundException('FQDN not found');
    }

    // FQDNを削除
    await this.fqdnRepository.delete(id);
  }
}
