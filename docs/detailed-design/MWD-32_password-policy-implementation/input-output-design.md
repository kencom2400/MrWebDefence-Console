# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. パスワード変更

**エンドポイント**: `POST /api/v1/auth/password/change`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewPassword456@"
}
```

**バリデーション**:
- `currentPassword`: 必須、文字列、最小8文字、最大128文字
- `newPassword`: 必須、文字列、最小8文字、最大128文字、パスワードポリシーに準拠

**レスポンス** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**エラー** (400 Bad Request - パスワードポリシー違反):
```json
{
  "statusCode": 400,
  "message": "Password does not meet policy requirements",
  "error": "Bad Request",
  "errorCode": "PASSWORD_POLICY_VIOLATION",
  "errors": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one symbol"
  ]
}
```

**エラー** (400 Bad Request - パスワード再利用):
```json
{
  "statusCode": 400,
  "message": "Password has been used recently. Please choose a different password.",
  "error": "Bad Request",
  "errorCode": "PASSWORD_REUSED"
}
```

**エラー** (401 Unauthorized - 現在のパスワードが間違っている):
```json
{
  "statusCode": 401,
  "message": "Current password is incorrect",
  "error": "Unauthorized",
  "errorCode": "INVALID_CURRENT_PASSWORD"
}
```

**エラー** (401 Unauthorized - 認証が必要):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 2. パスワード強度チェック

**エンドポイント**: `POST /api/v1/auth/password/validate`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "password": "NewPassword456@"
}
```

**バリデーション**:
- `password`: 必須、文字列、最小8文字、最大128文字

**レスポンス** (200 OK - 有効なパスワード):
```json
{
  "isValid": true,
  "errors": [],
  "strengthScore": 85,
  "isReused": false
}
```

**レスポンス** (200 OK - 無効なパスワード):
```json
{
  "isValid": false,
  "errors": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one symbol"
  ],
  "strengthScore": 45,
  "isReused": false
}
```

**レスポンス** (200 OK - 再利用されたパスワード):
```json
{
  "isValid": false,
  "errors": [],
  "strengthScore": 85,
  "isReused": true,
  "message": "Password has been used recently"
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 3. パスワードポリシー設定取得

**エンドポイント**: `GET /api/v1/auth/password/policy`

**認証**: 必須（JWT）

**レスポンス** (200 OK):
```json
{
  "minLength": 8,
  "maxLength": 128,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumbers": true,
  "requireSymbols": true,
  "historyCount": 5
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## データベーススキーマ

### password_histories テーブル（将来実装）

```sql
CREATE TABLE password_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL, -- bcryptハッシュ
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_password_histories_user_id_created_at (user_id, created_at DESC)
);
```

**注意**: `user_id`と`created_at`の複合インデックスにより、ユーザーごとの最新N個のパスワード履歴を効率的に取得できます。多くのデータベース（PostgreSQLやMySQLなど）では、複合インデックスの先頭カラム（この場合は`user_id`）に対するクエリでも、その複合インデックスが効率的に利用されます。したがって、`user_id`カラムの個別インデックスは冗長であり、削除してもパフォーマンスに影響はありません。

**制約**:
- `user_id` が削除されると、関連するパスワード履歴も削除（CASCADE）
- パスワード履歴は、ユーザーごとに最新N個のみを保持（古い履歴は自動削除）

## バリデーションルール

### パスワード複雑さ要件

1. **最小長**: 8文字以上（設定可能、デフォルト: 8）
2. **最大長**: 128文字以下（設定可能、デフォルト: 128）
3. **必須文字種**:
   - 大文字（A-Z）: 1文字以上（設定可能、デフォルト: 必須）
   - 小文字（a-z）: 1文字以上（設定可能、デフォルト: 必須）
   - 数字（0-9）: 1文字以上（設定可能、デフォルト: 必須）
   - 記号（!@#$%^&*()_+-=[]{}|;:,.<>?）: 1文字以上（設定可能、デフォルト: 必須）

### パスワード強度スコア

- **0-20**: 非常に弱い（最小要件を満たさない）
- **21-40**: 弱い（最小要件のみを満たす）
- **41-60**: 中程度（複数の文字種を含む）
- **61-80**: 強い（長く、複数の文字種を含む）
- **81-100**: 非常に強い（長く、すべての文字種を含み、一般的なパターンを回避）

### パスワード履歴

- 過去N個のパスワードをハッシュ化して保存（設定可能、デフォルト: 5）
- 新しいパスワードが過去のパスワードと一致する場合は拒否
- パスワード履歴はハッシュ化して保存（bcrypt）

## エラーハンドリング

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 400 | `INVALID_PASSWORD_FORMAT` | 無効なパスワード形式 |
| 400 | `PASSWORD_TOO_SHORT` | パスワードが短すぎる |
| 400 | `PASSWORD_TOO_LONG` | パスワードが長すぎる |
| 400 | `PASSWORD_MISSING_UPPERCASE` | 大文字が含まれていない |
| 400 | `PASSWORD_MISSING_LOWERCASE` | 小文字が含まれていない |
| 400 | `PASSWORD_MISSING_NUMBERS` | 数字が含まれていない |
| 400 | `PASSWORD_MISSING_SYMBOLS` | 記号が含まれていない |
| 400 | `PASSWORD_REUSED` | 過去のパスワードが再利用されている |
| 400 | `PASSWORD_POLICY_VIOLATION` | パスワードポリシーに違反 |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 401 | `INVALID_CURRENT_PASSWORD` | 現在のパスワードが間違っている |
| 404 | `USER_NOT_FOUND` | ユーザーが見つからない |

### エラーレスポンス形式

```json
{
  "statusCode": 400,
  "message": "Password does not meet policy requirements",
  "error": "Bad Request",
  "errorCode": "PASSWORD_POLICY_VIOLATION",
  "errors": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one symbol"
  ]
}
```

## セキュリティ考慮事項

### 1. パスワードハッシュ化

- パスワードはbcryptでハッシュ化して保存（既存実装を継続）
- パスワード履歴もbcryptでハッシュ化して保存
- ソルトラウンド数: 10（設定可能）

### 2. タイミング攻撃対策

- パスワード検証時のタイミング攻撃を防ぐため、常にハッシュ化処理を実行
- エラーメッセージは詳細すぎないようにする（ユーザー存在の推測を防ぐ）

### 3. パスワード履歴の管理

- パスワード履歴は、ユーザーごとに最新N個のみを保持
- 古いパスワード履歴は自動的に削除（実装時に検討）

## テストデータ例

### 正常系テストデータ

```json
{
  "valid_passwords": [
    "Password123!",
    "MySecureP@ssw0rd",
    "Complex#Pass2024",
    "Str0ng!Passw0rd"
  ],
  "policy": {
    "minLength": 8,
    "maxLength": 128,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSymbols": true,
    "historyCount": 5
  }
}
```

### 異常系テストデータ

```json
{
  "invalid_passwords": [
    {
      "password": "short",
      "error": "PASSWORD_TOO_SHORT"
    },
    {
      "password": "nouppercase123!",
      "error": "PASSWORD_MISSING_UPPERCASE"
    },
    {
      "password": "NOLOWERCASE123!",
      "error": "PASSWORD_MISSING_LOWERCASE"
    },
    {
      "password": "NoNumbers!",
      "error": "PASSWORD_MISSING_NUMBERS"
    },
    {
      "password": "NoSymbols123",
      "error": "PASSWORD_MISSING_SYMBOLS"
    }
  ]
}
```

