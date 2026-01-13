/**
 * IMfaRepository Interface
 *
 * MFA関連データのリポジトリインターフェース
 * ドメイン層に位置し、外部に依存しない
 */

import { BackupCodeMetadata } from '../value-objects/backup-code-metadata.value-object';

export interface IMfaRepository {
  /**
   * MFAシークレットを保存する
   * @param userId ユーザーID
   * @param secret 暗号化されたMFAシークレット
   */
  saveSecret(userId: string, secret: string): Promise<void>;

  /**
   * MFAシークレットを取得する
   * @param userId ユーザーID
   * @returns 暗号化されたMFAシークレット、またはnull
   */
  getSecret(userId: string): Promise<string | null>;

  /**
   * MFAシークレットを削除する
   * @param userId ユーザーID
   */
  deleteSecret(userId: string): Promise<void>;

  /**
   * バックアップコードのハッシュを保存する
   * @param userId ユーザーID
   * @param codeHashes バックアップコードのハッシュ配列
   */
  saveBackupCodes(userId: string, codeHashes: string[]): Promise<void>;

  /**
   * バックアップコードのメタデータを取得する
   * @param userId ユーザーID
   * @returns バックアップコードメタデータの配列
   */
  getBackupCodes(userId: string): Promise<BackupCodeMetadata[]>;

  /**
   * バックアップコードを使用済みとしてマークする
   * @param userId ユーザーID
   * @param codeHash バックアップコードのハッシュ
   */
  markBackupCodeAsUsed(userId: string, codeHash: string): Promise<void>;

  /**
   * ユーザーの全てのバックアップコードを削除する
   * @param userId ユーザーID
   */
  deleteBackupCodes(userId: string): Promise<void>;

  /**
   * ユーザーの全てのバックアップコードレコードを取得する（検証用）
   * @param userId ユーザーID
   * @returns バックアップコードレコードの配列（ハッシュを含む）
   */
  getAllBackupCodeRecords(
    userId: string,
  ): Promise<Array<{ id: string; codeHash: string; usedAt: Date | null }>>;
}
