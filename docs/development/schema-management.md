# スキーマ管理

## 概要

MrWebDefence-Consoleでは、Flywayを使用してデータベーススキーマのマイグレーションを管理します。

スキーマ管理の仕組みは、MrWebDefence-Designリポジトリから移設されました。

## ディレクトリ構造

```
apps/backend/
├── src/
│   └── db/
│       ├── migration/      # Flyway Versioned Migrations
│       │   ├── V1__create_users_table.sql
│       │   └── V2__create_roles_table.sql
│       └── seed/           # Flyway Repeatable Migrations
│           └── R__insert_initial_roles.sql
├── flyway.conf             # Flyway設定ファイル
└── package.json
```

## Flyway設定

Flywayの設定は`apps/backend/flyway.conf`に記載されています。

主な設定項目:
- `flyway.url`: データベース接続URL（環境変数`DB_HOST`、`DB_PORT`、`DB_NAME`から取得）
- `flyway.user`: データベースユーザー名（環境変数`DB_USER`から取得）
- `flyway.password`: データベースパスワード（環境変数`DB_PASSWORD`から取得）
- `flyway.locations`: マイグレーションファイルの配置場所

## マイグレーションファイルの命名規則

### Versioned Migrations（バージョン付きマイグレーション）

**命名規則**: `V{version}__{description}.sql`

**例**:
- `V1__create_users_table.sql`
- `V2__create_roles_table.sql`
- `V3__add_customer_id_to_users.sql`

**注意事項**:
- バージョン番号は一度使用したら変更しない
- 既存のマイグレーションファイル名は変更しない
- ファイルの文字コードはUTF-8（BOMなし）を使用

### Repeatable Migrations（繰り返し可能なマイグレーション）

**命名規則**: `R__{description}.sql`

**例**:
- `R__insert_initial_roles.sql`
- `R__insert_initial_password_policy.sql`

**特徴**:
- バージョン番号を持たない（`R`プレフィックスを使用）
- チェックサムが変更された場合に再実行される
- 実行順序は、バージョン付きマイグレーションの後に実行される

## マイグレーション実行方法

### 開発環境

#### 方法1: 統合スクリプトを使用（推奨）

統合スクリプト `scripts/database/migrate.sh` を使用すると、すべてのマイグレーション操作を一元的に実行できます。

```bash
# データベース初期化（データベース作成 + マイグレーション実行）
./scripts/database/migrate.sh init -h localhost -u root -p password -d mrwebdefence

# マイグレーション実行（既存データベースに対して）
./scripts/database/migrate.sh migrate

# マイグレーション情報の確認
./scripts/database/migrate.sh info

# データベースをクリーンアップ（注意: 全データが削除されます）
./scripts/database/migrate.sh clean

# マイグレーションファイルの検証
./scripts/database/migrate.sh validate

# ベースラインの作成
./scripts/database/migrate.sh baseline

# 動作確認テスト（設定チェック）
./scripts/database/migrate.sh test
```

#### 方法2: pnpmスクリプトを使用

```bash
# データベース初期化
pnpm backend:migrate:init

# マイグレーション実行
pnpm backend:migrate

# マイグレーション情報の確認
pnpm backend:migrate:info

# データベースをクリーンアップ（注意: 全データが削除されます）
pnpm backend:migrate:clean

# マイグレーションファイルの検証
pnpm backend:migrate:validate

# ベースラインの作成
pnpm backend:migrate:baseline

# 動作確認テスト
pnpm backend:migrate:test
```

#### 方法3: Flyway CLIを直接使用

```bash
cd apps/backend
flyway -configFiles=flyway.conf migrate
```

### テスト環境（CI/CD）

```bash
# データベースをクリーンアップ
flyway -configFiles=apps/backend/flyway.conf clean

# 全マイグレーションを実行
flyway -configFiles=apps/backend/flyway.conf migrate
```

### 本番環境

```bash
# デプロイ時に全マイグレーションを実行
flyway -configFiles=apps/backend/flyway.conf migrate
```

