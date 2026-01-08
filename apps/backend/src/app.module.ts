/**
 * App Module
 *
 * アプリケーションのルートモジュール
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './presentation/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // アプリケーション全体でConfigModuleを利用可能にする
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
