# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. MFAセットアップ開始

**エンドポイント**: `POST /api/v1/auth/mfa/setup`

**認証**: 必須（JWT）

**リクエスト**:
```json
{}
```

**レスポンス** (200 OK):
```json
{
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "tempToken": "mfa-setup-temp-token-xyz123",
  "expiresIn": 300
}
```

**注意**: バックアップコードはこの時点では生成されません。検証成功後に返却されます。

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**エラー** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "MFA is already enabled"
}
```

### 2. MFAセットアップ検証

**エンドポイント**: `POST /api/v1/auth/mfa/verify-setup`

**認証**: 不要（一時トークンを使用）

**リクエスト**:
```json
{
  "tempToken": "mfa-setup-temp-token-xyz123",
  "code": "123456"
}
```

**レスポンス** (200 OK):
```json
{
  "message": "MFA has been enabled successfully",
  "backupCodes": [
    "ABCD-1234",
    "EFGH-5678",
    "IJKL-9012",
    "MNOP-3456",
    "QRST-7890",
    "UVWX-1357",
    "YZAB-2468",
    "CDEF-3690",
    "GHIJ-4701",
    "KLMN-5812"
  ],
  "warning": "These backup codes can only be viewed once. Please save them securely."
}
```

**注意**: バックアップコードは検証成功時に生成され、このレスポンスで一度だけ返却されます。

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["code must be a 6-digit number"]
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid TOTP code"
}
```

**エラー** (410 Gone):
```json
{
  "statusCode": 410,
  "message": "Temporary token has expired"
}
```

### 3. ログイン時のMFA検証

**エンドポイント**: `POST /api/v1/auth/mfa/verify`

**認証**: 不要（一時トークンを使用）

**リクエスト**:
```json
{
  "tempToken": "login-mfa-temp-token-abc456",
  "code": "123456",
  "type": "TOTP"
}
```

またはバックアップコードの場合:
```json
{
  "tempToken": "login-mfa-temp-token-abc456",
  "code": "ABCD-1234",
  "type": "BACKUP"
}
```

**レスポンス** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1800
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid MFA code"
}
```

### 4. MFA無効化

**エンドポイント**: `POST /api/v1/auth/mfa/disable`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "password": "user-password"
}
```

**レスポンス** (200 OK):
```json
{
  "message": "MFA has been disabled successfully"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["password should not be empty"]
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid password"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "MFA is not enabled"
}
```

### 5. バックアップコード一覧取得

**エンドポイント**: `GET /api/v1/auth/mfa/backup-codes`

**認証**: 必須（JWT）

**レスポンス** (200 OK):
```json
{
  "backupCodes": [
    {
      "id": "uuid-1",
      "usedAt": null,
      "createdAt": "2026-01-08T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "usedAt": "2026-01-08T11:00:00Z",
      "createdAt": "2026-01-08T10:00:00Z"
    }
  ],
  "totalCount": 10,
  "unusedCount": 9,
  "usedCount": 1
}
```

**注意**: 
- 実際のコード値は返却されません（セキュリティ上の理由）
- `usedAt` が `null` の場合は未使用、値がある場合は使用済みと判定
- `used` フラグは冗長のため削除（`usedAt` の有無で判定）

### 6. バックアップコード再生成

**エンドポイント**: `POST /api/v1/auth/mfa/backup-codes/regenerate`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "password": "user-password"
}
```

**レスポンス** (200 OK):
```json
{
  "message": "Backup codes have been regenerated successfully",
  "backupCodes": [
    "WXYZ-9876",
    "STUV-5432",
    "QRST-1098",
    "MNOP-7654",
    "KLMN-3210",
    "IJKL-9876",
    "GHIJ-5432",
    "EFGH-1098",
    "CDEF-7654",
    "ABYZ-3210"
  ],
  "warning": "Previous backup codes have been invalidated. These new codes can only be viewed once. Please save them securely."
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["password should not be empty"]
}
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid password"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "MFA is not enabled"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "MFA is not enabled"
}
```

### 7. ログインAPI（修正版）

**エンドポイント**: `POST /api/v1/auth/login`

**認証**: 不要（`@Public()`）

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス** (200 OK) - MFA無効な場合:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1800
}
```

**レスポンス** (200 OK) - MFA有効な場合:
```json
{
  "mfaRequired": true,
  "tempToken": "login-mfa-temp-token-abc456",
  "expiresIn": 300
}
```

## データベーススキーマ変更

### users テーブル

| カラム名 | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | --- | --- | --- |
| mfa_enabled | boolean | Yes | `false` | MFAが有効かどうか |
| mfa_secret | string (encrypted) | No | `NULL` | MFAシークレット（暗号化済み） |

### backup_codes テーブル（新規作成）

| カラム名 | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | --- | --- | --- |
| id | string (UUID) | Yes | - | プライマリキー |
| user_id | string (UUID) | Yes | - | ユーザーID（外部キー） |
| code_hash | string | Yes | - | バックアップコードのハッシュ（bcrypt） |
| used_at | timestamp | No | `NULL` | 使用日時（NULLの場合は未使用、値がある場合は使用済み） |
| created_at | timestamp | Yes | `CURRENT_TIMESTAMP` | 作成日時 |

**設計方針**: `used` フラグは冗長のため削除。`used_at` が NULL かどうかで使用状態を判定することで、データの整合性を保ち、ストレージを節約する。

## バリデーションルール

### MFA検証コード

- **TOTPコード**: 6桁の数字（`/^\d{6}$/`）
- **バックアップコード**: 8文字の英数字（`/^[A-Z0-9]{4}-[A-Z0-9]{4}$/`）

### 一時トークン

- 有効期限: 5分（300秒）
- 形式: JWTまたはランダム文字列
- 使用後: 即座に無効化

## セキュリティ考慮事項

### レート制限

- MFA検証API: 5回/分（ブルートフォース攻撃対策）
- セットアップ検証: 10回/分

### エラーメッセージ

- コードが無効な場合でも、具体的な理由（期限切れ、形式不正など）は返さない
- 汎用的なエラーメッセージ（"Invalid MFA code"）を返す

### 一時トークン

- セットアップ用とログイン用で異なる形式を使用
- 使用後は即座に無効化
- 短い有効期限（5分）を設定

