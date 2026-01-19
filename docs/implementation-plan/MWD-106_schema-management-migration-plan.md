# MWD-106: スキーマ管理の仕組み移設実装計画

## 📋 概要

**Issue**: MWD-106 - スキーマ管理の仕組みをMrWebDefence-DesignからMrWebDefence-Consoleに移設する  
**ステータス**: 実装完了  
**参照**: [MrWebDefence-Design/db-resources](https://github.com/kencom2400/MrWebDefence-Design/tree/main/db-resources)

## 🎯 目的

現在、Databaseのスキーマ管理をMrWebDefence-Designで行っていますが、DB情報の更新・取得はAPI経由で実施するため、DBスキーマ管理は本レポジトリ（MrWebDefence-Console）に移設する必要があります。

## 📝 要件分析

### 現状確認

1. **MrWebDefence-Designリポジトリ**
   - **スキーマ管理ツール**: Flywayを使用
   - **ディレクトリ構造**:
     - `db-resources/migration/`: Versioned Migrations（`V{version}__{description}.sql`）
     - `db-resources/seed/`: Repeatable Migrations（`R__{description}.sql`）
   - **配信方法**: 現在は手動コピー、将来的にはGitサブモジュールやCI/CD自動配信を検討
   - **配信先パス**: `src/main/resources/db/`（Javaプロジェクトの構造）

2. **MrWebDefence-Consoleリポジトリ（本リポジトリ）**
   - スキーマ管理の仕組みは未実装
   - データベース接続プールは実装済み（MWD-81）
   - NestJS（TypeScript）プロジェクトのため、Javaプロジェクトの構造とは異なる
   - Flywayの導入が必要

### 要件の詳細

1. **移設対象**
   - Flywayマイグレーションファイル（`db-resources/migration/`内のVersioned Migrations）
   - Flywayシードファイル（`db-resources/seed/`内のRepeatable Migrations）
   - データベース初期化スクリプト（`scripts/database/init-database.sh`）

2. **移設後の構成**
   - Flywayを使用したスキーマ管理
   - NestJSプロジェクトに適したディレクトリ構造
   - マイグレーション実行方法（アプリケーション起動時または手動実行）

3. **技術スタック**
   - **Flyway**: マイグレーション管理ツール（確定）
   - **MySQL 8.4系**: データベース（確定）
   - **utf8mb4**: 文字コード（確定）

## 🔍 確認事項（実装前に要確認）

### 1. MrWebDefence-Designリポジトリについて

- [x] MrWebDefence-Designリポジトリの場所・アクセス方法 → `/Users/kencom/github/MrWebDefence-Design`
- [x] 現在のスキーマ管理の実装方法 → **Flywayを使用**
- [x] スキーマ定義ファイルの場所 → `db-resources/migration/`、`db-resources/seed/`
- [x] マイグレーションスクリプトの場所 → `db-resources/migration/`（Versioned Migrations）
- [x] スキーマ管理ツール・スクリプトの場所 → `scripts/database/init-database.sh`

### 2. 移設後の構成について

- [ ] スキーマ管理のディレクトリ構造（NestJSプロジェクトに適した構造を決定）
  - 案1: `apps/backend/src/db/migration/`、`apps/backend/src/db/seed/`
  - 案2: `apps/backend/db/migration/`、`apps/backend/db/seed/`
  - 案3: `database/migration/`、`database/seed/`（プロジェクトルート）
- [ ] Flywayの設定方法
  - NestJSアプリケーション起動時に自動実行するか
  - 手動実行（CLIコマンド）のみか
  - 両方サポートするか
- [ ] スキーマバージョン管理
  - Flywayの`flyway_schema_history`テーブルで管理（確定）

### 3. 技術スタックについて

- [x] マイグレーションツール → **Flyway（確定）**
- [x] データベース → **MySQL 8.4系（確定）**
- [x] 文字コード → **utf8mb4（確定）**
- [ ] Flywayの導入方法
  - Flyway CLIを使用するか
  - Flyway Node.jsパッケージを使用するか
  - NestJS用のFlywayパッケージを使用するか

### 4. 既存コードとの統合について

- [ ] 既存のデータベース接続プール（MWD-81）との統合方法
- [ ] 既存のリポジトリ実装との統合
- [ ] 既存のエンティティ定義との統合（現時点ではエンティティ定義は未実装）

## 🏗️ アーキテクチャ設計

### ディレクトリ構造（推奨）

NestJSプロジェクトに適した構造として、以下のいずれかを推奨します：

**案1: `apps/backend/src/db/`配下（推奨）**
```
apps/backend/
├── src/
│   ├── db/                  # データベース関連リソース（新規）
│   │   ├── migration/      # Flyway Versioned Migrations
│   │   │   ├── V1__create_users_table.sql
│   │   │   └── V2__create_roles_table.sql
│   │   └── seed/           # Flyway Repeatable Migrations
│   │       └── R__insert_initial_roles.sql
│   └── ...
├── scripts/
│   └── database/            # データベース関連スクリプト（新規）
│       ├── init-database.sh
│       └── migrate.sh
└── ...
```

**案2: `apps/backend/db/`配下（ビルド成果物に含めない場合）**
```
apps/backend/
├── db/                      # データベース関連リソース（新規）
│   ├── migration/
│   └── seed/
├── src/
└── scripts/
    └── database/
```

**案3: プロジェクトルート（複数アプリで共有する場合）**
```
MrWebDefence-Console/
├── database/                # データベース関連リソース（新規）
│   ├── migration/
│   └── seed/
├── apps/
│   └── backend/
└── scripts/
    └── database/
```

**推奨**: 案1（`apps/backend/src/db/`配下）
- NestJSの標準的な構造に近い
- ビルド時にリソースとして含めることができる
- アプリケーション固有のリソースとして管理しやすい

### Flyway設定

**flyway.conf**（Flyway CLI用）:
```properties
flyway.url=jdbc:mysql://localhost:3306/mrwebdefence
flyway.user=${DB_USER}
flyway.password=${DB_PASSWORD}
flyway.locations=filesystem:apps/backend/src/db/migration,filesystem:apps/backend/src/db/seed
flyway.baselineOnMigrate=true
flyway.validateOnMigrate=true
```

### マイグレーション実行フロー

1. **開発環境**
   ```bash
   # 手動実行（Flyway CLI）
   flyway migrate
   
   # または、pnpmスクリプト経由
   pnpm backend:migrate
   
   # アプリケーション起動時に自動実行（オプション）
   pnpm backend:start:dev
   ```

2. **テスト環境（CI/CD）**
   ```bash
   # データベースをクリーンアップ
   flyway clean
   
   # 全マイグレーションを実行
   flyway migrate
   ```

3. **本番環境**
   ```bash
   # デプロイ時に全マイグレーションを実行
   flyway migrate
   ```

## 📦 実装計画

### フェーズ1: Flywayの導入とディレクトリ構造の作成

1. **Flywayの導入**
   - Flyway CLIのインストール確認または導入
   - または、Flyway Node.jsパッケージの導入検討
   - `package.json`にFlyway関連のスクリプトを追加

2. **ディレクトリ構造の作成**
   ```bash
   mkdir -p apps/backend/src/db/migration
   mkdir -p apps/backend/src/db/seed
   mkdir -p scripts/database
   ```

3. **Flyway設定ファイルの作成**
   - `flyway.conf`の作成
   - 環境変数による設定の読み込み

### フェーズ2: スキーマ定義の移設

1. **MrWebDefence-Designからスキーマ定義をコピー**
   ```bash
   # migrationディレクトリの内容をコピー
   cp -r ../MrWebDefence-Design/db-resources/migration/* apps/backend/src/db/migration/
   
   # seedディレクトリの内容をコピー
   cp -r ../MrWebDefence-Design/db-resources/seed/* apps/backend/src/db/seed/
   ```

2. **ファイルの確認**
   - 命名規則の確認（`V{version}__{description}.sql`、`R__{description}.sql`）
   - 文字コードの確認（UTF-8、BOMなし）

### フェーズ3: データベース初期化スクリプトの移設

1. **初期化スクリプトのコピー**
   ```bash
   cp ../MrWebDefence-Design/scripts/database/init-database.sh scripts/database/
   chmod +x scripts/database/init-database.sh
   ```

2. **スクリプトの動作確認**
   - 開発環境での動作確認

### フェーズ4: マイグレーション実行スクリプトの作成

1. **マイグレーション実行スクリプトの作成**
   - `scripts/database/migrate.sh`の作成
   - `package.json`にスクリプトを追加（`pnpm backend:migrate`など）

2. **開発環境での動作確認**
   - マイグレーション実行のテスト
   - エラーハンドリングの確認

### フェーズ5: NestJSアプリケーションとの統合（オプション）

1. **アプリケーション起動時の自動実行**
   - NestJSのライフサイクルフックでFlywayを実行
   - または、起動前スクリプトで実行

2. **既存のデータベース接続プールとの統合**
   - 接続プールの設定確認
   - Flyway実行時の接続設定

### フェーズ6: テスト・検証

1. **開発環境でのテスト**
   - マイグレーション実行のテスト
   - データベース初期化のテスト
   - シードデータ投入のテスト

2. **CI/CDパイプラインでのテスト**
   - テスト環境でのマイグレーション実行
   - `flyway clean`と`flyway migrate`の動作確認

3. **ドキュメントの作成**
   - `docs/development/schema-management.md`の作成
   - 使用方法、トラブルシューティング情報の記載

## 📝 実装手順（詳細）

### ステップ1: Flywayの導入

#### 1.1 Flyway CLIのインストール確認

```bash
# Flyway CLIがインストールされているか確認
flyway --version

# インストールされていない場合、Homebrewでインストール（macOS）
brew install flyway

# または、公式サイトからダウンロード
# https://flywaydb.org/documentation/usage/commandline/
```

#### 1.2 ディレクトリ構造の作成

```bash
cd /Users/kencom/github/MrWebDefence-Console

# ディレクトリ構造の作成
mkdir -p apps/backend/src/db/migration
mkdir -p apps/backend/src/db/seed
mkdir -p scripts/database
```

#### 1.3 Flyway設定ファイルの作成

`apps/backend/flyway.conf`を作成:

```properties
flyway.url=jdbc:mysql://${DB_HOST:-localhost}:${DB_PORT:-3306}/${DB_NAME:-mrwebdefence}
flyway.user=${DB_USER}
flyway.password=${DB_PASSWORD}
flyway.locations=filesystem:apps/backend/src/db/migration,filesystem:apps/backend/src/db/seed
flyway.baselineOnMigrate=true
flyway.validateOnMigrate=true
flyway.encoding=UTF-8
```

### ステップ2: スキーマ定義の移設

#### 2.1 MrWebDefence-Designからスキーマ定義をコピー

```bash
# migrationディレクトリの内容をコピー
cp -r ../MrWebDefence-Design/db-resources/migration/* apps/backend/src/db/migration/

# seedディレクトリの内容をコピー
cp -r ../MrWebDefence-Design/db-resources/seed/* apps/backend/src/db/seed/
```

#### 2.2 ファイルの確認

```bash
# ファイル一覧の確認
ls -la apps/backend/src/db/migration/
ls -la apps/backend/src/db/seed/

# 命名規則の確認（V{version}__{description}.sql、R__{description}.sql）
# 文字コードの確認（UTF-8、BOMなし）
```

### ステップ3: データベース初期化スクリプトの移設

```bash
# 初期化スクリプトのコピー
cp ../MrWebDefence-Design/scripts/database/init-database.sh scripts/database/
chmod +x scripts/database/init-database.sh

# 動作確認
./scripts/database/init-database.sh --help
```

### ステップ4: マイグレーション実行スクリプトの作成

#### 4.1 マイグレーション実行スクリプトの作成

`scripts/database/migrate.sh`を作成:

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_ROOT}"