**注意事項**:
- 本番環境でのマイグレーション実行前には必ずバックアップを取得
- マイグレーション実行中はアプリケーションのダウンタイムを考慮
- 大量データが存在する場合、マイグレーション実行時間を事前に確認

## 環境変数

以下の環境変数を設定することで、データベース接続情報を指定できます:

- `DB_HOST`: データベースホスト（デフォルト: localhost）
- `DB_PORT`: データベースポート（デフォルト: 3306）
- `DB_USER`: データベースユーザー（デフォルト: root）
- `DB_PASSWORD`: データベースパスワード（必須）
- `DB_NAME`: データベース名（デフォルト: mrwebdefence）

`.env`ファイルに設定することもできます:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=mrwebdefence
```

## 新しいマイグレーションファイルの作成

1. **Versioned Migrationの場合**:
   ```bash
   # 新しいマイグレーションファイルを作成
   touch apps/backend/src/db/migration/V{N}__{description}.sql
   ```
   
   例: `V3__add_customer_id_to_users.sql`

2. **Repeatable Migrationの場合**:
   ```bash
   # 新しいシードファイルを作成
   touch apps/backend/src/db/seed/R__{description}.sql
   ```
   
   例: `R__insert_initial_roles.sql`

3. **SQLファイルを編集**:
   - UTF-8（BOMなし）で保存
   - トランザクション制御を適切に実装

4. **マイグレーション実行**:
   ```bash
   pnpm backend:migrate
   ```

## ロールバック

Flyway Community Editionでは、`undo`機能は使用できません。ロールバックが必要な場合は、以下の方法を使用します:

1. **ロールフォワード方式（推奨）**:
   - 変更を取り消すための新しいマイグレーションを作成
   - 例: `V4__remove_customer_id_from_users.sql`

2. **手動ロールバック**:
   - データベースを直接操作して変更を取り消す
   - 注意: `flyway_schema_history`テーブルも更新が必要

## Flyway CLIのインストール

### macOS

```bash
# Homebrewを使用
brew install flyway

# インストール確認
flyway --version
```

### Linux

```bash
# 公式サイトからダウンロード
# https://flywaydb.org/documentation/usage/commandline/

# ダウンロード後、PATHに追加
export PATH=$PATH:/path/to/flyway
```

### Windows

1. [Flyway公式サイト](https://flywaydb.org/documentation/usage/commandline/)からダウンロード
2. ZIPファイルを解凍
3. 解凍したディレクトリをPATHに追加

## トラブルシューティング

### 問題: Flyway CLIが見つからない

**解決方法**:
```bash
# macOSの場合
brew install flyway

# インストール確認
flyway --version

# または、公式サイトからダウンロード
# https://flywaydb.org/documentation/usage/commandline/
```

### 問題: マイグレーションファイルが認識されない

**解決方法**:
- ファイルの配置場所を確認（`apps/backend/src/db/migration/`、`apps/backend/src/db/seed/`）
- ファイル名が命名規則に従っているか確認
- `flyway.conf`の`locations`設定を確認

### 問題: チェックサムエラー

**原因**: 既に実行済みのマイグレーションファイルの内容を変更した場合

**解決方法**:
- 既に実行済みのマイグレーションファイルは変更しない
- 変更が必要な場合は、新しいマイグレーションを作成

### 問題: マイグレーション実行時にエラーが発生

**解決方法**:
- エラーメッセージを確認
- データベースの状態を確認
- 必要に応じて、手動で修正してから再実行

## 関連ドキュメント

- [実装計画書](../implementation-plan/MWD-106_schema-management-migration-plan.md)
- [MrWebDefence-Design/db-resources](https://github.com/kencom2400/MrWebDefence-Design/tree/main/db-resources)
- [MrWebDefence-Design/docs/DESIGN.md](https://github.com/kencom2400/MrWebDefence-Design/blob/main/docs/DESIGN.md) - 3.2.8 Flywayマイグレーション設計
- [Flyway公式ドキュメント](https://flywaydb.org/documentation/)
