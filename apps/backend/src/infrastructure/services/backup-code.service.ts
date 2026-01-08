/**
 * BackupCodeService
 *
 * バックアップコードの技術的な処理を行うサービス
 * Infrastructure層に位置し、外部ライブラリに依存する
 * 生成アルゴリズム、ハッシュ化、検証を担当
 */

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

@Injectable()
export class BackupCodeService {
  private readonly saltRounds: number = 10;
  private readonly codeLength: number = 8; // 8文字（4文字-4文字の形式）
  private readonly codeCount: number = 10; // 10個生成

  /**
   * バックアップコードを生成する
   * @returns バックアップコードの配列（例: ["ABCD-1234", "EFGH-5678", ...]）
   */
  public generateCodes(): string[] {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const partLength = this.codeLength / 2; // 4文字

    for (let i = 0; i < this.codeCount; i++) {
      let code = '';
      // 4文字を生成
      for (let j = 0; j < partLength; j++) {
        code += characters.charAt(randomInt(characters.length));
      }
      code += '-';
      // さらに4文字を生成
      for (let j = 0; j < partLength; j++) {
        code += characters.charAt(randomInt(characters.length));
      }
      codes.push(code);
    }

    return codes;
  }

  /**
   * バックアップコードをハッシュ化する
   * @param code バックアップコード
   * @returns ハッシュ化されたコード（bcrypt）
   */
  public async hash(code: string): Promise<string> {
    return await bcrypt.hash(code, this.saltRounds);
  }

  /**
   * バックアップコードを検証する（ハッシュ比較）
   * @param code バックアップコード（平文）
   * @param hash ハッシュ化されたコード
   * @returns 検証成功時true、失敗時false
   */
  public async verify(code: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(code, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * 複数のバックアップコードをハッシュ化する
   * @param codes バックアップコードの配列
   * @returns ハッシュ化されたコードの配列
   */
  public async hashCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map((code) => this.hash(code)));
  }

  /**
   * 生成するコード数を取得する
   * @returns コード数
   */
  public getCodeCount(): number {
    return this.codeCount;
  }
}
