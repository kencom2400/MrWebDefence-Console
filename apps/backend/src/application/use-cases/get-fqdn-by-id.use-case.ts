/**
 * GetFqdnByIdUseCase
 *
 * FQDN詳細取得処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { Fqdn } from '../../domain/entities/fqdn.entity';

@Injectable()
export class GetFqdnByIdUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
  ) {}

  /**
   * FQDN詳細取得処理を実行する
   * @param id FQDN ID
   * @returns FQDNエンティティ
   * @throws NotFoundException FQDNが見つからない場合
   */
  public async execute(id: string): Promise<Fqdn> {
    const fqdn = await this.fqdnRepository.findById(id);
    if (!fqdn) {
      throw new NotFoundException('FQDN not found');
    }
    return fqdn;
  }
}
