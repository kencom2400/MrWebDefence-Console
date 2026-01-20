/**
 * ApiTokenService
 *
 * APIトークンの生成・検証ロジックを提供するサービス
 * Infrastructure層に位置し、bcryptなどの技術的な実装を担当
 */

import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export class ApiTokenService {
  private readonly saltRounds: number;
  private readonly defaultPrefix: string = 'waf_';
  private readonly secretLength: number = 64;

  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * ランダムなシークレットを生成する
   * @returns ランダムなシークレット文字列（例: 64文字のランダム文字列）
   */
  public generateSecret(): string {
    // URL-safe base64エンコードを使用（例: 64文字）
    return randomBytes(this.secretLength).toString('base64url');
  }

  /**
   * シークレットをハッシュ化する（bcrypt）
   * @param secret シークレット（平文）
   * @returns ハッシュ化されたシークレット
   */
  public async hashToken(secret: string): Promise<string> {
    if (!secret || secret.trim().length === 0) {
      throw new Error('Secret cannot be empty');
    }
    return await bcrypt.hash(secret, this.saltRounds);
  }

  /**
   * シークレットを検証する
   * @param secret シークレット（平文）
   * @param tokenHash ハッシュ化されたシークレット
   * @returns 一致する場合はtrue、一致しない場合はfalse
   */
  public async verifyToken(secret: string, tokenHash: string): Promise<boolean> {
    if (!secret || secret.trim().length === 0) {
      return false;
    }
    if (!tokenHash || tokenHash.trim().length === 0) {
      return false;
    }
    return await bcrypt.compare(secret, tokenHash);
  }

  /**
   * フルトークンからプレフィックスを抽出する
   * @param fullToken フルトークン（例: "waf_xxxxx..."）
   * @returns プレフィックス（例: "waf_"）
   */
  public extractPrefix(fullToken: string): string {
    if (!fullToken || fullToken.trim().length === 0) {
      throw new Error('Full token cannot be empty');
    }

    // アンダースコアで分割し、最初の部分をプレフィックスとする
    const parts = fullToken.split('_');
    if (parts.length < 2) {
      throw new Error('Invalid token format: prefix not found');
    }

    // 最初の部分とアンダースコアを結合してプレフィックスを作成
    return `${parts[0]}_`;
  }

  /**
   * フルトークンからシークレット部分を抽出する
   * @param fullToken フルトークン（例: "waf_xxxxx..."）
   * @param prefix プレフィックス（例: "waf_"）
   * @returns シークレット部分（例: "xxxxx..."）
   */
  public extractSecret(fullToken: string, prefix: string): string {
    if (!fullToken || fullToken.trim().length === 0) {
      throw new Error('Full token cannot be empty');
    }
    if (!prefix || prefix.trim().length === 0) {
      throw new Error('Prefix cannot be empty');
    }

    if (!fullToken.startsWith(prefix)) {
      throw new Error('Full token does not start with the specified prefix');
    }

    // プレフィックス以降の部分をシークレットとして抽出
    const secret = fullToken.substring(prefix.length);
    if (secret.length === 0) {
      throw new Error('Secret part is empty');
    }

    return secret;
  }

  /**
   * プレフィックスとシークレットを結合してフルトークンを作成する
   * @param prefix プレフィックス（例: "waf_"）
   * @param secret シークレット（例: "xxxxx..."）
   * @returns フルトークン（例: "waf_xxxxx..."）
   */
  public buildFullToken(prefix: string, secret: string): string {
    if (!prefix || prefix.trim().length === 0) {
      throw new Error('Prefix cannot be empty');
    }
    if (!secret || secret.trim().length === 0) {
      throw new Error('Secret cannot be empty');
    }

    // プレフィックスの末尾にアンダースコアがない場合は追加
    const normalizedPrefix = prefix.endsWith('_') ? prefix : `${prefix}_`;

    return `${normalizedPrefix}${secret}`;
  }

  /**
   * デフォルトのプレフィックスを取得する
   * @returns デフォルトのプレフィックス（例: "waf_"）
   */
  public getDefaultPrefix(): string {
    return this.defaultPrefix;
  }
}
