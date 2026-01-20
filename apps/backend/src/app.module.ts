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
import { EngineModule } from './presentation/engine.module';
import { DatabaseModule } from './presentation/database.module';
import { MigrationModule } from './presentation/migration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // アプリケーション全体でConfigModuleを利用可能にする
    }),
    DatabaseModule,
    MigrationModule, // マイグレーションモジュールを追加
    AuthModule,
    CustomerModule,
    UserModule,
    FqdnModule,
    EngineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
