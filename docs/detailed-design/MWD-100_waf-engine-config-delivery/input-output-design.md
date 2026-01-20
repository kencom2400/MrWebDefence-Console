# 入出力設計 (Input/Output Design)

## APIエンドポイント

### 1. 設定取得

**エンドポイント**: `GET /engine/v1/config`

**認証**: 必須（APIキーまたはJWTトークン）

**リクエストヘッダー**:
```
Authorization: Bearer <API_KEY_OR_JWT_TOKEN>
```

**クエリパラメータ**: なし

**レスポンス** (200 OK):
```json
{
  "fqdns": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fqdn": "example.com",
      "status": "ACTIVE"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "fqdn": "test.example.com",
      "status": "ACTIVE"
    }
  ],
  "ipAllowLists": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "userId": "880e8400-e29b-41d4-a716-446655440003",
      "ipAddress": "192.168.1.1"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "userId": "880e8400-e29b-41d4-a716-446655440003",
      "ipAddress": "192.168.1.0/24"
    }
  ],
  "customers": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "name": "Customer A",
      "status": "ACTIVE"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "name": "Customer B",
      "status": "ACTIVE"
    }
  ],
  "lastUpdated": "2026-01-20T12:00:00.000Z"
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

**エラー** (500 Internal Server Error):
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## データ型定義

### EngineConfigResponseDto
```typescript
interface EngineConfigResponseDto {
  fqdns: FqdnConfig[];
  ipAllowLists: IpAllowListConfig[];
  customers: CustomerConfig[];
  lastUpdated: Date;
}
```

### FqdnConfig
```typescript
interface FqdnConfig {
  id: string;              // UUID
  fqdn: string;           // FQDN文字列
  status: string;         // "ACTIVE" | "INACTIVE"
}
```

### IpAllowListConfig
```typescript
interface IpAllowListConfig {
  id: string;              // UUID
  userId: string;          // ユーザーID (UUID)
  ipAddress: string;       // IPアドレス（IPv4/IPv6、CIDR記法も可）
}
```

### CustomerConfig
```typescript
interface CustomerConfig {
  id: string;              // UUID
  name: string;           // 顧客名
  status: string;         // "ACTIVE" | "INACTIVE"
}
```

## バリデーションルール

### レスポンスデータ

- **fqdns**: 配列、有効なFQDN設定のみ（status = "ACTIVE"）を含む
- **ipAllowLists**: 配列、すべてのIP AllowList設定を含む
- **customers**: 配列、有効な顧客設定のみ（status = "ACTIVE"）を含む
- **lastUpdated**: 現在の日時（ISO 8601形式）

## フィルタリングルール

### FQDN設定

- ステータスが`ACTIVE`のFQDNのみを返却
- ステータスが`INACTIVE`のFQDNは除外

### IP AllowList設定

- すべてのIP AllowList設定を返却（ステータスによるフィルタリングなし）
- ユーザーIDとIPアドレスのペアを返却

### 顧客設定

- ステータスが`ACTIVE`の顧客のみを返却
- ステータスが`INACTIVE`の顧客は除外

## セキュリティ考慮事項

### 認証方式

1. **APIキー認証**（推奨）
   - WAFエンジン専用のAPIキーを発行
   - `Authorization: Bearer <API_KEY>`ヘッダーで送信

2. **JWTトークン認証**（代替）
   - 既存のJWT認証システムを使用
   - `Authorization: Bearer <JWT_TOKEN>`ヘッダーで送信

### 認可

- WAFエンジン専用のロール・権限を設定（将来実装）
- 現時点では認証のみを必須とする

### レート制限

- 過度なリクエストを防ぐため、レート制限を実装（将来実装）
- 推奨: 1分あたり60リクエスト以下

## パフォーマンス考慮事項

### レスポンスサイズ

- 大量のデータがある場合、レスポンスサイズが大きくなる可能性がある
- 将来的にはページネーションを検討

### キャッシュ

- 設定データの変更頻度が低い場合、レスポンスをキャッシュ（将来実装）
- キャッシュ有効期限: 5分（推奨）

### 並列取得

- 各リポジトリからのデータ取得は並列で実行
- パフォーマンス向上のため、Promise.all()を使用

## エラーハンドリング

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 500 | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |

### エラーレスポンス形式

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## テストデータ例

### 正常系レスポンス例

```json
{
  "fqdns": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fqdn": "example.com",
      "status": "ACTIVE"
    }
  ],
  "ipAllowLists": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "userId": "880e8400-e29b-41d4-a716-446655440003",
      "ipAddress": "192.168.1.1"
    }
  ],
  "customers": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "name": "Customer A",
      "status": "ACTIVE"
    }
  ],
  "lastUpdated": "2026-01-20T12:00:00.000Z"
}
```

### 空の設定データ例

```json
{
  "fqdns": [],
  "ipAllowLists": [],
  "customers": [],
  "lastUpdated": "2026-01-20T12:00:00.000Z"
}
```
