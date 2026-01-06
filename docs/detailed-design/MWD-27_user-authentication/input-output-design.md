# API仕様設計

## 概要

ユーザー認証機能のAPI仕様を定義します。

## エンドポイント

### POST /api/v1/auth/login

ログイン処理を実行し、JWTトークンを返却します。

#### リクエスト

**パス**: `/api/v1/auth/login`  
**メソッド**: `POST`  
**Content-Type**: `application/json`

**リクエストボディ**:

```typescript
{
  email: string;      // ユーザーのメールアドレス（必須）
  password: string;   // ユーザーのパスワード（必須、最小8文字）
}
```

**バリデーションルール**:

- `email`: 
  - 必須
  - メールアドレス形式
  - 最大255文字
- `password`: 
  - 必須
  - 最小8文字
  - 最大128文字

**リクエスト例**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス

##### 成功時（200 OK）

```typescript
{
  accessToken: string;   // JWTアクセストークン
  tokenType: string;     // トークンタイプ（"Bearer"）
  expiresIn: number;     // トークンの有効期限（秒）
}
```

**レスポンス例**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400
}
```

##### バリデーションエラー（400 Bad Request）

```typescript
{
  statusCode: number;
  message: string[];
  error: string;
}
```

**レスポンス例**:

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

##### 認証エラー（401 Unauthorized）

```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

**レスポンス例**:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

##### サーバーエラー（500 Internal Server Error）

```typescript
{
  statusCode: number;
  message: string;
  error: string;
}
```

**レスポンス例**（本番環境では詳細を隠す）:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## JWTトークン仕様

### ペイロード構造

```typescript
{
  sub: string;      // ユーザーID
  email: string;    // メールアドレス
  iat: number;     // 発行日時（Unix timestamp）
  exp: number;      // 有効期限（Unix timestamp）
}
```

### トークン設定

- **アルゴリズム**: HS256
- **有効期限**: 24時間（86400秒）
- **シークレットキー**: 環境変数`JWT_SECRET`から取得

## セキュリティ考慮事項

### パスワード

- パスワードはbcryptでハッシュ化して保存
- ハッシュ化のラウンド数: 10（推奨値）

### エラーメッセージ

- 認証エラー時は、ユーザーが存在するかどうかを明示しない
- 統一されたエラーメッセージ: "Invalid credentials"

### レート制限

- 将来的にログイン試行回数の制限を実装（本フェーズでは未実装）

## 使用例

### cURL

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const data = await response.json();
if (response.ok) {
  // トークンを保存
  localStorage.setItem('accessToken', data.accessToken);
} else {
  // エラー処理
  console.error(data.message);
}
```


