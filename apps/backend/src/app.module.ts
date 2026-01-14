/**
 * App Module
 *
 * アプリケーションのルートモジュール
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './presentation/auth.module';
import { CustomerModule } from './presentation/customer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // アプリケーション全体でConfigModuleを利用可能にする
    }),
    AuthModule,
    CustomerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
