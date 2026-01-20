/**
 * ApiTokenController
 *
 * APIトークン管理APIのHTTPエンドポイントを提供するコントローラー
 * プレゼンテーション層に位置し、アプリケーション層に依存する
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';
import { CreateApiTokenUseCase } from '../../application/use-cases/create-api-token.use-case';
import { ListApiTokensUseCase } from '../../application/use-cases/list-api-tokens.use-case';
import { DeleteApiTokenUseCase } from '../../application/use-cases/delete-api-token.use-case';
import { RevokeApiTokenUseCase } from '../../application/use-cases/revoke-api-token.use-case';
import { CreateApiTokenDto } from '../dto/create-api-token.dto';
import { ApiTokenResponseDto } from '../dto/api-token-response.dto';
import { ListApiTokensResponseDto } from '../dto/list-api-tokens-response.dto';
import { ApiTokenListItemDto } from '../dto/api-token-list-item.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    sub: string; // ユーザーID
    email: string;
    role: UserRole;
  };
}

@Controller('api/v1/api-tokens')
@Roles(UserRole.SERVICE_ADMIN)
export class ApiTokenController {
  constructor(
    @Inject(CreateApiTokenUseCase)
    private readonly createApiTokenUseCase: CreateApiTokenUseCase,
    @Inject(ListApiTokensUseCase)
    private readonly listApiTokensUseCase: ListApiTokensUseCase,
    @Inject(DeleteApiTokenUseCase)
    private readonly deleteApiTokenUseCase: DeleteApiTokenUseCase,
    @Inject(RevokeApiTokenUseCase)
    private readonly revokeApiTokenUseCase: RevokeApiTokenUseCase,
  ) {}

  /**
   * APIトークンを生成・発行する
   * POST /api/v1/api-tokens
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createApiTokenDto: CreateApiTokenDto,
    @Req() request: RequestWithUser,
  ): Promise<ApiTokenResponseDto> {
    // リクエストからユーザーIDを取得
    const createdBy = request.user?.sub;
    if (!createdBy) {
      throw new Error('User ID not found in request');
    }

    // expiresAtをDateオブジェクトに変換（nullの場合はnullのまま）
    const expiresAt = createApiTokenDto.expiresAt
      ? new Date(createApiTokenDto.expiresAt)
      : null;

    const result = await this.createApiTokenUseCase.execute({
      name: createApiTokenDto.name,
      description: createApiTokenDto.description ?? null,
      expiresAt,
      createdBy,
    });

    return this.toResponseDto(result);
  }

  /**
   * APIトークンの一覧を取得する
   * GET /api/v1/api-tokens
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  public async list(): Promise<ListApiTokensResponseDto> {
    const result = await this.listApiTokensUseCase.execute();
    return {
      tokens: result.tokens.map((item) => this.toListItemDto(item)),
      total: result.total,
    };
  }

  /**
   * APIトークンを削除する
   * DELETE /api/v1/api-tokens/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Param('id') id: string): Promise<void> {
    await this.deleteApiTokenUseCase.execute(id);
  }

  /**
   * APIトークンを無効化する
   * POST /api/v1/api-tokens/:id/revoke
   */
  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  public async revoke(@Param('id') id: string): Promise<ApiTokenResponseDto> {
    const token = await this.revokeApiTokenUseCase.execute(id);
    return this.toResponseDtoFromEntity(token);
  }

  /**
   * CreateApiTokenResultをApiTokenResponseDtoに変換する
   * @param result CreateApiTokenResult
   * @returns ApiTokenResponseDto
   */
  private toResponseDto(result: {
    id: string;
    name: string;
    description: string | null;
    token: string;
    tokenPreview: string;
    tokenPrefix: string;
    expiresAt: Date | null;
    createdAt: Date;
    createdBy: string;
  }): ApiTokenResponseDto {
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      token: result.token, // 生成時のみ含まれる
      tokenPreview: result.tokenPreview,
      expiresAt: result.expiresAt,
      revokedAt: null,
      createdAt: result.createdAt,
      createdBy: result.createdBy,
    };
  }

  /**
   * ApiTokenエンティティをApiTokenResponseDtoに変換する
   * @param token ApiTokenエンティティ
   * @returns ApiTokenResponseDto
   */
  private toResponseDtoFromEntity(token: {
    id: string;
    name: string;
    description: string | null;
    tokenPrefix: string;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    createdBy: string;
  }): ApiTokenResponseDto {
    // トークンプレビューを作成（プレフィックス + マスクされた部分）
    const previewLength = 10;
    const tokenPreview = token.tokenPrefix + 'x'.repeat(previewLength) + '...';

    return {
      id: token.id,
      name: token.name,
      description: token.description,
      // tokenフィールドは生成時のみ含まれるため、ここでは含めない
      tokenPreview,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
      createdBy: token.createdBy,
    };
  }

  /**
   * ApiTokenListItemをApiTokenListItemDtoに変換する
   * @param item ApiTokenListItem
   * @returns ApiTokenListItemDto
   */
  private toListItemDto(item: {
    id: string;
    name: string;
    description: string | null;
    tokenPreview: string;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
    createdBy: string;
  }): ApiTokenListItemDto {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      tokenPreview: item.tokenPreview,
      expiresAt: item.expiresAt,
      revokedAt: item.revokedAt,
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    };
  }
}
