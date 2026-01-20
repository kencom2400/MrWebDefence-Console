# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. APIトークン生成

**エンドポイント**: `POST /api/v1/api-tokens`

**認証**: 必須（管理者権限）

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**リクエストボディ**:
```json
{
  "name": "WAF Engine Production Token",
  "description": "Production環境のWAFエンジン用トークン",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

**レスポンス** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "WAF Engine Production Token",
  "description": "Production環境のWAFエンジン用トークン",
  "token": "waf_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "tokenPreview": "waf_abc123...",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "revokedAt": null,
  "createdAt": "2026-01-20T12:00:00.000Z",
  "createdBy": "880e8400-e29b-41d4-a716-446655440003"
}
```

**注意**: `token`フィールドは生成時のみ1回だけ返却されます。以降のリクエストでは返却されません。

**エラー** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": ["name should not be empty"],
  "error": "Bad Request"
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

**エラー** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 2. APIトークン一覧取得

**エンドポイント**: `GET /api/v1/api-tokens`

**認証**: 必須（管理者権限）

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**クエリパラメータ**: なし（将来実装: ページネーション）

**レスポンス** (200 OK):
```json
{
  "tokens": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "WAF Engine Production Token",
      "description": "Production環境のWAFエンジン用トークン",
      "tokenPreview": "waf_abc123...",
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "revokedAt": null,
      "createdAt": "2026-01-20T12:00:00.000Z",
      "createdBy": "880e8400-e29b-41d4-a716-446655440003"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "WAF Engine Development Token",
      "description": "Development環境のWAFエンジン用トークン",
      "tokenPreview": "waf_def456...",
      "expiresAt": null,
      "revokedAt": "2026-01-19T10:00:00.000Z",
      "createdAt": "2026-01-15T08:00:00.000Z",
      "createdBy": "880e8400-e29b-41d4-a716-446655440003"
    }
  ],
  "total": 2
}
```

**注意**: 実際のトークン（`token`フィールド）は含まれません。`tokenPreview`のみが表示されます。

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**エラー** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 3. APIトークン削除

**エンドポイント**: `DELETE /api/v1/api-tokens/:id`

**認証**: 必須（管理者権限）

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**パスパラメータ**:
- `id`: トークンID（UUID）

**レスポンス** (204 No Content):
```
（ボディなし）
```

**エラー** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**エラー** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "API token not found",
  "error": "Not Found"
}
```

### 4. APIトークン無効化

**エンドポイント**: `POST /api/v1/api-tokens/:id/revoke`

**認証**: 必須（管理者権限）

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**パスパラメータ**:
- `id`: トークンID（UUID）

**レスポンス** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "WAF Engine Production Token",
  "description": "Production環境のWAFエンジン用トークン",
  "tokenPreview": "waf_abc123...",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "revokedAt": "2026-01-20T12:30:00.000Z",
  "createdAt": "2026-01-20T12:00:00.000Z",
  "createdBy": "880e8400-e29b-41d4-a716-446655440003"
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

**エラー** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**エラー** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "API token not found",
  "error": "Not Found"
}
```

## データ型定義

### CreateApiTokenDto
```typescript
interface CreateApiTokenDto {
  name: string;              // 必須、1-255文字
  description?: string;       // オプション、最大1000文字
  expiresAt?: string;         // オプション、ISO 8601形式の日時文字列、nullの場合は無期限
}
```

### ApiTokenResponseDto
```typescript
interface ApiTokenResponseDto {
  id: string;                // UUID
  name: string;              // トークン名
  description?: string;      // 説明
  token?: string;            // トークン（生成時のみ、プレフィックス付き）
  tokenPreview: string;      // トークンのプレビュー表示（例: "waf_abc123..."）
  expiresAt?: string;        // 有効期限（ISO 8601形式、nullの場合は無期限）
  revokedAt?: string;        // 無効化日時（ISO 8601形式、nullの場合は有効）
  createdAt: string;         // 作成日時（ISO 8601形式）
  createdBy: string;         // 作成者ID（UUID）
}
```

