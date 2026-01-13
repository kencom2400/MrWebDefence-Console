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

**便利なスクリプト**:

```bash
# サービスを起動（スクリプト使用）
./scripts/docker/start.sh              # バックグラウンドで起動
./scripts/docker/start.sh -f          # フォアグラウンドで起動（ログ表示）
./scripts/docker/start.sh -b          # イメージを再ビルドしてから起動

# サービスを停止（スクリプト使用）
./scripts/docker/stop.sh               # サービスを停止（ボリュームは保持）
./scripts/docker/stop.sh -v            # サービスを停止し、ボリュームも削除

# 環境をリセット（スクリプト使用）
./scripts/docker/reset.sh              # 停止→ボリューム削除→再ビルド→起動
./scripts/docker/reset.sh -f           # 確認なしでリセット
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

**Docker Composeを使用したテスト実行（推奨）**:

```bash
# すべてのテストを実行（カバレッジレポート + E2Eテスト）
./scripts/backend/test.sh all
# または引数なし（デフォルトでallが実行される）
./scripts/backend/test.sh

# ユニットテストのみ実行
./scripts/backend/test.sh unit
# または
./scripts/backend/test.sh test

# E2Eテストのみ実行
./scripts/backend/test.sh e2e

# カバレッジレポートを生成（ユニットテスト含む）
./scripts/backend/test.sh cov
# または
./scripts/backend/test.sh coverage

# ウォッチモードでテスト実行（開発中に便利）
./scripts/backend/test.sh watch
```

**テストタイプの説明**:

- `unit` / `test`: ユニットテストのみ実行（`redis-test`コンテナを使用）
- `e2e`: E2Eテストのみ実行（`redis-e2e`コンテナを使用）
- `cov` / `coverage`: カバレッジレポート生成（ユニットテスト含む、`redis-test`コンテナを使用）
- `watch`: ウォッチモードでテスト実行（ファイル変更を監視、`redis-test`コンテナを使用）
- `all`: カバレッジレポートとE2Eテストの両方を実行（デフォルト）

**注意**: 
- テスト実行時は、適切なRedisコンテナ（`redis-test`または`redis-e2e`）が自動的に起動されます
- テスト完了後、Redisコンテナは自動的に停止されます
- ローカル環境で直接実行する場合は、事前にRedisを起動する必要があります

**ローカル環境で直接実行する場合**:

```bash
# ユニットテスト
cd apps/backend
pnpm run test

# E2Eテスト（事前にredis-e2eコンテナを起動する必要があります）
REDIS_PORT=6381 pnpm run test:e2e

# カバレッジレポート
pnpm run test:cov
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

**便利なスクリプト**:

```bash
# サービスを起動（スクリプト使用）
./scripts/docker/start.sh              # バックグラウンドで起動
./scripts/docker/start.sh -f          # フォアグラウンドで起動（ログ表示）
./scripts/docker/start.sh -b          # イメージを再ビルドしてから起動

# サービスを停止（スクリプト使用）
./scripts/docker/stop.sh               # サービスを停止（ボリュームは保持）
./scripts/docker/stop.sh -v            # サービスを停止し、ボリュームも削除

# 環境をリセット（スクリプト使用）
./scripts/docker/reset.sh              # 停止→ボリューム削除→再ビルド→起動
./scripts/docker/reset.sh -f           # 確認なしでリセット
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

**Docker Composeを使用したテスト実行（推奨）**:

```bash
# すべてのテストを実行（カバレッジレポート + E2Eテスト）
./scripts/backend/test.sh all
# または引数なし（デフォルトでallが実行される）
./scripts/backend/test.sh

# ユニットテストのみ実行
./scripts/backend/test.sh unit
# または
./scripts/backend/test.sh test

# E2Eテストのみ実行
./scripts/backend/test.sh e2e

# カバレッジレポートを生成（ユニットテスト含む）
./scripts/backend/test.sh cov
# または
./scripts/backend/test.sh coverage

# ウォッチモードでテスト実行（開発中に便利）
./scripts/backend/test.sh watch
```

**テストタイプの説明**:

- `unit` / `test`: ユニットテストのみ実行（`redis-test`コンテナを使用）
- `e2e`: E2Eテストのみ実行（`redis-e2e`コンテナを使用）
- `cov` / `coverage`: カバレッジレポート生成（ユニットテスト含む、`redis-test`コンテナを使用）
- `watch`: ウォッチモードでテスト実行（ファイル変更を監視、`redis-test`コンテナを使用）
- `all`: カバレッジレポートとE2Eテストの両方を実行（デフォルト）

**注意**: 
- テスト実行時は、適切なRedisコンテナ（`redis-test`または`redis-e2e`）が自動的に起動されます
- テスト完了後、Redisコンテナは自動的に停止されます
- ローカル環境で直接実行する場合は、事前にRedisを起動する必要があります

**ローカル環境で直接実行する場合**:

```bash
# ユニットテスト
cd apps/backend
pnpm run test

# E2Eテスト（事前にredis-e2eコンテナを起動する必要があります）
REDIS_PORT=6381 pnpm run test:e2e

# カバレッジレポート
pnpm run test:cov
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

**便利なスクリプト**:

```bash
# サービスを起動（スクリプト使用）
./scripts/docker/start.sh              # バックグラウンドで起動
./scripts/docker/start.sh -f          # フォアグラウンドで起動（ログ表示）
./scripts/docker/start.sh -b          # イメージを再ビルドしてから起動

# サービスを停止（スクリプト使用）
./scripts/docker/stop.sh               # サービスを停止（ボリュームは保持）
./scripts/docker/stop.sh -v            # サービスを停止し、ボリュームも削除

# 環境をリセット（スクリプト使用）
./scripts/docker/reset.sh              # 停止→ボリューム削除→再ビルド→起動
./scripts/docker/reset.sh -f           # 確認なしでリセット
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

**Docker Composeを使用したテスト実行（推奨）**:

```bash
# すべてのテストを実行（カバレッジレポート + E2Eテスト）
./scripts/backend/test.sh all
# または引数なし（デフォルトでallが実行される）
./scripts/backend/test.sh

# ユニットテストのみ実行
./scripts/backend/test.sh unit
# または
./scripts/backend/test.sh test

# E2Eテストのみ実行
./scripts/backend/test.sh e2e

# カバレッジレポートを生成（ユニットテスト含む）
./scripts/backend/test.sh cov
# または
./scripts/backend/test.sh coverage

# ウォッチモードでテスト実行（開発中に便利）
./scripts/backend/test.sh watch
```

**テストタイプの説明**:

- `unit` / `test`: ユニットテストのみ実行（`redis-test`コンテナを使用）
- `e2e`: E2Eテストのみ実行（`redis-e2e`コンテナを使用）
- `cov` / `coverage`: カバレッジレポート生成（ユニットテスト含む、`redis-test`コンテナを使用）
- `watch`: ウォッチモードでテスト実行（ファイル変更を監視、`redis-test`コンテナを使用）
- `all`: カバレッジレポートとE2Eテストの両方を実行（デフォルト）

**注意**: 
- テスト実行時は、適切なRedisコンテナ（`redis-test`または`redis-e2e`）が自動的に起動されます
- テスト完了後、Redisコンテナは自動的に停止されます
- ローカル環境で直接実行する場合は、事前にRedisを起動する必要があります

**ローカル環境で直接実行する場合**:

```bash
# ユニットテスト
cd apps/backend
pnpm run test

# E2Eテスト（事前にredis-e2eコンテナを起動する必要があります）
REDIS_PORT=6381 pnpm run test:e2e

# カバレッジレポート
pnpm run test:cov
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
