/**
 * Customer Controller
 *
 * 顧客管理関連のHTTPエンドポイントを提供するコントローラー
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
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../application/use-cases/delete-customer.use-case';
import { GetCustomerListUseCase } from '../../application/use-cases/get-customer-list.use-case';
import { GetCustomerByIdUseCase } from '../../application/use-cases/get-customer-by-id.use-case';
import { ToggleCustomerStatusUseCase } from '../../application/use-cases/toggle-customer-status.use-case';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomerResponseDto } from '../dto/customer-response.dto';
import { CustomerListQueryDto } from '../dto/customer-list-query.dto';
import { CustomerListResponseDto } from '../dto/customer-list-response.dto';
import { ToggleCustomerStatusDto } from '../dto/toggle-customer-status.dto';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerStatusEnum } from '../../domain/value-objects/customer-status.value-object';

@Controller('api/v1/customers')
export class CustomerController {
  constructor(
    @Inject(CreateCustomerUseCase)
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    @Inject(UpdateCustomerUseCase)
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    @Inject(DeleteCustomerUseCase)
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    @Inject(GetCustomerListUseCase)
    private readonly getCustomerListUseCase: GetCustomerListUseCase,
    @Inject(GetCustomerByIdUseCase)
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    @Inject(ToggleCustomerStatusUseCase)
    private readonly toggleCustomerStatusUseCase: ToggleCustomerStatusUseCase,
  ) {}

  /**
   * 顧客を作成する
   * POST /api/v1/customers
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.createCustomerUseCase.execute(
      createCustomerDto.name,
      createCustomerDto.email,
      createCustomerDto.phone,
      createCustomerDto.company,
      createCustomerDto.address,
    );
    return this.toResponseDto(customer);
  }

  /**
   * 顧客を更新する
   * PATCH /api/v1/customers/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  public async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.updateCustomerUseCase.execute(
      id,
      updateCustomerDto.name,
      updateCustomerDto.email,
      updateCustomerDto.phone,
      updateCustomerDto.company,
      updateCustomerDto.address,
    );
    return this.toResponseDto(customer);
  }

  /**
   * 顧客を削除する
   * DELETE /api/v1/customers/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Param('id') id: string): Promise<void> {
    await this.deleteCustomerUseCase.execute(id);
  }

  /**
   * 顧客一覧を取得・検索する
   * GET /api/v1/customers
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  public async findAll(@Query() query: CustomerListQueryDto): Promise<CustomerListResponseDto> {
    const result = await this.getCustomerListUseCase.execute({
      name: query.name,
      email: query.email,
      company: query.company,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
    return {
      customers: result.customers.map((c) => this.toResponseDto(c)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * 顧客詳細を取得する
   * GET /api/v1/customers/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  public async findOne(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.getCustomerByIdUseCase.execute(id);
    return this.toResponseDto(customer);
  }

  /**
   * 顧客ステータスを切り替える
   * PATCH /api/v1/customers/:id/status
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  public async toggleStatus(
    @Param('id') id: string,
    @Body() toggleStatusDto: ToggleCustomerStatusDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.toggleCustomerStatusUseCase.execute(id, toggleStatusDto.status);
    return this.toResponseDto(customer);
  }

  /**
   * CustomerエンティティをCustomerResponseDtoに変換する
   * @param customer 顧客エンティティ
   * @returns CustomerResponseDto
   */
  private toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      status: customer.status.getValue(),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}

