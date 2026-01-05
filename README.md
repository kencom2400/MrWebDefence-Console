# MrWebDefence-Console

This repository is part of the MrWebDefence system.

## セットアップ

### 前提条件

- Voltaがインストールされていること

Voltaのインストール方法:
```bash
curl https://get.volta.sh | bash
```

インストール後、シェルを再起動してください。

### 環境のセットアップ

このプロジェクトはVoltaを使用してNode.jsとpnpmのバージョンを管理しています。

```bash
# プロジェクトディレクトリに移動すると、自動的に指定されたバージョンが適用されます
cd /path/to/MrWebDefence-Console

# バージョンの確認
node --version  # v20.18.0
pnpm --version  # 9.15.0
```

### 依存関係のインストール

```bash
pnpm install
```

### バックエンド開発

#### 開発サーバーの起動

```bash
# 方法1: スクリプトを使用（推奨）
./scripts/backend/dev.sh

# 方法2: pnpm経由
pnpm backend:dev

# 環境変数で設定をカスタマイズ
PORT=3001 JWT_SECRET=your-secret ./scripts/backend/dev.sh
```

#### テストの実行

```bash
# すべてのテストを実行
./scripts/backend/test.sh all

# ユニットテストのみ
./scripts/backend/test.sh unit

# カバレッジレポートを生成
./scripts/backend/test.sh cov

# E2Eテストを実行
./scripts/backend/test.sh e2e

# pnpm経由でも実行可能
pnpm backend:test all
```

#### Lintの実行

```bash
# Lintチェック
./scripts/backend/lint.sh check

# Lint自動修正
./scripts/backend/lint.sh fix

# Prettierフォーマット
./scripts/backend/lint.sh format

# pnpm経由でも実行可能
pnpm backend:lint
```

#### ビルド

```bash
# ビルド実行
./scripts/backend/build.sh

# pnpm経由でも実行可能
pnpm backend:build
```

#### テスト用ユーザーの作成

```bash
# テスト用ユーザーを作成
./scripts/backend/create-test-user.sh test@example.com password123

# 環境変数で指定することも可能
TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=password123 ./scripts/backend/create-test-user.sh test@example.com password123
```

#### API動作確認

```bash
# サーバーを起動し、APIの動作を確認
./scripts/backend/test-api.sh

# 環境変数で設定をカスタマイズ
PORT=3001 TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=password123 ./scripts/backend/test-api.sh
```

### API使用方法

#### ログインAPI

**エンドポイント**: `POST /api/v1/auth/login`

**リクエスト例**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**成功時のレスポンス** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400
}
```

**エラーレスポンス**:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー（メールアドレスまたはパスワードが間違っている）

詳細は [Voltaバージョン管理設計書](docs/development/volta-version-management.md) と [実装設計書](docs/detailed-design/MWD-27_user-authentication/README.md) を参照してください。
