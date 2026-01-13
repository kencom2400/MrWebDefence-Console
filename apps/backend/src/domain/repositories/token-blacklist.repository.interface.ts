export interface ITokenBlacklistRepository {
  /**
   * トークンをブラックリストに追加する
   * @param token JWTトークン
   * @param expiresAt 有効期限（Unixタイムスタンプ）
   */
  add(token: string, expiresAt: number): Promise<void>;

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  isBlacklisted(token: string): Promise<boolean>;
}
  /**
   * トークンをブラックリストに追加する
   * @param token JWTトークン
   * @param expiresAt 有効期限（Unixタイムスタンプ）
   */
  add(token: string, expiresAt: number): Promise<void>;

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  isBlacklisted(token: string): Promise<boolean>;
}
  /**
   * トークンをブラックリストに追加する
   * @param token JWTトークン
   * @param expiresAt 有効期限（Unixタイムスタンプ）
   */
  add(token: string, expiresAt: number): Promise<void>;

  /**
   * トークンがブラックリストに含まれているか確認する
   * @param token JWTトークン
   * @returns ブラックリストに含まれている場合はtrue
   */
  isBlacklisted(token: string): Promise<boolean>;
}
