# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. FQDN作成

**エンドポイント**: `POST /api/v1/fqdns`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "fqdn": "example.com",
  "description": "サンプルドメイン"
}
```

**必須フィールド**:
- `fqdn`: FQDN文字列（有効なFQDN形式、1文字以上253文字以下）

**オプションフィールド**:
- `description`: 説明（文字列、最大500文字）

**FQDN形式のバリデーション**:
- ドメイン名の形式に準拠（RFC 1123）
- 小文字、数字、ハイフン、ピリオドを含む（大文字を含むFQDNは受け入れ、内部で小文字に正規化して扱う）
- 先頭・末尾はハイフン不可
- 各ラベルは63文字以下
- 全体は253文字以下

**レスポンス** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fqdn": "example.com",
  "description": "サンプルドメイン",
  "status": "ACTIVE",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "fqdn should not be empty",
    "fqdn must be a valid FQDN"
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

**エラー** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "FQDN already exists"
}
```

### 2. FQDN更新

**エンドポイント**: `PATCH /api/v1/fqdns/:id`

**認証**: 必須（JWT）

**パスパラメータ**:
- `id`: FQDN ID（UUID）

**リクエスト**:
```json
{
  "fqdn": "example.org",
  "description": "更新されたサンプルドメイン"
}
```

**すべてのフィールドがオプション**（更新したいフィールドのみ指定）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fqdn": "example.org",
  "description": "更新されたサンプルドメイン",
  "status": "ACTIVE",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T11:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "fqdn must be a valid FQDN"
  ],
  "error": "Bad Request"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "FQDN not found"
}
```

**エラー** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "FQDN already exists"
}
```

### 3. FQDN削除

**エンドポイント**: `DELETE /api/v1/fqdns/:id`

**認証**: 必須（JWT、管理者権限推奨）

**パスパラメータ**:
- `id`: FQDN ID（UUID）

**レスポンス** (204 No Content):
レスポンスボディなし

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "FQDN not found"
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

### 4. FQDN一覧取得・検索

**エンドポイント**: `GET /api/v1/fqdns`

**認証**: 必須（JWT）

**クエリパラメータ**:
- `fqdn`: FQDN文字列（部分一致検索、オプション）
- `status`: ステータス（`FqdnStatusEnum.ACTIVE` または `FqdnStatusEnum.INACTIVE`、オプション）
- `page`: ページ番号（デフォルト: 1、最小: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10、最小: 1、最大: 100）

**リクエスト例**:
```
# 一覧取得
GET /api/v1/fqdns?page=1&limit=10

# 検索（FQDNとステータスで絞り込み）
GET /api/v1/fqdns?fqdn=example&status=ACTIVE&page=1&limit=10
```

**レスポンス** (200 OK):
```json
{
  "fqdns": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fqdn": "example.com",
      "description": "サンプルドメイン",
      "status": "ACTIVE",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "fqdn": "test.example.com",
      "description": null,
      "status": "ACTIVE",
      "createdAt": "2026-01-14T11:00:00.000Z",
      "updatedAt": "2026-01-14T11:00:00.000Z"
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
    "page must be a positive number",
    "limit must be between 1 and 100"
  ],
  "error": "Bad Request"
}
```

### 5. FQDN詳細取得

**エンドポイント**: `GET /api/v1/fqdns/:id`

**認証**: 必須（JWT）

**パスパラメータ**:
- `id`: FQDN ID（UUID）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fqdn": "example.com",
  "description": "サンプルドメイン",
  "status": "ACTIVE",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T10:00:00.000Z"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "FQDN not found"
}
```

### 6. FQDNステータス更新

**エンドポイント**: `PATCH /api/v1/fqdns/:id/status`

**認証**: 必須（JWT、管理者権限推奨）

**パスパラメータ**:
- `id`: FQDN ID（UUID）

**リクエスト**:
```json
{
  "status": "INACTIVE"
}
```

**ステータス値**:
- `ACTIVE`: 有効
- `INACTIVE`: 無効

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fqdn": "example.com",
  "description": "サンプルドメイン",
  "status": "INACTIVE",
  "createdAt": "2026-01-14T10:00:00.000Z",
  "updatedAt": "2026-01-14T12:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "status must be one of the following values: ACTIVE, INACTIVE"
  ],
  "error": "Bad Request"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "FQDN not found"
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

## データ型定義

### FqdnStatusEnum
```typescript
enum FqdnStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### FqdnResponseDto
```typescript
interface FqdnResponseDto {
  id: string;              // UUID
  fqdn: string;           // FQDN文字列
  description?: string;   // 説明（オプション）
  status: FqdnStatusEnum;     // ステータス
  createdAt: Date;        // 作成日時
  updatedAt: Date;        // 更新日時
}
```

### FqdnListResponseDto
```typescript
interface FqdnListResponseDto {
  fqdns: FqdnResponseDto[];
  total: number;          // 総件数
  page: number;           // 現在のページ番号
  limit: number;          // 1ページあたりの件数
}
```

## バリデーションルール

### CreateFqdnDto
- `fqdn`: 必須、文字列、有効なFQDN形式、1文字以上253文字以下
- `description`: オプション、文字列、最大500文字

### UpdateFqdnDto
- すべてのフィールドがオプション
- 指定されたフィールドのみ更新される
- バリデーションルールはCreateFqdnDtoと同じ

### FqdnListQueryDto（一覧取得・検索共通）
- `fqdn`: オプション、文字列（部分一致検索）
- `status`: オプション、`ACTIVE` または `INACTIVE`
- `page`: オプション、正の整数、デフォルト: 1
- `limit`: オプション、1以上100以下の整数、デフォルト: 10

### UpdateFqdnStatusDto
- `status`: 必須、`FqdnStatusEnum.ACTIVE` または `FqdnStatusEnum.INACTIVE`

## FQDN形式のバリデーション詳細

FQDNは以下のルールに従う必要があります：

1. **全体の長さ**: 最大253文字
2. **ラベルの長さ**: 各ラベルは最大63文字
3. **使用可能な文字**: 小文字（a-z）、数字（0-9）、ハイフン（-）、ピリオド（.）
4. **先頭・末尾**: ラベルの先頭と末尾はハイフン不可
5. **形式**: `label1.label2.label3` の形式（少なくとも2つのラベルが必要、少なくとも1つのピリオドを含む必要がある）

**有効な例**:
- `example.com`
- `subdomain.example.com`
- `test-123.example.org`
- `a.b.c.d.example.com`

**無効な例**:
- `-example.com` (先頭がハイフン)
- `example-.com` (末尾がハイフン)
- `example..com` (連続するピリオド)
- `example` (TLDがない、ピリオドを含まない)

**注**: 大文字を含むFQDN（例: `EXAMPLE.COM`）は受け入れ、内部で小文字に正規化して扱います。これはドメイン名がケースインセンシティブであるためです。

