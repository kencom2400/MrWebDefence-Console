/**
 * Fqdn Entity
 *
 * FQDNエンティティ
 * ドメイン層の最内層に位置し、外部に依存しない
 */

import { FqdnStatus } from '../value-objects/fqdn-status.value-object';

export class Fqdn {
  public readonly id: string;
  public readonly fqdn: string;
  public readonly description: string | null;
  public readonly status: FqdnStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    fqdn: string,
    description: string | null,
    status: FqdnStatus,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.fqdn = fqdn;
    this.description = description;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * FQDNエンティティを作成する
   * @param id FQDN ID（UUID）
   * @param fqdn FQDN文字列
   * @param description 説明（オプション）
   * @returns Fqdn Entity
   */
  public static create(id: string, fqdn: string, description?: string | null): Fqdn {
    // FQDNを小文字に正規化
    const normalizedFqdn = fqdn.trim().toLowerCase();
    const trimmedDescription = description?.trim() || null;

    // バリデーション
    Fqdn.validateFqdn(normalizedFqdn);
    Fqdn.validateDescription(trimmedDescription);

    const now: Date = new Date();
    return new Fqdn(id, normalizedFqdn, trimmedDescription, FqdnStatus.active(), now, now);
  }

  /**
   * 既存のFQDNエンティティを再構築する
   * @param id FQDN ID
   * @param fqdn FQDN文字列
   * @param description 説明（オプション）
   * @param status ステータス
   * @param createdAt 作成日時
   * @param updatedAt 更新日時
   * @returns Fqdn Entity
   */
  public static reconstruct(
    id: string,
    fqdn: string,
    description: string | null,
    status: FqdnStatus,
    createdAt: Date,
    updatedAt: Date,
  ): Fqdn {
    return new Fqdn(id, fqdn, description, status, createdAt, updatedAt);
  }

  /**
   * FQDN情報を更新する
   * @param fqdn FQDN文字列（オプション）
   * @param description 説明（オプション）
   * @returns 新しいFqdnエンティティ（更新済み）
   */
  public update(fqdn?: string, description?: string | null): Fqdn {
    const newFqdn = fqdn !== undefined ? fqdn.trim().toLowerCase() : this.fqdn;
    const newDescription =
      description !== undefined ? description?.trim() || null : this.description;

    // バリデーション
    if (fqdn !== undefined) {
      Fqdn.validateFqdn(newFqdn);
    }
    if (description !== undefined) {
      Fqdn.validateDescription(newDescription);
    }

    return new Fqdn(this.id, newFqdn, newDescription, this.status, this.createdAt, new Date());
  }

  /**
   * FQDNを有効化する
   * @returns 新しいFqdnエンティティ（有効化済み）
   */
  public activate(): Fqdn {
    if (this.status.isActive()) {
      return this;
    }
    return new Fqdn(
      this.id,
      this.fqdn,
      this.description,
      FqdnStatus.active(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * FQDNを無効化する
   * @returns 新しいFqdnエンティティ（無効化済み）
   */
  public deactivate(): Fqdn {
    if (this.status.isInactive()) {
      return this;
    }
    return new Fqdn(
      this.id,
      this.fqdn,
      this.description,
      FqdnStatus.inactive(),
      this.createdAt,
      new Date(),
    );
  }

  /**
   * FQDN形式をバリデーションする
   * @param fqdn FQDN文字列
   * @throws Error バリデーション失敗時
   */
  private static validateFqdn(fqdn: string): void {
    if (!fqdn || fqdn.trim().length === 0) {
      throw new Error('FQDN cannot be empty');
    }

    // 全体の長さチェック（最大253文字）
    if (fqdn.length > 253) {
      throw new Error('FQDN must be 253 characters or less');
    }

    // 少なくとも1つのピリオドを含む必要がある（少なくとも2つのラベルが必要）
    if (!fqdn.includes('.')) {
      throw new Error('FQDN must contain at least one dot (at least 2 labels required)');
    }

    // ラベルに分割
    const labels = fqdn.split('.');

    // 各ラベルのバリデーション
    for (const label of labels) {
      // ラベルの長さチェック（最大63文字）
      if (label.length > 63) {
        throw new Error('Each label in FQDN must be 63 characters or less');
      }

      // ラベルが空でないことを確認
      if (label.length === 0) {
        throw new Error('FQDN cannot contain empty labels');
      }

      // 先頭・末尾がハイフンでないことを確認
      if (label.startsWith('-') || label.endsWith('-')) {
        throw new Error('FQDN labels cannot start or end with a hyphen');
      }

      // 使用可能な文字チェック（小文字、数字、ハイフン）
      const labelPattern = /^[a-z0-9-]+$/;
      if (!labelPattern.test(label)) {
        throw new Error('FQDN labels can only contain lowercase letters, numbers, and hyphens');
      }
    }
  }

  /**
   * 説明をバリデーションする
   * @param description 説明（オプション）
   * @throws Error バリデーション失敗時
   */
  private static validateDescription(description: string | null): void {
    if (description && description.length > 500) {
      throw new Error('Description must be 500 characters or less');
    }
  }
}
