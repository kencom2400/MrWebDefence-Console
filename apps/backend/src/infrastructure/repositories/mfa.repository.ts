/**
 * MfaRepository
 *
 * MFA関連データのリポジトリ実装（インメモリ）
 * Infrastructure層に位置し、本来はデータベースに接続するが、現段階ではメモリ上でデータを管理する
 */

import { Injectable } from '@nestjs/common';
import { IMfaRepository } from '../../domain/repositories/mfa.repository.interface';
import { BackupCodeMetadata } from '../../domain/value-objects/backup-code-metadata.value-object';
import { v4 as uuidv4 } from 'uuid';

interface BackupCodeRecord {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class MfaRepository implements IMfaRepository {
  // メモリ上でMFAシークレットを保持するマップ
  // 本番環境ではデータベースに置き換える
  private secrets: Map<string, string> = new Map();

  // メモリ上でバックアップコードを保持するマップ
  // key: userId, value: BackupCodeRecord[]
  private backupCodes: Map<string, BackupCodeRecord[]> = new Map();

  /**
   * MFAシークレットを保存する
   */
  public async saveSecret(userId: string, secret: string): Promise<void> {
    this.secrets.set(userId, secret);
  }

  /**
   * MFAシークレットを取得する
   */
  public async getSecret(userId: string): Promise<string | null> {
    return this.secrets.get(userId) || null;
  }

  /**
   * MFAシークレットを削除する
   */
  public async deleteSecret(userId: string): Promise<void> {
    this.secrets.delete(userId);
  }

  /**
   * バックアップコードのハッシュを保存する
   */
  public async saveBackupCodes(userId: string, codeHashes: string[]): Promise<void> {
    const records: BackupCodeRecord[] = codeHashes.map((codeHash) => ({
      id: uuidv4(),
      userId,
      codeHash,
      usedAt: null,
      createdAt: new Date(),
    }));

    // 既存のコードを削除してから新しいコードを保存
    this.backupCodes.delete(userId);
    this.backupCodes.set(userId, records);
  }

  /**
   * バックアップコードのメタデータを取得する
   */
  public async getBackupCodes(userId: string): Promise<BackupCodeMetadata[]> {
    const records = this.backupCodes.get(userId) || [];
    return records.map((record) =>
      BackupCodeMetadata.reconstruct(record.id, record.usedAt, record.createdAt),
    );
  }

  /**
   * バックアップコードを使用済みとしてマークする
   */
  public async markBackupCodeAsUsed(userId: string, codeHash: string): Promise<void> {
    const records = this.backupCodes.get(userId);
    if (!records) {
      return;
    }

    const record = records.find((r) => r.codeHash === codeHash && r.usedAt === null);
    if (record) {
      record.usedAt = new Date();
    }
  }

  /**
   * バックアップコードのハッシュからレコードを検索する
   * @param userId ユーザーID
   * @param codeHash バックアップコードのハッシュ
   * @returns バックアップコードレコード、またはnull
   */
  public async findBackupCodeByHash(userId: string, codeHash: string): Promise<BackupCodeRecord | null> {
    const records = this.backupCodes.get(userId);
    if (!records) {
      return null;
    }

    const record = records.find((r) => r.codeHash === codeHash);
    return record || null;
  }

  /**
   * ユーザーの全てのバックアップコードを削除する
   */
  public async deleteBackupCodes(userId: string): Promise<void> {
    this.backupCodes.delete(userId);
  }
}