# 環境変数の読み込み
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Flywayの実行
flyway -configFiles=apps/backend/flyway.conf migrate

echo "✅ マイグレーションが完了しました"
```

実行権限を付与:
```bash
chmod +x scripts/database/migrate.sh
```

#### 4.2 package.jsonにスクリプトを追加

`apps/backend/package.json`に追加:

```json
{
  "scripts": {
    "migrate": "bash ../../scripts/database/migrate.sh",
    "migrate:clean": "flyway -configFiles=flyway.conf clean",
    "migrate:info": "flyway -configFiles=flyway.conf info"
  }
}
```

### ステップ5: 動作確認

#### 5.1 開発環境でのテスト

```bash
# データベースの初期化
./scripts/database/init-database.sh

# マイグレーションの実行
pnpm backend:migrate

# マイグレーション情報の確認
pnpm backend:migrate:info
```

#### 5.2 エラーハンドリングの確認

- マイグレーションファイルの構文エラー
- データベース接続エラー
- 既存データとの競合

### ステップ6: ドキュメント作成

`docs/development/schema-management.md`を作成し、以下を記載:
- スキーマ管理の概要
- ディレクトリ構造の説明
- マイグレーション実行方法
- トラブルシューティング情報

## ✅ 検証項目

- [ ] スキーマ定義が正しく移設されている
- [ ] マイグレーションスクリプトが正しく動作する
- [ ] マイグレーション実行スクリプトが正しく動作する
- [ ] ロールバック機能が正しく動作する
- [ ] 既存のデータベース接続プールと正常に統合されている
- [ ] 既存のリポジトリ実装と正常に統合されている

## 🚨 リスクと対策

### リスク1: MrWebDefence-Designリポジトリのマイグレーションファイルが空

**現状**: `db-resources/migration/`と`db-resources/seed/`ディレクトリは現在空の状態

**対策**: 
- マイグレーションファイルが作成されたら、その時点で移設を実施
- 移設手順をドキュメント化し、今後のマイグレーションファイル追加時に自動的に適用できるようにする

### リスク2: Javaプロジェクトの構造（`src/main/resources/db/`）とNestJSプロジェクトの構造の違い

**対策**: 
- NestJSプロジェクトに適したディレクトリ構造（`apps/backend/src/db/`）を採用
- Flywayの`locations`設定で適切なパスを指定
- `filesystem:`を使用してファイルシステム上のパスを指定

### リスク3: Flyway CLIの導入・設定

**対策**: 
- Flyway CLIのインストール手順をドキュメント化
- 環境変数による設定の読み込みを実装
- Dockerコンテナ内でFlywayを実行する方法も検討

### リスク4: 既存のデータベース接続プールとの統合

**対策**: 
- 既存のデータベース接続プール（MWD-81）の設定を確認
- Flyway実行時は別の接続を使用するか、接続プールの設定を確認
- 必要に応じて、Flyway専用の接続設定を作成

### リスク5: マイグレーション実行時のエラーハンドリング

**対策**: 
- マイグレーション実行前のバリデーションを有効化（`validateOnMigrate=true`）
- エラー発生時のロールバック手順をドキュメント化
- テスト環境での十分な検証を実施

## 📚 参考資料

- [Flyway公式ドキュメント](https://flywaydb.org/documentation/)
- [MrWebDefence-Design/db-resources](https://github.com/kencom2400/MrWebDefence-Design/tree/main/db-resources)
- [MrWebDefence-Design/docs/DB_RESOURCES_DISTRIBUTION.md](../MrWebDefence-Design/docs/DB_RESOURCES_DISTRIBUTION.md)
- [MrWebDefence-Design/docs/DESIGN.md](../MrWebDefence-Design/docs/DESIGN.md) - 3.2.8 Flywayマイグレーション設計

## 🎯 次のステップ

1. **要件確認**: Issueの詳細説明を完全に取得
2. **調査**: MrWebDefence-Designリポジトリの構造を確認
3. **設計レビュー**: この実装計画をレビュー
4. **実装開始**: レビュー承認後に実装開始

---

**作成日**: 2026-01-17  
**作成者**: AI Assistant  
**ステータス**: レビュー待ち
