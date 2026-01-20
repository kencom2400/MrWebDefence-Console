# MWD-106: 残タスク一覧

## 📋 実装状況

**実装完了日**: 2026-01-17  
**MWD-107実装完了日**: 2026-01-20  
**実装フェーズ**: フェーズ1〜4は完了、フェーズ5・6は未実施
**MWD-107**: DBスキーマの作成及び、DB Dockerの実装完了 ✅

## ✅ 完了済みタスク

### フェーズ1: Flywayの導入とディレクトリ構造の作成 ✅

- ✅ ディレクトリ構造の作成
- ✅ Flyway設定ファイル（`flyway.conf`）の作成
- ✅ `package.json`にスクリプトを追加

### フェーズ2: スキーマ定義の移設 ✅

- ✅ ディレクトリ構造の準備完了
- ✅ **MWD-107でマイグレーションファイルを作成**（2026-01-20完了）
  - V1__create_users_table.sql
  - V2__create_customers_table.sql
  - V3__create_fqdns_table.sql
  - V4__create_ip_allowlists_table.sql
  - R__insert_initial_data.sql（シードファイル）
- ⚠️ **MrWebDefence-Designからの移設**（MrWebDefence-Designにマイグレーションファイルがまだ存在しないため未実施）

### フェーズ3: データベース初期化スクリプトの移設 ✅

- ✅ 初期化スクリプトの移設・統合完了（`migrate.sh init`コマンドとして実装）

### フェーズ4: マイグレーション実行スクリプトの作成 ✅

- ✅ 統合マイグレーションスクリプト（`migrate.sh`）の作成
- ✅ `package.json`にスクリプトを追加

### フェーズ5: NestJSアプリケーションとの統合（オプション） ⚠️

- ⚠️ **未実施**（オプション項目）

### フェーズ6: テスト・検証 ✅

- ✅ **MWD-107で動作確認完了**（2026-01-20）
  - Docker環境でのMySQLサービス実装
  - マイグレーション実行確認
  - テーブル作成確認
  - シードデータ投入確認

## 📝 残タスク

### 1. マイグレーションファイルの移設（必須）

**現状**: MrWebDefence-Designリポジトリの`db-resources/migration/`と`db-resources/seed/`ディレクトリは現在空

**タスク**:
- [ ] MrWebDefence-Designリポジトリにマイグレーションファイルが追加されたら、移設を実施
- [ ] 移設コマンド:
  ```bash
  cp ../MrWebDefence-Design/db-resources/migration/* apps/backend/src/db/migration/
  cp ../MrWebDefence-Design/db-resources/seed/* apps/backend/src/db/seed/
  ```
- [ ] ファイルの命名規則を確認（`V{version}__{description}.sql`、`R__{description}.sql`）
- [ ] 文字コードを確認（UTF-8、BOMなし）

**優先度**: 高（マイグレーションファイルがないと動作確認ができない）

### 2. 動作確認・テスト（必須） ✅

**タスク**:
- [x] Flyway CLIのインストール確認（MWD-107で確認済み）
- [x] データベース接続情報の設定（docker-compose.ymlで設定済み）
- [x] データベース初期化のテスト（MWD-107で実行済み）
- [x] マイグレーション実行のテスト（MWD-107で実行済み）
- [x] マイグレーション情報の確認（MWD-107で確認済み）
- [x] シードデータ投入のテスト（MWD-107で実行済み）

**実装日**: 2026-01-20（MWD-107）  
**優先度**: 高（実装の検証に必要） ✅ **完了**

### 3. NestJSアプリケーションとの統合（オプション）

**タスク**:
- [ ] アプリケーション起動時の自動マイグレーション実行の検討
  - NestJSのライフサイクルフックでFlywayを実行
  - または、起動前スクリプトで実行
- [ ] 既存のデータベース接続プール（MWD-81）との統合確認
  - Flyway実行時の接続設定
  - 接続プールの設定確認

**優先度**: 低（オプション項目、必要に応じて実施）

### 4. CI/CDパイプラインでのテスト（推奨）

