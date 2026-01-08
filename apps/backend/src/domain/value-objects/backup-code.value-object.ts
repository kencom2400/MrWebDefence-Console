/**
 * BackupCode Value Object
 *
 * バックアップコードの値オブジェクト
 * ドメイン層の最内層に位置し、外部に依存しない
 * 技術的な詳細（生成アルゴリズム、ハッシュ化）は含まない
 */

export class BackupCode {
  private readonly code: string;

  private constructor(code: string) {
    this.code = code;
  }

  /**
   * バックアップコードを作成する
   * @param code バックアップコード（例: "ABCD-1234"）
   * @returns BackupCode Value Object
   * @throws Error バリデーション失敗時
   */
  public static create(code: string): BackupCode {
    if (!code || code.trim().length === 0) {
      throw new Error('Backup code cannot be empty');
    }

    // バックアップコードの形式バリデーション: 8文字の英数字（ハイフン区切り）
    const backupCodePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!backupCodePattern.test(code)) {
      throw new Error('Backup code must be in the format "XXXX-XXXX" (uppercase alphanumeric)');
    }

    return new BackupCode(code);
  }

  /**
   * 既存のバックアップコードを再構築する
   * @param code バックアップコード
   * @returns BackupCode Value Object
   */
  public static reconstruct(code: string): BackupCode {
    return new BackupCode(code);
  }

  /**
   * バックアップコード値を取得する
   * @returns バックアップコード値
   */
  public getValue(): string {
    return this.code;
  }

  /**
   * 等価性チェック
   * @param other 比較対象
   * @returns 等しい場合true
   */
  public equals(other: BackupCode): boolean {
    return this.code === other.code;
  }
}

