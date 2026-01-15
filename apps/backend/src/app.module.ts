/**
 * App Module
 *
 * アプリケーションのルートモジュール
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './presentation/auth.module';
import { CustomerModule } from './presentation/customer.module';
import { UserModule } from './presentation/user.module';
import { FqdnModule } from './presentation/fqdn.module';
import { DatabaseModule } from './presentation/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // アプリケーション全体でConfigModuleを利用可能にする
    }),
    DatabaseModule,
    AuthModule,
    CustomerModule,
    UserModule,
    FqdnModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
