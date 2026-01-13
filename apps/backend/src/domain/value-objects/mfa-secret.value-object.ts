/**
 * MfaSecret Value Object
 *
 * MFAシークレットの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class MfaSecret {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * MFAシークレットを作成する
   * @param value シークレット値（Base32エンコードされた文字列）
   * @returns MfaSecret Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(value: string): MfaSecret {
    if (!value || value.trim().length === 0) {
      throw new Error('MFA secret cannot be empty');
    }

    // Base32形式のバリデーション（A-Z, 2-7のみ）
    const base32Pattern = /^[A-Z2-7]+=*$/;
    if (!base32Pattern.test(value)) {
      throw new Error('MFA secret must be a valid Base32 string');
    }

    return new MfaSecret(value);
  }

  /**
   * 既存のMFAシークレットを再構築する
   * @param value シークレット値
   * @returns MfaSecret Value Object
   */
  public static reconstruct(value: string): MfaSecret {
    return new MfaSecret(value);
  }

  /**
   * シークレット値を取得する
   * @returns シークレット値
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: MfaSecret): boolean {
    return this.value === other.value;
  }
}
 * MfaSecret Value Object
 *
 * MFAシークレットの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class MfaSecret {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * MFAシークレットを作成する
   * @param value シークレット値（Base32エンコードされた文字列）
   * @returns MfaSecret Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(value: string): MfaSecret {
    if (!value || value.trim().length === 0) {
      throw new Error('MFA secret cannot be empty');
    }

    // Base32形式のバリデーション（A-Z, 2-7のみ）
    const base32Pattern = /^[A-Z2-7]+=*$/;
    if (!base32Pattern.test(value)) {
      throw new Error('MFA secret must be a valid Base32 string');
    }

    return new MfaSecret(value);
  }

  /**
   * 既存のMFAシークレットを再構築する
   * @param value シークレット値
   * @returns MfaSecret Value Object
   */
  public static reconstruct(value: string): MfaSecret {
    return new MfaSecret(value);
  }

  /**
   * シークレット値を取得する
   * @returns シークレット値
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: MfaSecret): boolean {
    return this.value === other.value;
  }
}
 * MfaSecret Value Object
 *
 * MFAシークレットの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 */

export class MfaSecret {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * MFAシークレットを作成する
   * @param value シークレット値（Base32エンコードされた文字列）
   * @returns MfaSecret Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(value: string): MfaSecret {
    if (!value || value.trim().length === 0) {
      throw new Error('MFA secret cannot be empty');
    }

    // Base32形式のバリデーション（A-Z, 2-7のみ）
    const base32Pattern = /^[A-Z2-7]+=*$/;
    if (!base32Pattern.test(value)) {
      throw new Error('MFA secret must be a valid Base32 string');
    }

    return new MfaSecret(value);
  }

  /**
   * 既存のMFAシークレットを再構築する
   * @param value シークレット値
   * @returns MfaSecret Value Object
   */
  public static reconstruct(value: string): MfaSecret {
    return new MfaSecret(value);
  }

  /**
   * シークレット値を取得する
   * @returns シークレット値
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: MfaSecret): boolean {
    return this.value === other.value;
  }
}
