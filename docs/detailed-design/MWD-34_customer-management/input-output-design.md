# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. 顧客作成

**エンドポイント**: `POST /api/v1/customers`

**認証**: 必須（JWT）

**リクエスト**:
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "phone": "090-1234-5678",
  "company": "株式会社サンプル",
  "address": "東京都渋谷区..."
}
```

**必須フィールド**:
- `name`: 顧客名（文字列、1文字以上100文字以下）
- `email`: メールアドレス（有効なメールアドレス形式）

**オプションフィールド**:
- `phone`: 電話番号（文字列、最大20文字）
- `company`: 会社名（文字列、最大100文字）
- `address`: 住所（文字列、最大200文字）

**レスポンス** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "山田太郎",
  "email": "yamada@example.com",
  "phone": "090-1234-5678",
  "company": "株式会社サンプル",
  "address": "東京都渋谷区...",
  "status": "ACTIVE",
  "createdAt": "2026-01-13T10:00:00.000Z",
  "updatedAt": "2026-01-13T10:00:00.000Z"
}
```

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "email must be an email"
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
  "message": "Customer with this email already exists"
}
```

### 2. 顧客更新

**エンドポイント**: `PATCH /api/v1/customers/:id`

**認証**: 必須（JWT）

**パスパラメータ**:
- `id`: 顧客ID（UUID）

**リクエスト**:
```json
{
  "name": "山田花子",
  "email": "yamada-hanako@example.com",
  "phone": "090-9876-5432",
  "company": "株式会社サンプル2",
  "address": "東京都新宿区..."
}
```

**すべてのフィールドがオプション**（更新したいフィールドのみ指定）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "山田花子",
  "email": "yamada-hanako@example.com",
  "phone": "090-9876-5432",
  "company": "株式会社サンプル2",
  "address": "東京都新宿区...",
  "status": "ACTIVE",
  "createdAt": "2026-01-13T10:00:00.000Z",
  "updatedAt": "2026-01-13T11:00:00.000Z"
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
  "message": "Customer not found"
}
```

### 3. 顧客削除

**エンドポイント**: `DELETE /api/v1/customers/:id`

**認証**: 必須（JWT、管理者権限推奨）

**パスパラメータ**:
- `id`: 顧客ID（UUID）

**レスポンス** (204 No Content):
レスポンスボディなし

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Customer not found"
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

### 4. 顧客一覧取得・検索

**エンドポイント**: `GET /api/v1/customers`

**認証**: 必須（JWT）

**クエリパラメータ**:
- `name`: 顧客名（部分一致検索、オプション）
- `email`: メールアドレス（部分一致検索、オプション）
- `company`: 会社名（部分一致検索、オプション）
- `status`: ステータス（`ACTIVE` または `INACTIVE`、オプション）
- `page`: ページ番号（デフォルト: 1、最小: 1）
- `limit`: 1ページあたりの件数（デフォルト: 10、最小: 1、最大: 100）

**リクエスト例**:
```
# 一覧取得
GET /api/v1/customers?page=1&limit=10

# 検索（名前とステータスで絞り込み）
GET /api/v1/customers?name=山田&status=ACTIVE&page=1&limit=10
```

**レスポンス** (200 OK):
```json
{
  "customers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "phone": "090-1234-5678",
      "company": "株式会社サンプル",
      "address": "東京都渋谷区...",
      "status": "ACTIVE",
      "createdAt": "2026-01-13T10:00:00.000Z",
      "updatedAt": "2026-01-13T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "佐藤花子",
      "email": "sato@example.com",
      "phone": null,
      "company": null,
      "address": null,
      "status": "ACTIVE",
      "createdAt": "2026-01-13T11:00:00.000Z",
      "updatedAt": "2026-01-13T11:00:00.000Z"
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

### 5. 顧客詳細取得

**エンドポイント**: `GET /api/v1/customers/:id`

**認証**: 必須（JWT）

**パスパラメータ**:
- `id`: 顧客ID（UUID）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "山田太郎",
  "email": "yamada@example.com",
  "phone": "090-1234-5678",
  "company": "株式会社サンプル",
  "address": "東京都渋谷区...",
  "status": "ACTIVE",
  "createdAt": "2026-01-13T10:00:00.000Z",
  "updatedAt": "2026-01-13T10:00:00.000Z"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Customer not found"
}
```

### 6. 顧客ステータス切り替え

**エンドポイント**: `PATCH /api/v1/customers/:id/status`

**認証**: 必須（JWT、管理者権限推奨）

**パスパラメータ**:
- `id`: 顧客ID（UUID）

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
  "name": "山田太郎",
  "email": "yamada@example.com",
  "phone": "090-1234-5678",
  "company": "株式会社サンプル",
  "address": "東京都渋谷区...",
  "status": "INACTIVE",
  "createdAt": "2026-01-13T10:00:00.000Z",
  "updatedAt": "2026-01-13T12:00:00.000Z"
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
  "message": "Customer not found"
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

### CustomerStatus
```typescript
enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
```

### CustomerResponseDto
```typescript
interface CustomerResponseDto {
  id: string;              // UUID
  name: string;            // 顧客名
  email: string;           // メールアドレス
  phone?: string;          // 電話番号（オプション）
  company?: string;        // 会社名（オプション）
  address?: string;       // 住所（オプション）
  status: CustomerStatus; // ステータス
  createdAt: Date;        // 作成日時
  updatedAt: Date;        // 更新日時
}
```

### CustomerListResponseDto
```typescript
interface CustomerListResponseDto {
  customers: CustomerResponseDto[];
  total: number;          // 総件数
  page: number;           // 現在のページ番号
  limit: number;          // 1ページあたりの件数
}
```

## バリデーションルール

### CreateCustomerDto
- `name`: 必須、文字列、1文字以上100文字以下
- `email`: 必須、有効なメールアドレス形式
- `phone`: オプション、文字列、最大20文字
- `company`: オプション、文字列、最大100文字
- `address`: オプション、文字列、最大200文字

### UpdateCustomerDto
- すべてのフィールドがオプション
- 指定されたフィールドのみ更新される
- バリデーションルールはCreateCustomerDtoと同じ

### CustomerListQueryDto（一覧取得・検索共通）
- `name`: オプション、文字列（部分一致検索）
- `email`: オプション、文字列（部分一致検索）
- `company`: オプション、文字列（部分一致検索）
- `status`: オプション、`ACTIVE` または `INACTIVE`
- `page`: オプション、正の整数、デフォルト: 1
- `limit`: オプション、1以上100以下の整数、デフォルト: 10

### ToggleStatusDto
- `status`: 必須、`ACTIVE` または `INACTIVE`

