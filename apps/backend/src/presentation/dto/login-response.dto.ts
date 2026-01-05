/**
 * Login Response DTO
 *
 * ログインレスポンスのデータ転送オブジェクト
 */

export class LoginResponseDto {
  public accessToken!: string;
  public tokenType!: string;
  public expiresIn!: number;
}

