# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. IP AllowList追加

**エンドポイント**: `POST /api/v1/auth/ip-allowlist`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "ipAddress": "192.168.1.1",
  "description": "Home office"
}
```

またはCIDR記法:
```json
{
  "ipAddress": "192.168.1.0/24",
  "description": "Office network"
}
```

IPv6もサポート:
```json
{
  "ipAddress": "2001:db8::1",
  "description": "IPv6 address"
}
```

**バリデーション**:
- `ipAddress`: 必須、文字列、有効なIPv4/IPv6アドレスまたはCIDR記法
- `description`: オプション、文字列、最大255文字

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ipAddress": "192.168.1.1",
  "description": "Home office",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**エラー** (400 Bad Request - 無効なIPアドレス):
```json
{
  "statusCode": 400,
  "message": "Invalid IP address format",
  "error": "Bad Request"
}
```

**エラー** (409 Conflict - 重複):
```json
{
  "statusCode": 409,
  "message": "IP address already exists in allowlist",
  "error": "Conflict"
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

### 2. IP AllowList削除

**エンドポイント**: `DELETE /api/v1/auth/ip-allowlist/:id`

**認証**: 必須（JWT）

**パスパラメータ**:
- `id`: UUID形式のIP AllowList ID

**レスポンス** (204 No Content):
```
(空のボディ)
```

**注意**: `DELETE`操作が成功し、クライアントに返すべきコンテンツがない場合、ステータスコード`204 No Content`と空のボディを返すのが一般的なRESTのプラクティスです。これにより、クライアントはレスポンスボディをパースする必要がなくなり、処理がシンプルになります。

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "IP allowlist entry not found",
  "error": "Not Found"
}
```

**エラー** (403 Forbidden - 他のユーザーのIP AllowList):
```json
{
  "statusCode": 403,
  "message": "Access denied",
  "error": "Forbidden"
}
```

### 3. IP AllowList一覧取得

**エンドポイント**: `GET /api/v1/auth/ip-allowlist`

**認証**: 必須（JWT）

**レスポンス** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ipAddress": "192.168.1.1",
    "description": "Home office",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "ipAddress": "192.168.1.0/24",
    "description": "Office network",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

**注意**: ページネーションを導入する場合は、以下の形式に変更します：
```json
{
  "ipAllowLists": [...],
  "totalCount": 2,
  "limit": 50,
  "offset": 0
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

### 4. ログイン（IP検証統合）

**エンドポイント**: `POST /api/v1/auth/login`

**認証**: 不要（Public）

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス** (200 OK - IP検証成功):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 1800
}
```

**エラー** (403 Forbidden - IP検証失敗):
```json
{
  "statusCode": 403,
  "message": "Access denied from this IP address",
  "error": "Forbidden"
}
```

**エラー** (401 Unauthorized - 認証失敗):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

## データベーススキーマ（将来実装）

### ip_allowlists テーブル

```sql
CREATE TABLE ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL, -- IPv4またはIPv6、CIDR記法も可（最大45文字はIPv6用）
  description VARCHAR(255), -- オプション: IPアドレスの説明
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ip_address)
);

**注意**: `UNIQUE(user_id, ip_address)`制約により、`(user_id, ip_address)`の複合インデックスが既に作成されます。多くのデータベース（PostgreSQLやMySQLなど）では、複合インデックスの先頭カラム（この場合は`user_id`）に対するクエリでも、その複合インデックスが効率的に利用されます。したがって、`user_id`カラムの個別インデックスは冗長であり、削除してもパフォーマンスに影響はありません。IPアドレスの重複チェックや検索は、通常`user_id`とセットで行われるため、この複合インデックスで効率的に処理できます。

インデックスを削除することで、以下のメリットがあります：
- ストレージ使用量の削減
- 書き込み（INSERT/UPDATE/DELETE）時のインデックス更新コストの削減
- スキーマの簡素化
```

**制約**:
- `user_id` と `ip_address` の組み合わせは一意
- `user_id` が削除されると、関連するIP AllowListも削除（CASCADE）

## バリデーションルール

### IPアドレス形式

1. **IPv4**: `192.168.1.1` 形式
   - 各オクテットは0-255の範囲
   - 4つのオクテットをドットで区切る

2. **IPv6**: `2001:db8::1` 形式
   - RFC 4291に準拠
   - 省略記法（`::`）をサポート

3. **CIDR記法**: `192.168.1.0/24` 形式
   - IPv4: プレフィックス長は0-32
   - IPv6: プレフィックス長は0-128
   - スラッシュ（`/`）で区切る

### 制限事項

- ユーザーごとのIP AllowList数: 最大50件（設定可能）
- 説明文の最大長: 255文字
- 過度に広いCIDR範囲（例: `0.0.0.0/0`）は警告を表示（将来的には制限）

## エラーハンドリング

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 400 | `INVALID_IP_FORMAT` | 無効なIPアドレス形式 |
| 400 | `INVALID_CIDR_FORMAT` | 無効なCIDR記法 |
| 400 | `IP_ALLOWLIST_LIMIT_EXCEEDED` | IP AllowList数制限超過 |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 403 | `IP_ACCESS_DENIED` | IPアドレスからのアクセス拒否 |
| 404 | `IP_ALLOWLIST_NOT_FOUND` | IP AllowListが見つからない |
| 409 | `IP_ADDRESS_DUPLICATE` | IPアドレスが重複 |

### エラーレスポンス形式

```json
{
  "statusCode": 400,
  "message": "Invalid IP address format",
  "error": "Bad Request",
  "errorCode": "INVALID_IP_FORMAT"
}
```

## セキュリティ考慮事項

### IPアドレス抽出

リバースプロキシ（Nginx、CloudFlare等）経由の場合:

```typescript
// X-Forwarded-For ヘッダーから取得
const forwardedFor = request.headers['x-forwarded-for'];
const clientIp = forwardedFor 
  ? forwardedFor.split(',')[0].trim() 
  : request.ip;
```

**注意**: 信頼できるプロキシの設定が必要。複数の `X-Forwarded-For` ヘッダーがある場合、最初のIPアドレスを使用（クライアントに最も近いIP）。

### デフォルト動作

- IP AllowListが空の場合: すべてのIPアドレスからのアクセスを許可（後方互換性）
- IP AllowListが設定されている場合: 許可されたIPアドレスのみアクセス可能

## テストデータ例

### 正常系テストデータ

```json
{
  "ipv4_single": "192.168.1.1",
  "ipv4_cidr": "192.168.1.0/24",
  "ipv6_single": "2001:db8::1",
  "ipv6_cidr": "2001:db8::/32",
  "private_range": "10.0.0.0/8",
  "description": "Test IP address"
}
```

### 異常系テストデータ

```json
{
  "invalid_ipv4": "999.999.999.999",
  "invalid_format": "not-an-ip",
  "invalid_cidr": "192.168.1.0/99",
  "empty_string": "",
  "null_value": null
}
```

