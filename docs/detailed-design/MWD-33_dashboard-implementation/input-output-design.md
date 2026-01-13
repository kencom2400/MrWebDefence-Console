# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. ダッシュボードデータ取得

**エンドポイント**: `GET /api/v1/dashboard`

**認証**: 必須（JWT）

**リクエスト**: なし（パスパラメータ、クエリパラメータなし）

**レスポンス** (200 OK - 初期実装):
```json
{
  "userId": "test-user-id",
  "email": "user@example.com",
  "role": "SERVICE_MEMBER",
  "mfaEnabled": false,
  "ipAllowListCount": 0,
  "accountCreatedAt": "2024-01-15T10:30:00Z",
  "lastLoginAt": null,
  "loginAttemptCount": null
}
```

**注意**: 初期実装では、`lastLoginAt`と`loginAttemptCount`は常に`null`を返します。`ipAllowListCount`は、IP AllowList機能が実装されていない場合は`0`を返します。

**レスポンス例（MFA有効化済み、将来実装後）**:
```json
{
  "userId": "test-user-id",
  "email": "user@example.com",
  "role": "SERVICE_MEMBER",
  "mfaEnabled": true,
  "ipAllowListCount": 2,
  "accountCreatedAt": "2024-01-15T10:30:00Z",
  "lastLoginAt": "2024-01-20T14:25:00Z",
  "loginAttemptCount": 15
}
```

**注意**: このレスポンス例は、将来実装（ログイン統計情報の永続化、IP AllowList機能の実装）が完了した後の形式です。

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## データベーススキーマ

### 将来実装（統計情報の永続化）

```sql
CREATE TABLE dashboard_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_login_at TIMESTAMP,
  login_attempt_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_dashboard_statistics_user_id ON dashboard_statistics(user_id);
```

**制約**:
- `user_id` が削除されると、関連する統計情報も削除（CASCADE）
- `user_id` は一意（ユーザーごとに1レコード）

## バリデーションルール

### レスポンスフィールド

- `userId`: 必須、UUID形式
- `email`: 必須、メールアドレス形式
- `role`: 必須、`SERVICE_MEMBER` または `SERVICE_ADMIN`
- `mfaEnabled`: 必須、boolean
- `ipAllowListCount`: 必須、0以上の整数
- `accountCreatedAt`: 必須、ISO 8601形式の日時文字列
- `lastLoginAt`: オプション、ISO 8601形式の日時文字列、またはnull
- `loginAttemptCount`: オプション、0以上の整数、またはnull

## エラーハンドリング

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 404 | `USER_NOT_FOUND` | ユーザーが見つからない |
| 500 | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |

### エラーレスポンス形式

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## セキュリティ考慮事項

### 1. 認証・認可

- ダッシュボードAPIは認証必須（JWT）
- ユーザーは自身のダッシュボードデータのみアクセス可能
- JWTトークンから`userId`を取得し、そのユーザーのデータのみ返却

### 2. データプライバシー

- ユーザーごとのデータ分離を保証
- 他のユーザーの情報は一切返却しない
- 管理者権限でも、他のユーザーのダッシュボードデータにはアクセスできない（将来実装時は別APIを検討）

## テストデータ例

### 正常系テストデータ

```json
{
  "mfa_disabled_user": {
    "userId": "test-user-id",
    "email": "user@example.com",
    "role": "SERVICE_MEMBER",
    "mfaEnabled": false,
    "ipAllowListCount": 0,
    "accountCreatedAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": null,
    "loginAttemptCount": null
  },
  "mfa_enabled_user": {
    "userId": "test-user-id-2",
    "email": "user2@example.com",
    "role": "SERVICE_ADMIN",
    "mfaEnabled": true,
    "ipAllowListCount": 3,
    "accountCreatedAt": "2024-01-10T08:00:00Z",
    "lastLoginAt": "2024-01-20T14:25:00Z",
    "loginAttemptCount": 25
  }
}
```

### 異常系テストデータ

```json
{
  "unauthorized_request": {
    "error": "401 Unauthorized",
    "message": "Unauthorized"
  },
  "user_not_found": {
    "error": "404 Not Found",
    "message": "User not found"
  }
}
```

