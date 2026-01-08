/**
 * Main Entry Point
 *
 * NestJSアプリケーションのエントリーポイント
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // グローバルバリデーションパイプを設定
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS設定（開発環境用）
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port: number = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port);

  new Logger('Bootstrap').log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
