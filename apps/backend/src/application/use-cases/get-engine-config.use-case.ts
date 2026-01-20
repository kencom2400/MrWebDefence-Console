/**
 * GetEngineConfigUseCase
 *
 * WAFエンジン向け設定情報取得処理を実行するユースケース
 * Application層に位置し、ドメイン層とインフラストラクチャ層に依存する
 */

import { Injectable, Inject } from '@nestjs/common';
import { IFqdnRepository } from '../../domain/repositories/fqdn.repository.interface';
import { IIpAllowListRepository } from '../../domain/repositories/ip-allowlist.repository.interface';
import { ICustomerRepository } from '../../domain/repositories/customer.repository.interface';
import { EngineConfig } from '../../domain/value-objects/engine-config.value-object';
import { FqdnStatusEnum } from '../../domain/value-objects/fqdn-status.value-object';
import { CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

/**
 * データ取得の上限値（実用的な上限値）
 * 将来的にはカーソルベースのページネーションに移行する予定
 */
const MAX_FETCH_LIMIT = 10000;

@Injectable()
export class GetEngineConfigUseCase {
  constructor(
    @Inject('IFqdnRepository')
    private readonly fqdnRepository: IFqdnRepository,
    @Inject('IIpAllowListRepository')
    private readonly ipAllowListRepository: IIpAllowListRepository,
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * WAFエンジン向け設定情報取得処理を実行する
   * @returns EngineConfig Value Object
   */
  public async execute(): Promise<EngineConfig> {
    // 並列実行でデータを取得
    const [fqdnResult, ipAllowLists, customerResult] = await Promise.all([
      // 有効なFQDNのみを取得（status = 'ACTIVE'）
      this.fqdnRepository.findAll({
        status: FqdnStatusEnum.ACTIVE,
        page: 1,
        limit: MAX_FETCH_LIMIT,
      }),
      // すべてのIP AllowListを取得
      this.ipAllowListRepository.findAll(),
      // 有効な顧客のみを取得（status = 'ACTIVE'）
      this.customerRepository.findAll({
        status: CustomerStatusEnum.ACTIVE,
        page: 1,
        limit: MAX_FETCH_LIMIT,
      }),
    ]);

    // EngineConfig Value Objectを作成
    return EngineConfig.create(fqdnResult.fqdns, ipAllowLists, customerResult.customers);
  }
}
