/**
 * DeleteApiTokenUseCase
 *
 * APIトークン削除処理のユースケース
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IApiTokenRepository } from '../../domain/repositories/api-token.repository.interface';

@Injectable()
export class DeleteApiTokenUseCase {
  constructor(
    @Inject('IApiTokenRepository')
    private readonly apiTokenRepository: IApiTokenRepository,
  ) {}

  /**
   * APIトークン削除処理を実行する
   * @param id APIトークンID
   * @throws NotFoundException トークンが見つからない場合
   */
  public async execute(id: string): Promise<void> {
    const token = await this.apiTokenRepository.findById(id);
    if (!token) {
      throw new NotFoundException(`API token with id ${id} not found`);
    }

    await this.apiTokenRepository.delete(id);
  }
}