### ListApiTokensResponseDto
```typescript
interface ListApiTokensResponseDto {
  tokens: ApiTokenResponseDto[];  // トークンリスト（tokenフィールドは含まれない）
  total: number;                  // 総数
}
```

## バリデーションルール

### CreateApiTokenDto

- **name**: 
  - 必須
  - 文字列
  - 1文字以上255文字以下
  - 空文字列は不可
- **description**: 
  - オプション
  - 文字列
  - 最大1000文字
- **expiresAt**: 
  - オプション
  - ISO 8601形式の日時文字列
  - 未来の日時であること
  - nullの場合は無期限

## セキュリティ考慮事項

### 認証方式

1. **管理者権限必須**
   - APIトークンの生成・管理は管理者権限（`SERVICE_ADMIN`）のみ
   - 通常ユーザー（`SERVICE_MEMBER`）はアクセス不可

2. **トークンの表示**
   - トークンは生成時のみ1回だけ表示される
   - 以降のリクエストでは`token`フィールドは返却されない
   - `tokenPreview`のみが表示される（例: `waf_abc123...`）

3. **トークンのハッシュ化**
   - トークンは平文で保存せず、bcryptでハッシュ化して保存
   - ハッシュ化のラウンド数は10（デフォルト）

4. **トークンの検証**
   - 認証時は、トークンのプレフィックスから検索対象を絞り込み
   - トークンをハッシュ化してApiTokenRepositoryで検索
   - トークンが存在し、有効期限が切れておらず、無効化されていない場合、認証成功

### 認可

- WAFエンジン専用のロール・権限は現時点では実装しない
- 将来的に、トークンごとに異なる権限を設定可能にする（将来実装）

### レート制限

- 過度なリクエストを防ぐため、レート制限を実装（将来実装）
- 推奨: 1分あたり60リクエスト以下

## パフォーマンス考慮事項

### トークンの検索効率

- トークンのプレフィックスによるインデックス検索で高速化
- `api_tokens`テーブルに`token_prefix`カラムにインデックスを設定

### ハッシュ化のコスト

- bcryptのラウンド数を適切に設定（デフォルト10ラウンド）
- セキュリティとパフォーマンスのバランスを考慮

### トークンの一覧取得

- 大量のトークンがある場合、ページネーションを実装（将来実装）
- 現時点ではすべてのトークンを取得

## エラーハンドリング

### バリデーションエラー

- リクエストボディのバリデーションエラー: `400 Bad Request`
- 必須フィールドが欠落している場合: `400 Bad Request`
- フィールドの形式が不正な場合: `400 Bad Request`

### 認証エラー

- JWTトークンが無効な場合: `401 Unauthorized`
- JWTトークンが期限切れの場合: `401 Unauthorized`

### 認可エラー

- 管理者権限がない場合: `403 Forbidden`

### リソースエラー

- トークンが見つからない場合: `404 Not Found`
- データベースエラーの場合: `500 Internal Server Error`

## 使用例

### APIトークン生成

```bash
curl -X POST http://localhost:3001/api/v1/api-tokens \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WAF Engine Production Token",
    "description": "Production環境のWAFエンジン用トークン",
    "expiresAt": "2026-12-31T23:59:59.000Z"
  }'
```

### APIトークン一覧取得

```bash
curl -X GET http://localhost:3001/api/v1/api-tokens \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### APIトークン削除

```bash
curl -X DELETE http://localhost:3001/api/v1/api-tokens/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### APIトークン無効化

```bash
curl -X POST http://localhost:3001/api/v1/api-tokens/550e8400-e29b-41d4-a716-446655440000/revoke \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### WAFエンジンでの使用（MWD-100）

```bash
curl -X GET http://localhost:3001/engine/v1/config \
  -H "Authorization: Bearer waf_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
```
