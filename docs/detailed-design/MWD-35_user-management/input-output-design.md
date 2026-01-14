# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. ユーザー作成

**エンドポイント**: `POST /api/v1/users`

**認証**: 必須（JWT、管理者権限: SERVICE_ADMIN）

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "role": "SERVICE_MEMBER"
}
```

**必須フィールド**:
- `email`: メールアドレス（有効なメールアドレス形式）
- `password`: パスワード（パスワードポリシーに準拠）
  - 最小長: 8文字以上
  - 最大長: 128文字以下
  - 大文字、小文字、数字、記号を含むことが推奨されます（パスワードポリシー設定により必須要件が異なる場合があります）

**オプションフィールド**:
- `role`: ユーザーロール（`SERVICE_ADMIN` または `SERVICE_MEMBER`、デフォルト: `SERVICE_MEMBER`）

**レスポンス** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "SERVICE_MEMBER",
  "mfaEnabled": false,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**エラー** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**エラー** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

### 2. ユーザー更新

**エンドポイント**: `PATCH /api/v1/users/:id`

**認証**: 必須（JWT、管理者権限: SERVICE_ADMIN）

**パスパラメータ**:
- `id`: ユーザーID（UUID）

**リクエスト**:
```json
{
  "email": "updated@example.com"
}
```

**オプションフィールド**:
- `email`: メールアドレス（有効なメールアドレス形式）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "updated@example.com",
  "role": "SERVICE_MEMBER",
  "mfaEnabled": false,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T11:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

**エラー** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

### 3. ユーザー削除

**エンドポイント**: `DELETE /api/v1/users/:id`

**認証**: 必須（JWT、管理者権限: SERVICE_ADMIN）

**パスパラメータ**:
- `id`: ユーザーID（UUID）

**レスポンス** (204 No Content):
レスポンスボディなし

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**エラー** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 4. ユーザー一覧取得・検索

**エンドポイント**: `GET /api/v1/users`

**認証**: 必須（JWT、管理者権限: SERVICE_ADMIN）

**クエリパラメータ**:
- `email`: メールアドレス（部分一致検索、オプション）
  - **注意**: 部分一致検索（`LIKE '%...%'`）は、データ量が増加した場合にパフォーマンスに影響を与える可能性があります。将来的なデータベース実装時には、PostgreSQLのtrigramインデックスなどの最適化を検討してください。
- `role`: ユーザーロール（`SERVICE_ADMIN` または `SERVICE_MEMBER`、オプション）
- `page`: ページ番号（デフォルト: 1、最小: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10、最小: 1、最大: 100）

**リクエスト例**:
```
# 一覧取得
GET /api/v1/users?page=1&limit=10

# 検索（メールアドレスとロールで絞り込み）
GET /api/v1/users?email=test&role=SERVICE_ADMIN&page=1&limit=10
```

**レスポンス** (200 OK):
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user1@example.com",
      "role": "SERVICE_MEMBER",
      "mfaEnabled": false,
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "admin@example.com",
      "role": "SERVICE_ADMIN",
      "mfaEnabled": true,
      "createdAt": "2026-01-14T09:00:00.000Z",
      "updatedAt": "2026-01-14T09:00:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "Page must be a positive number",
    "Limit must be between 1 and 100"
  ],
  "error": "Bad Request"
}
```

### 5. ユーザー詳細取得

**エンドポイント**: `GET /api/v1/users/:id`

**認証**: 必須（JWT、管理者権限: SERVICE_ADMIN）

**パスパラメータ**:
- `id`: ユーザーID（UUID）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "SERVICE_MEMBER",
  "mfaEnabled": false,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

### 6. ユーザーロール変更

**エンドポイント**: `PATCH /api/v1/users/:id/role`

**認証**: 必須（JWT、管理者権限: SERVICE_ADMIN）

**パスパラメータ**:
- `id`: ユーザーID（UUID）

**リクエスト**:
```json
{
  "role": "SERVICE_ADMIN"
}
```

**ロールの値**:
- `SERVICE_ADMIN`: サービス管理者
- `SERVICE_MEMBER`: サービスメンバー

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "SERVICE_ADMIN",
  "mfaEnabled": false,
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T12:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "role must be a valid enum value"
  ],
  "error": "Bad Request"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

## DTO定義

### CreateUserDto
- `email`: 必須、文字列、有効なメールアドレス形式
- `password`: 必須、文字列、パスワードポリシーに準拠
- `role`: オプション、`SERVICE_ADMIN` または `SERVICE_MEMBER`、デフォルト: `SERVICE_MEMBER`

### UpdateUserDto
- `email`: オプション、文字列、有効なメールアドレス形式

### UserListQueryDto（一覧取得・検索共通）
- `email`: オプション、文字列（部分一致検索）
- `role`: オプション、`SERVICE_ADMIN` または `SERVICE_MEMBER`
- `page`: オプション、正の整数、デフォルト: 1
- `limit`: オプション、1以上100以下の整数、デフォルト: 10

### ChangeUserRoleDto
- `role`: 必須、`SERVICE_ADMIN` または `SERVICE_MEMBER`

### UserResponseDto
- `id`: ユーザーID（UUID）
- `email`: メールアドレス
- `role`: ユーザーロール
- `mfaEnabled`: MFA有効化フラグ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

**注意**: パスワード（`hashedPassword`）とMFAシークレット（`mfaSecret`）はレスポンスに含めません。

### UserListResponseDto
- `users`: ユーザー配列（`UserResponseDto[]`）
- `total`: 総件数
- `page`: 現在のページ番号
- `limit`: 1ページあたりの件数

