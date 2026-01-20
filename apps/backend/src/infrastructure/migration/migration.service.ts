/**
 * Migration Service
 *
 * Flywayマイグレーション実行サービス
 * Infrastructure Layerに位置
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * マイグレーション実行サービス
 */
@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private readonly configService: ConfigService;
  private readonly shouldRunMigrations: boolean;

  constructor(configService: ConfigService) {
    this.configService = configService;
    // 環境変数でマイグレーション実行を制御（デフォルト: false）
    this.shouldRunMigrations = this.configService.get<string>('AUTO_MIGRATE', 'false') === 'true';
  }

  /**
   * モジュール初期化時にマイグレーションを実行
   */
  async onModuleInit(): Promise<void> {
    if (!this.shouldRunMigrations) {
      this.logger.log('Auto-migration is disabled. Set AUTO_MIGRATE=true to enable.');
      return;
    }

    this.logger.log('Starting database migration...');
    try {
      await this.runMigrations();
      this.logger.log('Database migration completed successfully');
    } catch (error) {
      this.logger.error('Database migration failed', error);
      // 本番環境ではエラー時にアプリケーションを停止
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw error;
      }
      // 開発環境では警告のみ
      this.logger.warn(
        'Continuing application startup despite migration failure (development mode)',
      );
    }
  }

  /**
   * データベース接続情報を含む環境変数オブジェクトを取得
   */
  private getDbEnv(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      DB_HOST: this.configService.get<string>('DB_HOST'),
      DB_PORT: this.configService.get<string>('DB_PORT'),
      DB_USER: this.configService.get<string>('DB_USER'),
      DB_PASSWORD: this.configService.get<string>('DB_PASSWORD'),
      DB_NAME: this.configService.get<string>('DB_NAME'),
    };
  }

  /**
   * Flywayマイグレーションを実行
   */
  async runMigrations(): Promise<void> {
    const projectRoot = join(__dirname, '../../../../..');
    const migrateScript = join(projectRoot, 'scripts/database/migrate.sh');

    const env = this.getDbEnv();

    try {
      const { stdout, stderr } = await execAsync(`bash ${migrateScript} migrate`, {
        env,
        cwd: projectRoot,
      });

      if (stdout) {
        this.logger.log(stdout);
      }
      if (stderr) {
        this.logger.warn(stderr);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Migration execution failed: ${errorMessage}`, error);
      throw new Error(`Migration failed: ${errorMessage}`);
    }
  }

  /**
   * マイグレーション情報を取得
   */
  async getMigrationInfo(): Promise<string> {
    const projectRoot = join(__dirname, '../../../../..');
    const migrateScript = join(projectRoot, 'scripts/database/migrate.sh');

    const env = this.getDbEnv();

    try {
      const { stdout, stderr } = await execAsync(`bash ${migrateScript} info`, {
        env,
        cwd: projectRoot,
      });

      if (stderr) {
        this.logger.warn(stderr);
      }

      return stdout;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get migration info: ${errorMessage}`, error);
      throw new Error(`Failed to get migration info: ${errorMessage}`);
    }
  }
}
