# マイグレーション統合スクリプトガイド

## 概要

`scripts/database/migrate.sh`は、データベース初期化、マイグレーション実行、その他のFlyway操作を統合的に実行するスクリプトです。

## コマンド一覧

### `init` - データベース初期化

データベースを作成し、utf8mb4文字コードを設定し、Flywayマイグレーションを実行します。

**使用例**:
```bash
# 基本的な初期化
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence

# 初期データ投入を含む初期化
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence --seed

# 環境変数を使用
DB_HOST=localhost DB_USER=root DB_PASSWORD=password ./scripts/database/migrate.sh init
```

**オプション**:
- `-h, --host HOST`: データベースホスト（デフォルト: localhost）
- `-P, --port PORT`: データベースポート（デフォルト: 3306）
- `-u, --user USER`: データベースユーザー（デフォルト: root）
- `-p, --password PASSWORD`: データベースパスワード（必須）
- `-d, --database NAME`: データベース名（デフォルト: mrwebdefence）
- `-s, --seed`: 初期データ投入を含める

**実行内容**:
1. MySQL接続確認
2. データベース作成（存在しない場合）
3. utf8mb4文字コード設定確認
4. Flywayマイグレーション実行

### `migrate` - マイグレーション実行

既存のデータベースに対して、未実行のマイグレーションを実行します。

**使用例**:
```bash
# マイグレーション実行
./scripts/database/migrate.sh migrate

# pnpm経由
pnpm backend:migrate
```

**実行内容**:
- 環境変数または`.env`ファイルから設定を読み込み
- Flyway設定ファイル（`flyway.conf`）を読み込み
- 未実行のマイグレーションのみを実行

### `info` - マイグレーション情報の表示

マイグレーションの実行状況を表示します。

**使用例**:
```bash
./scripts/database/migrate.sh info

# pnpm経由
pnpm backend:migrate:info
```

**表示内容**:
- 実行済みマイグレーションの一覧
- 未実行マイグレーションの一覧
- マイグレーションの状態

### `clean` - データベースクリーンアップ

データベース内の全データを削除します。

**使用例**:
```bash
./scripts/database/migrate.sh clean

# pnpm経由
pnpm backend:migrate:clean
```

**注意**: この操作はデータベース内の全データを削除します。実行前に確認プロンプトが表示されます。

### `validate` - マイグレーションファイルの検証

マイグレーションファイルの整合性を検証します。

**使用例**:
```bash
./scripts/database/migrate.sh validate

# pnpm経由
pnpm backend:migrate:validate
```

**検証内容**:
- マイグレーションファイルの命名規則
- チェックサムの整合性
- 実行済みマイグレーションファイルの変更検出

### `baseline` - ベースラインの作成

既存のデータベースに対してベースラインを作成します。

**使用例**:
```bash
./scripts/database/migrate.sh baseline

# pnpm経由
pnpm backend:migrate:baseline
```

**使用タイミング**:
- 既存のデータベースにFlywayを導入する場合
- マイグレーション履歴を初期化する場合

### `test` - 動作確認テスト

設定ファイル、ディレクトリ構造、スクリプトの動作を確認します。

**使用例**:
```bash
./scripts/database/migrate.sh test

# pnpm経由
pnpm backend:migrate:test
```

**確認内容**:
- Flyway CLIのインストール状況
- ディレクトリ構造
- 設定ファイルの存在
- マイグレーションファイルの数

## pnpmスクリプトとの対応

| 統合スクリプト | pnpmスクリプト | 説明 |
|--------------|---------------|------|
| `migrate.sh init` | `pnpm backend:migrate:init` | データベース初期化 |
| `migrate.sh migrate` | `pnpm backend:migrate` | マイグレーション実行 |
| `migrate.sh info` | `pnpm backend:migrate:info` | マイグレーション情報表示 |
| `migrate.sh clean` | `pnpm backend:migrate:clean` | データベースクリーンアップ |
| `migrate.sh validate` | `pnpm backend:migrate:validate` | マイグレーションファイル検証 |
| `migrate.sh baseline` | `pnpm backend:migrate:baseline` | ベースライン作成 |
| `migrate.sh test` | `pnpm backend:migrate:test` | 動作確認テスト |

## よくある使用パターン

### 初回セットアップ

```bash
# 1. 設定確認
./scripts/database/migrate.sh test

# 2. データベース初期化
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence

# 3. マイグレーション情報の確認
./scripts/database/migrate.sh info
```

### 新しいマイグレーションファイルを追加した後

```bash
# 1. マイグレーションファイルの検証
./scripts/database/migrate.sh validate

# 2. マイグレーション実行
./scripts/database/migrate.sh migrate

# 3. マイグレーション情報の確認
./scripts/database/migrate.sh info
```

### データベースをリセットしたい場合

```bash
# 1. データベースクリーンアップ（確認プロンプトあり）
./scripts/database/migrate.sh clean

# 2. データベース初期化
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence
```

## 環境変数

以下の環境変数を設定することで、データベース接続情報を指定できます:

- `DB_HOST`: データベースホスト（デフォルト: localhost）
- `DB_PORT`: データベースポート（デフォルト: 3306）
- `DB_USER`: データベースユーザー（デフォルト: root）
- `DB_PASSWORD`: データベースパスワード（必須）
- `DB_NAME`: データベース名（デフォルト: mrwebdefence）
- `INCLUDE_SEED`: 初期データ投入を含める（true/false）

`.env`ファイルに設定することもできます。

## トラブルシューティング

### 問題: コマンドが見つからない

**解決方法**:
```bash
# スクリプトの実行権限を確認
ls -la scripts/database/migrate.sh

# 実行権限がない場合
chmod +x scripts/database/migrate.sh
```

### 問題: データベース接続エラー

**解決方法**:
- `.env`ファイルまたは環境変数でデータベース接続情報を確認
- MySQLが起動していることを確認
- データベースユーザーの権限を確認

詳細は [スキーマ管理ドキュメント](schema-management.md) を参照してください。
