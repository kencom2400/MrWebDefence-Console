# MWD-106: 残タスク一覧

## 📋 実装状況

**実装完了日**: 2026-01-17  
**実装フェーズ**: フェーズ1〜4は完了、フェーズ5・6は未実施

## ✅ 完了済みタスク

### フェーズ1: Flywayの導入とディレクトリ構造の作成 ✅

- ✅ ディレクトリ構造の作成
- ✅ Flyway設定ファイル（`flyway.conf`）の作成
- ✅ `package.json`にスクリプトを追加

### フェーズ2: スキーマ定義の移設 ⚠️

- ✅ ディレクトリ構造の準備完了
- ⚠️ **マイグレーションファイルの移設**（MrWebDefence-Designにマイグレーションファイルがまだ存在しないため未実施）

### フェーズ3: データベース初期化スクリプトの移設 ✅

- ✅ 初期化スクリプトの移設・統合完了（`migrate.sh init`コマンドとして実装）

### フェーズ4: マイグレーション実行スクリプトの作成 ✅

- ✅ 統合マイグレーションスクリプト（`migrate.sh`）の作成
- ✅ `package.json`にスクリプトを追加

### フェーズ5: NestJSアプリケーションとの統合（オプション） ⚠️

- ⚠️ **未実施**（オプション項目）

### フェーズ6: テスト・検証 ⚠️

- ⚠️ **未実施**（マイグレーションファイルがないため）

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

### 2. 動作確認・テスト（必須）

**タスク**:
- [ ] Flyway CLIのインストール確認
- [ ] データベース接続情報の設定（`.env`ファイル）
- [ ] データベース初期化のテスト（`pnpm backend:migrate:init`）
- [ ] マイグレーション実行のテスト（`pnpm backend:migrate`）
- [ ] マイグレーション情報の確認（`pnpm backend:migrate:info`）
- [ ] シードデータ投入のテスト（`--seed`オプション付き）

**優先度**: 高（実装の検証に必要）

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
- [ ] テスト環境でのマイグレーション実行のテスト
- [ ] `flyway clean`と`flyway migrate`の動作確認
- [ ] CI/CDパイプラインにマイグレーション実行ステップを追加

**優先度**: 中（CI/CDパイプラインの整備に必要）

### 5. 検証項目の確認

**タスク**:
- [ ] スキーマ定義が正しく移設されている
- [ ] マイグレーションスクリプトが正しく動作する
- [ ] マイグレーション実行スクリプトが正しく動作する
- [ ] ロールバック機能が正しく動作する（Flyway Community Editionでは`undo`機能は使用不可）
- [ ] 既存のデータベース接続プールと正常に統合されている
- [ ] 既存のリポジトリ実装と正常に統合されている

**優先度**: 高（実装の検証に必要）

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
   - データベース接続情報を設定

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

---

**最終更新日**: 2026-01-17