**タスク**:
- [x] CI/CDパイプラインにマイグレーション実行ステップを追加（既に実装済み）
- [ ] テスト環境でのマイグレーション実行のテスト（PR作成後に確認予定）
- [ ] `flyway clean`と`flyway migrate`の動作確認（PR作成後に確認予定）

**優先度**: 中（CI/CDパイプラインの整備に必要）
**備考**: CI/CDパイプライン（`.github/workflows/ci.yml`）には既にマイグレーション実行ステップが含まれています。PR作成後に自動実行されます。

### 5. 検証項目の確認

**タスク**:
- [x] スキーマ定義が正しく作成されている（MWD-107で確認済み）
- [x] マイグレーションスクリプトが正しく動作する（MWD-107で確認済み）
- [x] マイグレーション実行スクリプトが正しく動作する（MWD-107で確認済み）
- [ ] テーブル構造の詳細確認（インデックス、外部キー制約など）
- [ ] ロールバック機能が正しく動作する（Flyway Community Editionでは`undo`機能は使用不可）
- [ ] 既存のデータベース接続プールと正常に統合されている
- [ ] 既存のリポジトリ実装と正常に統合されている

**優先度**: 高（実装の検証に必要）
**備考**: 基本的な検証は完了。詳細な検証は追加で実施予定。

## 🎯 次のステップ（優先順位順）

### 即座に実施可能なタスク

1. **Flyway CLIのインストール確認**
   ```bash
   flyway --version
   # インストールされていない場合
   brew install flyway
   ```

2. **環境変数の設定**
   - `.env`ファイルを作成
   - データベース接続情報を設定（`DB_PASSWORD`は必須）

3. **動作確認テストの実行**
   ```bash
   ./scripts/database/migrate.sh test
   ```

### マイグレーションファイルが追加されたら実施

4. **マイグレーションファイルの移設**
   ```bash
   cp ../MrWebDefence-Design/db-resources/migration/* apps/backend/src/db/migration/
   cp ../MrWebDefence-Design/db-resources/seed/* apps/backend/src/db/seed/
   ```

5. **データベース初期化のテスト**
   ```bash
   pnpm backend:migrate:init
   ```

6. **マイグレーション実行のテスト**
   ```bash
   pnpm backend:migrate
   pnpm backend:migrate:info
   ```

### オプション（必要に応じて実施）

7. **NestJSアプリケーションとの統合**
   - アプリケーション起動時の自動マイグレーション実行
   - データベース接続プールとの統合

8. **CI/CDパイプラインでのテスト**
   - テスト環境でのマイグレーション実行
   - CI/CDパイプラインへの統合

## 📚 関連ドキュメント

- [実装完了サマリー](MWD-106_implementation-summary.md)
- [実装計画書](MWD-106_schema-management-migration-plan.md)
- [スキーマ管理ドキュメント](../development/schema-management.md)
- [セットアップガイド](../development/migration-setup-guide.md)
- [統合スクリプトガイド](../development/migrate-script-guide.md)

## 📝 MWD-107実装サマリー

**実装日**: 2026-01-20  
**Issue**: MWD-107 - DBスキーマの作成及び、DB Dockerの実装

### 実装内容

1. **Docker環境でのMySQLサービス実装**
   - `docker-compose.yml`にMySQL 8.4サービスを追加
   - utf8mb4文字コード設定
   - 環境変数での接続情報管理

2. **マイグレーションファイル作成**
   - `V1__create_users_table.sql`: ユーザーテーブル
   - `V2__create_customers_table.sql`: 顧客テーブル
   - `V3__create_fqdns_table.sql`: FQDNテーブル
   - `V4__create_ip_allowlists_table.sql`: IP AllowListテーブル

3. **シードファイル作成**
   - `R__insert_initial_data.sql`: 初期データ投入用（テストユーザー2件）

4. **動作確認**
   - Docker環境でのMySQLサービス起動確認
   - マイグレーション実行確認（5つのマイグレーションが正常に適用）
   - テーブル作成確認
   - シードデータ投入確認

### 修正内容

- `docker-compose.yml`: MySQL 8.4対応（`default-authentication-plugin`オプション削除）
- `apps/backend/flyway.conf`: 接続設定修正（`allowPublicKeyRetrieval=true`追加、パス修正）

---

**最終更新日**: 2026-01-20
