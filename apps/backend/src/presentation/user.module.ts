/**
 * User Module
 *
 * ユーザー管理機能のNestJSモジュール
 * 依存性注入の設定を行う
 */

import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserListUseCase } from '../application/use-cases/get-user-list.use-case';
import { GetUserByIdUseCase } from '../application/use-cases/get-user-by-id.use-case';
import { ChangeUserRoleUseCase } from '../application/use-cases/change-user-role.use-case';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { PasswordService } from '../infrastructure/services/password.service';

@Module({
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserListUseCase,
    GetUserByIdUseCase,
    ChangeUserRoleUseCase,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'PasswordService',
      useFactory: (): PasswordService => {
        const saltRounds: number = process.env.BCRYPT_SALT_ROUNDS
          ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
          : 10;
        return new PasswordService(saltRounds);
      },
    },
  ],
  exports: [
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserListUseCase,
    GetUserByIdUseCase,
    ChangeUserRoleUseCase,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
})
export class UserModule {}

