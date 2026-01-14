/**
 * User Controller
 *
 * ユーザー管理関連のHTTPエンドポイントを提供するコントローラー
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
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/entities/user-role.enum';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetUserListUseCase } from '../../application/use-cases/get-user-list.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { ChangeUserRoleUseCase } from '../../application/use-cases/change-user-role.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserListQueryDto } from '../dto/user-list-query.dto';
import { UserListResponseDto } from '../dto/user-list-response.dto';
import { ChangeUserRoleDto } from '../dto/change-user-role.dto';
import { User } from '../../domain/entities/user.entity';

@Controller('api/v1/users')
@Roles(UserRole.SERVICE_ADMIN)
export class UserController {
  constructor(
    @Inject(CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject(UpdateUserUseCase)
    private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(DeleteUserUseCase)
    private readonly deleteUserUseCase: DeleteUserUseCase,
    @Inject(GetUserListUseCase)
    private readonly getUserListUseCase: GetUserListUseCase,
    @Inject(GetUserByIdUseCase)
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    @Inject(ChangeUserRoleUseCase)
    private readonly changeUserRoleUseCase: ChangeUserRoleUseCase,
  ) {}

  /**
   * ユーザーを作成する
   * POST /api/v1/users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute(
      createUserDto.email,
      createUserDto.password,
      createUserDto.role,
    );
    return this.toResponseDto(user);
  }

  /**
   * ユーザーを更新する
   * PATCH /api/v1/users/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  public async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute(id, updateUserDto.email);
    return this.toResponseDto(user);
  }

  /**
   * ユーザーを削除する
   * DELETE /api/v1/users/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute(id);
  }

  /**
   * ユーザー一覧を取得・検索する
   * GET /api/v1/users
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  public async findAll(@Query() query: UserListQueryDto): Promise<UserListResponseDto> {
    const result = await this.getUserListUseCase.execute({
      email: query.email,
      role: query.role,
      page: query.page,
      limit: query.limit,
    });
    return {
      users: result.users.map((u) => this.toResponseDto(u)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * ユーザー詳細を取得する
   * GET /api/v1/users/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  public async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.getUserByIdUseCase.execute(id);
    return this.toResponseDto(user);
  }

  /**
   * ユーザーロールを変更する
   * PATCH /api/v1/users/:id/role
   */
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  public async changeRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeUserRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.changeUserRoleUseCase.execute(id, changeRoleDto.role);
    return this.toResponseDto(user);
  }

  /**
   * UserエンティティをUserResponseDtoに変換する
   * @param user ユーザーエンティティ
   * @returns UserResponseDto
   */
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
