/**
 * Migration Module
 *
 * Flywayマイグレーション機能のNestJSモジュール
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MigrationService } from '../infrastructure/migration/migration.service';

@Module({
  imports: [ConfigModule],
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
