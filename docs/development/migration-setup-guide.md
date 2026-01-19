# マイグレーションセットアップガイド

## 概要

このガイドでは、MrWebDefence-Consoleでスキーマ管理を開始するためのセットアップ手順を説明します。

## 前提条件

- MySQL 8.4系がインストールされていること
- Flyway CLIがインストールされていること
- データベースへの接続権限があること

## セットアップ手順

### ステップ1: Flyway CLIのインストール

#### macOS

```bash
# Homebrewを使用
brew install flyway

# インストール確認
flyway --version
```

#### Linux / Windows

[Flyway公式サイト](https://flywaydb.org/documentation/usage/commandline/)からダウンロードしてインストールしてください。

### ステップ2: 環境変数の設定

`.env`ファイルを作成し、データベース接続情報を設定します:

```bash
# .envファイルを作成
cp .env.example .env  # .env.exampleが存在する場合

# .envファイルを編集
# 以下の環境変数を設定:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password-here
DB_NAME=mrwebdefence
```

### ステップ3: マイグレーションファイルの移設

MrWebDefence-Designリポジトリからマイグレーションファイルを移設します:

```bash
# MrWebDefence-Designリポジトリが同じ階層にあることを確認
cd /Users/kencom/github/MrWebDefence-Console

# マイグレーションファイルをコピー
cp ../MrWebDefence-Design/db-resources/migration/* apps/backend/src/db/migration/

# シードファイルをコピー（存在する場合）
cp ../MrWebDefence-Design/db-resources/seed/* apps/backend/src/db/seed/
```

**注意**: 現在、MrWebDefence-Designリポジトリのマイグレーションファイルは空です。マイグレーションファイルが作成されたら、上記のコマンドで移設してください。

### ステップ4: 動作確認

#### 4.1 設定の確認

```bash
# 動作確認用テストスクリプトを実行
./scripts/database/test-migration.sh
```

このスクリプトは以下を確認します:
- Flyway CLIのインストール状況
- ディレクトリ構造
- 設定ファイルの存在
- スクリプトの実行権限
- package.jsonの設定

#### 4.2 データベース初期化（初回のみ）

```bash
# データベース初期化（データベース作成 + マイグレーション実行）
pnpm backend:migrate:init

# または、統合スクリプトを直接実行
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence

# 初期データ投入を含む初期化
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence --seed
```

#### 4.3 マイグレーション実行

```bash
# マイグレーション実行（既存データベースに対して）
pnpm backend:migrate

# または、統合スクリプトを直接実行
./scripts/database/migrate.sh migrate

# マイグレーション情報の確認
pnpm backend:migrate:info
# または
./scripts/database/migrate.sh info
```

#### 4.4 その他のコマンド

```bash
# マイグレーションファイルの検証
./scripts/database/migrate.sh validate

# データベースクリーンアップ（全データ削除）
./scripts/database/migrate.sh clean

# ベースラインの作成
./scripts/database/migrate.sh baseline

# 動作確認テスト
./scripts/database/migrate.sh test
```

## トラブルシューティング

### 問題: Flyway CLIが見つからない

**解決方法**:
```bash
# macOSの場合
brew install flyway

# インストール確認
flyway --version
```

### 問題: データベース接続エラー

**解決方法**:
- `.env`ファイルまたは環境変数でデータベース接続情報を確認
- MySQLが起動していることを確認
- データベースユーザーの権限を確認

### 問題: マイグレーションファイルが認識されない

**解決方法**:
- ファイルの配置場所を確認（`apps/backend/src/db/migration/`）
- ファイル名が命名規則に従っているか確認（`V{version}__{description}.sql`）
- `flyway.conf`の`locations`設定を確認

## 次のステップ

マイグレーションファイルが移設されたら:

1. **動作確認**
   ```bash
   pnpm backend:migrate
   ```

2. **マイグレーション情報の確認**
   ```bash
   pnpm backend:migrate:info
   ```

3. **データベースの確認**
   - `flyway_schema_history`テーブルでマイグレーション履歴を確認
   - 作成されたテーブルを確認

詳細は [スキーマ管理ドキュメント](schema-management.md) を参照してください。
