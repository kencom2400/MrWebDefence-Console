# マイグレーション統合ガイド

## 概要

このドキュメントでは、FlywayマイグレーションをNestJSアプリケーションとCI/CDパイプラインに統合する方法を説明します。

## NestJSアプリケーションとの統合

### 自動マイグレーション実行

アプリケーション起動時に自動的にマイグレーションを実行する機能を実装しています。

#### 実装内容

- **MigrationService**: Flywayマイグレーションを実行するサービス
- **MigrationModule**: マイグレーション機能のNestJSモジュール
- **AppModule**: MigrationModuleをインポートして統合

#### 使用方法

環境変数`AUTO_MIGRATE`を`true`に設定することで、アプリケーション起動時に自動的にマイグレーションが実行されます。

```bash
# .envファイルに追加
AUTO_MIGRATE=true
```

または、環境変数として設定:

```bash
AUTO_MIGRATE=true pnpm backend:start:dev
```

#### 動作

1. アプリケーション起動時（`onModuleInit`）に`MigrationService`が実行される
2. `AUTO_MIGRATE=true`の場合、`scripts/database/migrate.sh migrate`を実行
3. マイグレーションが成功した場合、アプリケーションは正常に起動
4. マイグレーションが失敗した場合:
   - **本番環境**: アプリケーションは起動しない（エラーで停止）
   - **開発環境**: 警告を表示して起動を継続

#### 設定

環境変数でデータベース接続情報を設定:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=mrwebdefence
```

### データベース接続プールとの統合

既存のデータベース接続プール（MWD-81）とは独立して動作します。

- Flywayは独自の接続を使用してマイグレーションを実行
- アプリケーションの接続プールには影響しない
- マイグレーション実行後、接続プールが正常に動作することを確認

## CI/CDパイプラインとの統合

### GitHub Actionsでのマイグレーション実行

`.github/workflows/ci.yml`にマイグレーション実行ステップを追加しています。

#### 実装内容

1. **MySQLサービスの起動**: GitHub ActionsのサービスとしてMySQL 8.4を起動
2. **Flyway CLIのインストール**: マイグレーション実行のためにFlyway CLIをインストール
3. **マイグレーション実行**: テスト環境でマイグレーションを実行
4. **E2Eテスト実行**: マイグレーション後のデータベースでE2Eテストを実行

#### 実行フロー

```yaml
1. MySQLサービスの起動
2. Flyway CLIのインストール
3. マイグレーション実行（migrate:test → migrate）
4. E2Eテスト実行
```

#### 環境変数

CI/CDパイプラインでは以下の環境変数が設定されます:

```yaml
DB_HOST: localhost
DB_PORT: 3306
DB_USER: root
DB_PASSWORD: test-password
DB_NAME: mrwebdefence_test
```

### ローカルでのテスト

CI/CDパイプラインと同じ環境でテストする場合:

```bash
# MySQLを起動（Docker Composeを使用）
docker-compose up -d mysql

# マイグレーション実行
DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD=test-password DB_NAME=mrwebdefence_test pnpm backend:migrate

# E2Eテスト実行
DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD=test-password DB_NAME=mrwebdefence_test pnpm backend:test:e2e
```

## トラブルシューティング

### 問題: アプリケーション起動時にマイグレーションが実行されない

**原因**: `AUTO_MIGRATE`環境変数が`true`に設定されていない

**解決方法**:
```bash
# .envファイルに追加
AUTO_MIGRATE=true
```

### 問題: マイグレーション実行時にエラーが発生する

**原因**: Flyway CLIがインストールされていない、またはデータベース接続情報が正しくない

**解決方法**:
1. Flyway CLIのインストール確認
2. データベース接続情報の確認
3. データベースが起動していることを確認

### 問題: CI/CDパイプラインでマイグレーションが失敗する

**原因**: MySQLサービスが起動していない、または接続情報が正しくない

**解決方法**:
1. GitHub ActionsのログでMySQLサービスの状態を確認
2. 環境変数が正しく設定されていることを確認
3. マイグレーションファイルが存在することを確認

## ベストプラクティス

### 開発環境

- `AUTO_MIGRATE=false`（デフォルト）で開発し、必要に応じて手動でマイグレーションを実行
- マイグレーションファイルを追加したら、手動でマイグレーションを実行して確認

### 本番環境

- `AUTO_MIGRATE=true`に設定して、デプロイ時に自動的にマイグレーションを実行
- マイグレーション実行前にデータベースのバックアップを取得
- マイグレーション実行中はアプリケーションのダウンタイムを考慮

### CI/CDパイプライン

- すべてのテストの前にマイグレーションを実行
- マイグレーション実行後、データベースの状態を確認
- E2Eテストでマイグレーション後のデータベースを使用

## 関連ドキュメント

- [スキーマ管理ドキュメント](schema-management.md)
- [統合スクリプトガイド](migrate-script-guide.md)
- [セットアップガイド](migration-setup-guide.md)
