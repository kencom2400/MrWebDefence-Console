/**
 * Fqdn Controller
 *
 * FQDN管理関連のHTTPエンドポイントを提供するコントローラー
 * プレゼンテーション層に位置し、アプリケーション層に依存する
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CreateFqdnUseCase } from '../../application/use-cases/create-fqdn.use-case';
import { UpdateFqdnUseCase } from '../../application/use-cases/update-fqdn.use-case';
import { DeleteFqdnUseCase } from '../../application/use-cases/delete-fqdn.use-case';
import { GetFqdnListUseCase } from '../../application/use-cases/get-fqdn-list.use-case';
import { GetFqdnByIdUseCase } from '../../application/use-cases/get-fqdn-by-id.use-case';
import { UpdateFqdnStatusUseCase } from '../../application/use-cases/update-fqdn-status.use-case';
import { CreateFqdnDto } from '../dto/create-fqdn.dto';
import { UpdateFqdnDto } from '../dto/update-fqdn.dto';
import { FqdnResponseDto } from '../dto/fqdn-response.dto';
import { FqdnListQueryDto } from '../dto/fqdn-list-query.dto';
import { FqdnListResponseDto } from '../dto/fqdn-list-response.dto';
import { UpdateFqdnStatusDto } from '../dto/update-fqdn-status.dto';
import { Fqdn } from '../../domain/entities/fqdn.entity';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';

@Controller('api/v1/fqdns')
@Roles(UserRole.SERVICE_MEMBER, UserRole.SERVICE_ADMIN)
export class FqdnController {
  constructor(
    @Inject(CreateFqdnUseCase)
    private readonly createFqdnUseCase: CreateFqdnUseCase,
    @Inject(UpdateFqdnUseCase)
    private readonly updateFqdnUseCase: UpdateFqdnUseCase,
    @Inject(DeleteFqdnUseCase)
    private readonly deleteFqdnUseCase: DeleteFqdnUseCase,
    @Inject(GetFqdnListUseCase)
    private readonly getFqdnListUseCase: GetFqdnListUseCase,
    @Inject(GetFqdnByIdUseCase)
    private readonly getFqdnByIdUseCase: GetFqdnByIdUseCase,
    @Inject(UpdateFqdnStatusUseCase)
    private readonly updateFqdnStatusUseCase: UpdateFqdnStatusUseCase,
  ) {}

  /**
   * FQDNを作成する
   * POST /api/v1/fqdns
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() createFqdnDto: CreateFqdnDto): Promise<FqdnResponseDto> {
    const fqdn = await this.createFqdnUseCase.execute(
      createFqdnDto.fqdn,
      createFqdnDto.description,
    );
    return this.toResponseDto(fqdn);
  }

  /**
   * FQDNを更新する
   * PATCH /api/v1/fqdns/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  public async update(
    @Param('id') id: string,
    @Body() updateFqdnDto: UpdateFqdnDto,
  ): Promise<FqdnResponseDto> {
    const fqdn = await this.updateFqdnUseCase.execute(
      id,
      updateFqdnDto.fqdn,
      updateFqdnDto.description,
    );
    return this.toResponseDto(fqdn);
  }

  /**
   * FQDNを削除する
   * DELETE /api/v1/fqdns/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Param('id') id: string): Promise<void> {
    await this.deleteFqdnUseCase.execute(id);
  }

  /**
   * FQDN一覧を取得・検索する
   * GET /api/v1/fqdns
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  public async findAll(@Query() query: FqdnListQueryDto): Promise<FqdnListResponseDto> {
    const result = await this.getFqdnListUseCase.execute({
      fqdn: query.fqdn,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
    return {
      fqdns: result.fqdns.map((f) => this.toResponseDto(f)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * FQDN詳細を取得する
   * GET /api/v1/fqdns/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  public async findOne(@Param('id') id: string): Promise<FqdnResponseDto> {
    const fqdn = await this.getFqdnByIdUseCase.execute(id);
    return this.toResponseDto(fqdn);
  }

  /**
   * FQDNステータスを更新する
   * PATCH /api/v1/fqdns/:id/status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  public async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFqdnStatusDto,
  ): Promise<FqdnResponseDto> {
    const fqdn = await this.updateFqdnStatusUseCase.execute(id, updateStatusDto.status);
    return this.toResponseDto(fqdn);
  }

  /**
   * FqdnエンティティをFqdnResponseDtoに変換する
   * @param fqdn FQDNエンティティ
   * @returns FqdnResponseDto
   */
  private toResponseDto(fqdn: Fqdn): FqdnResponseDto {
    return {
      id: fqdn.id,
      fqdn: fqdn.fqdn,
      description: fqdn.description,
      status: fqdn.status.getValue(),
      createdAt: fqdn.createdAt,
      updatedAt: fqdn.updatedAt,
    };
  }
}
