/**
 * EngineConfigController
 *
 * WAFエンジン向け設定配信APIのHTTPエンドポイントを提供するコントローラー
 * プレゼンテーション層に位置し、アプリケーション層に依存する
 */

import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetEngineConfigUseCase } from '../../application/use-cases/get-engine-config.use-case';
import { EngineConfigResponseDto } from '../dto/engine-config-response.dto';
import { FqdnConfig } from '../dto/fqdn-config.dto';
import { IpAllowListConfig } from '../dto/ip-allowlist-config.dto';
import { CustomerConfig } from '../dto/customer-config.dto';
import { EngineConfig } from '../../domain/value-objects/engine-config.value-object';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { IpAllowList } from '../../domain/entities/ip-allowlist.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Public } from '../decorators/public.decorator';

@ApiTags('Engine')
@Controller('engine/v1')
export class EngineConfigController {
  constructor(
    @Inject(GetEngineConfigUseCase)
    private readonly getEngineConfigUseCase: GetEngineConfigUseCase,
  ) {}

  /**
   * WAFエンジン向け設定情報を取得する
   * GET /engine/v1/config
   */
  @Public() // APIキー認証またはJWT認証のどちらでもアクセス可能
  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'WAFエンジン向け設定情報を取得',
    type: EngineConfigResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '認証失敗' })
  public async getConfig(): Promise<EngineConfigResponseDto> {
    const engineConfig = await this.getEngineConfigUseCase.execute();
    return this.toResponseDto(engineConfig);
  }

  /**
   * EngineConfig Value ObjectをEngineConfigResponseDtoに変換する
   * @param engineConfig EngineConfig Value Object
   * @returns EngineConfigResponseDto
   */
  private toResponseDto(engineConfig: EngineConfig): EngineConfigResponseDto {
    return {
      fqdns: engineConfig.fqdns.map((fqdn) => this.toFqdnConfig(fqdn)),
      ipAllowLists: engineConfig.ipAllowLists.map((ipAllowList) =>
        this.toIpAllowListConfig(ipAllowList),
      ),
      customers: engineConfig.customers.map((customer) =>
        this.toCustomerConfig(customer),
      ),
      lastUpdated: engineConfig.lastUpdated.toISOString(),
    };
  }

  /**
   * FqdnエンティティをFqdnConfigに変換する
   * @param fqdn Fqdnエンティティ
   * @returns FqdnConfig
   */
  private toFqdnConfig(fqdn: Fqdn): FqdnConfig {
    return {
      id: fqdn.id,
      fqdn: fqdn.fqdn,
      status: fqdn.status.getValue() as 'ACTIVE' | 'INACTIVE',
    };
  }

  /**
   * IpAllowListエンティティをIpAllowListConfigに変換する
   * @param ipAllowList IpAllowListエンティティ
   * @returns IpAllowListConfig
   */
  private toIpAllowListConfig(ipAllowList: IpAllowList): IpAllowListConfig {
    return {
      id: ipAllowList.id,
      userId: ipAllowList.userId,
      ipAddress: ipAllowList.ipAddress,
    };
  }

  /**
   * CustomerエンティティをCustomerConfigに変換する
   * @param customer Customerエンティティ
   * @returns CustomerConfig
   */
  private toCustomerConfig(customer: Customer): CustomerConfig {
    return {
      id: customer.id,
      name: customer.name,
      status: customer.status.getValue() as 'ACTIVE' | 'INACTIVE',
    };
  }
}
