# MrWebDefence-Console

This repository is part of the MrWebDefence system.

## セットアップ

### 前提条件

- DockerとDocker Composeがインストールされていること（Docker Composeを使用する場合）
- または、Voltaがインストールされていること（ローカル開発の場合）

#### Docker Composeのインストール

Docker Desktopをインストールすると、Docker Composeも含まれます。

- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- [Docker Engine for Linux](https://docs.docker.com/engine/install/)

#### Voltaのインストール（ローカル開発の場合）

```bash
curl https://get.volta.sh | bash
```

インストール後、シェルを再起動してください。

### 環境のセットアップ

#### 方法1: Docker Composeを使用（推奨）

Docker Composeを使用すると、環境構築が簡単で一貫性が保たれます。

```bash
# 環境変数ファイルを作成（.env.exampleを参考に）
cp .env.example .env

# 必要に応じて.envファイルを編集
# JWT_SECRETなどの機密情報を設定

# Docker Composeでサービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend

# サービスを停止
docker-compose down
```

**Docker Composeの主なコマンド**:

```bash
# サービスを起動（バックグラウンド）
docker-compose up -d

# サービスを起動（フォアグラウンド、ログ表示）
docker-compose up

# サービスを停止
docker-compose down

# サービスを停止（ボリュームも削除）
docker-compose down -v

# ログを確認
docker-compose logs -f backend

# コンテナ内でコマンドを実行
docker-compose exec backend sh

# イメージを再ビルド
docker-compose build --no-cache
```

バックエンドAPIは `http://localhost:3001` で利用可能です。

#### 方法2: ローカル開発環境

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

**Docker Composeを使用する場合**:

```bash
# サービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend
```

**ローカル環境で開発する場合**:

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

## CI/CD

### CIパイプライン

`main`または`develop`ブランチへのpushやPull Request時に以下が自動実行されます：

#### 1. Lint（静的解析）

- ESLintによるコードスタイルチェック
- TypeScriptの型チェック
- Node.js 20.18.0、pnpm 9.15.0で実行

#### 2. Build（ビルドテスト）

- バックエンドのビルド
- TypeScriptのコンパイル確認
- Node.js 20.18.0、pnpm 9.15.0で実行

#### 3. Unit Tests（ユニットテスト）

- バックエンドのユニットテスト
- テストカバレッジレポートの生成
- カバレッジレポートはアーティファクトとして保存

#### 4. E2E Tests（E2Eテスト）

- バックエンドのE2Eテスト
- 実際のHTTPリクエストを使用した統合テスト

**注意**: ドキュメントのみの変更（`.md`ファイル、`docs/`ディレクトリなど）ではCIはスキップされます。

詳細は [Voltaバージョン管理設計書](docs/development/volta-version-management.md) と [実装設計書](docs/detailed-design/MWD-27_user-authentication/README.md) を参照してください。
