import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';

@Injectable()
export class RedisTokenBlacklistRepository
  implements ITokenBlacklistRepository, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisTokenBlacklistRepository.name);
  private redisClient: Redis;
  private readonly KEY_PREFIX = 'blacklist:';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

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
      // 値は空文字でOK。TTLを設定して自動的に消えるようにする。
      await this.redisClient.set(`${this.KEY_PREFIX}${token}`, '1', 'EX', ttl);
    }
  }

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  public async isBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(`${this.KEY_PREFIX}${token}`);
      return result === 1;
    } catch (error) {
      // Redis接続エラーの場合は、ログを出力してfalseを返す（トークンを有効とみなす）
      // これにより、Redis接続エラーが発生しても、アプリケーションは動作し続ける
      this.logger.warn('Failed to check token blacklist (assuming not blacklisted):', error);
      return false;
    }
  }
}

import Redis from 'ioredis';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';

@Injectable()
export class RedisTokenBlacklistRepository
  implements ITokenBlacklistRepository, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisTokenBlacklistRepository.name);
  private redisClient: Redis;
  private readonly KEY_PREFIX = 'blacklist:';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

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
      // 値は空文字でOK。TTLを設定して自動的に消えるようにする。
      await this.redisClient.set(`${this.KEY_PREFIX}${token}`, '1', 'EX', ttl);
    }
  }

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  public async isBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(`${this.KEY_PREFIX}${token}`);
      return result === 1;
    } catch (error) {
      // Redis接続エラーの場合は、ログを出力してfalseを返す（トークンを有効とみなす）
      // これにより、Redis接続エラーが発生しても、アプリケーションは動作し続ける
      this.logger.warn('Failed to check token blacklist (assuming not blacklisted):', error);
      return false;
    }
  }
}

import Redis from 'ioredis';
import { ITokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';

@Injectable()
export class RedisTokenBlacklistRepository
  implements ITokenBlacklistRepository, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisTokenBlacklistRepository.name);
  private redisClient: Redis;
  private readonly KEY_PREFIX = 'blacklist:';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

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
      // 値は空文字でOK。TTLを設定して自動的に消えるようにする。
      await this.redisClient.set(`${this.KEY_PREFIX}${token}`, '1', 'EX', ttl);
    }
  }

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  public async isBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(`${this.KEY_PREFIX}${token}`);
      return result === 1;
    } catch (error) {
      // Redis接続エラーの場合は、ログを出力してfalseを返す（トークンを有効とみなす）
      // これにより、Redis接続エラーが発生しても、アプリケーションは動作し続ける
      this.logger.warn('Failed to check token blacklist (assuming not blacklisted):', error);
      return false;
    }
  }
}
