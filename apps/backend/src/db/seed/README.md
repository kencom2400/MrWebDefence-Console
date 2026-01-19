# Flyway Repeatable Migrations

このディレクトリには、FlywayのRepeatable Migrations（繰り返し可能なマイグレーション）を配置します。
初期データ投入用のSQLファイルを配置します。

## 命名規則

**形式**: `R__{description}.sql`

**例**:
- `R__insert_initial_roles.sql`
- `R__insert_initial_password_policy.sql`
- `R__insert_initial_batch_schedules.sql`

## 特徴

- バージョン番号を持たない（`R`プレフィックスを使用）
- チェックサムが変更された場合に再実行される
- 実行順序は、バージョン付きマイグレーションの後に実行される
- 複数のRepeatable Migrationsがある場合、ファイル名の辞書順で実行される

## 注意事項

- 初期データ投入用SQLは、既存データを上書きしないように`INSERT IGNORE`や`ON DUPLICATE KEY UPDATE`を使用する
- ファイルの文字コードはUTF-8（BOMなし）を使用

## シードファイルの作成

新しいシードファイルを作成する場合:

```bash
# 例: R__insert_initial_roles.sql を作成
touch apps/backend/src/db/seed/R__insert_initial_roles.sql
```

## 実行方法

初期データ投入を含むマイグレーションを実行する場合:

```bash
# データベース初期化時に初期データ投入を含める
./scripts/database/init-database.sh -h localhost -u root -p password -d mrwebdefence --seed

# または、環境変数を使用
INCLUDE_SEED=true ./scripts/database/init-database.sh
```

詳細は [スキーマ管理ドキュメント](../../../../docs/development/schema-management.md) を参照してください。
