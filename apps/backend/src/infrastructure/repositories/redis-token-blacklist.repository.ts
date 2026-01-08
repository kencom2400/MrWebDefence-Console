import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';

@Injectable()
export class RedisTokenBlacklistRepository
  implements ITokenBlacklistRepository, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisTokenBlacklistRepository.name);
  private redisClient: Redis;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    
    this.redisClient = new Redis({
      host,
      port,
      lazyConnect: true, // アプリケーション起動時に即座に接続せず、明示的に接続する
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.redisClient.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      // Redisがなければ認証機能が正常に動作しないため、起動を失敗させる
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }

  /**
   * トークンをブラックリストに追加する
   * @param token JWTトークン
   * @param expiresAt 有効期限（Unixタイムスタンプ）
   */
  public async add(token: string, expiresAt: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = expiresAt - now;

    if (ttl > 0) {
      // blacklist:プレフィックスを付けて保存
      // 値は空文字でOK。TTLを設定して自動的に消えるようにする。
      await this.redisClient.set(`blacklist:${token}`, '1', 'EX', ttl);
    }
  }

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  public async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redisClient.exists(`blacklist:${token}`);
    return result === 1;
  }
}
