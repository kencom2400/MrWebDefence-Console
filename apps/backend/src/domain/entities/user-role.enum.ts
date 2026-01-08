/**
 * User Role Enum
 *
 * ユーザーのロール（役割）定義
 */
export enum UserRole {
  /**
   * サービス管理者
   * システム全体の管理権限を持つ
   */
  SERVICE_ADMIN = 'SERVICE_ADMIN',

  /**
   * サービスメンバー
   * 一般的な利用権限を持つ
   */
  SERVICE_MEMBER = 'SERVICE_MEMBER',
}

