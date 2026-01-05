/**
 * Password Service
 *
 * パスワードのハッシュ化と検証を行うサービス
 * bcryptを使用してパスワードを安全に処理する
 */

import * as bcrypt from 'bcrypt';

export class PasswordService {
  private readonly saltRounds: number = 10;

  /**
   * パスワードをハッシュ化する
   * @param password 平文のパスワード
   * @returns ハッシュ化されたパスワード
   */
  public async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * パスワードを検証する
   * @param password 平文のパスワード
   * @param hash ハッシュ化されたパスワード
   * @returns 一致する場合はtrue、一致しない場合はfalse
   */
  public async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}

