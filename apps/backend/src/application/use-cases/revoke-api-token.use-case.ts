/**
 * RevokeApiTokenUseCase
 *
 * APIトークン無効化処理のユースケース
 */

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';
import { ApiToken } from '../../domain/entities/api-token.entity';

@Injectable()
export class RevokeApiTokenUseCase {
  constructor(
    @Inject('IApiTokenRepository')
    private readonly apiTokenRepository: IApiTokenRepository,
  ) {}

  /**
   * APIトークン無効化処理を実行する
   * @param id APIトークンID
   * @throws NotFoundException トークンが見つからない場合
   * @throws BadRequestException トークンが既に無効化されている場合
   */
  public async execute(id: string): Promise<ApiToken> {
    const token = await this.apiTokenRepository.findById(id);
    if (!token) {
      throw new NotFoundException(`API token with id ${id} not found`);
    }

    if (token.isRevoked()) {
      throw new BadRequestException(`API token with id ${id} is already revoked`);
    }

    // トークンを無効化
    const revokedToken = token.revoke();

    // リポジトリに保存
    await this.apiTokenRepository.save(revokedToken);

    return revokedToken;
  }
}
