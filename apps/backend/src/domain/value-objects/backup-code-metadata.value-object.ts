/**
 * BackupCodeMetadata Value Object
 *
 * バックアップコードのメタデータの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class BackupCodeMetadata {
  public readonly id: string;
  public readonly usedAt: Date | null;
  public readonly createdAt: Date;

  private constructor(id: string, usedAt: Date | null, createdAt: Date) {
    this.id = id;
    this.usedAt = usedAt;
    this.createdAt = createdAt;
  }

  /**
   * バックアップコードメタデータを作成する
   * @param id バックアップコードID（UUID）
   * @param createdAt 作成日時
   * @returns BackupCodeMetadata Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(id: string, createdAt: Date): BackupCodeMetadata {
    if (!id || id.trim().length === 0) {
      throw new Error('Backup code ID cannot be empty');
    }

    return new BackupCodeMetadata(id, null, createdAt);
  }

  /**
   * 既存のバックアップコードメタデータを再構築する
   * @param id バックアップコードID
   * @param usedAt 使用日時（nullの場合は未使用）
   * @param createdAt 作成日時
   * @returns BackupCodeMetadata Value Object
   */
  public static reconstruct(id: string, usedAt: Date | null, createdAt: Date): BackupCodeMetadata {
    return new BackupCodeMetadata(id, usedAt, createdAt);
  }

  /**
   * 使用済みかどうかを判定する
   * @returns 使用済みの場合true
   */
  public isUsed(): boolean {
    return this.usedAt !== null;
  }

  /**
   * 使用済みとしてマークする
   * @param usedAt 使用日時
   * @returns 新しいBackupCodeMetadata（使用済み）
   */
  public markAsUsed(usedAt: Date): BackupCodeMetadata {
    if (this.usedAt !== null) {
      throw new Error('Backup code is already used');
    }
    return new BackupCodeMetadata(this.id, usedAt, this.createdAt);
  }
}
