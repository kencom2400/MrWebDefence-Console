# Flyway Versioned Migrations

このディレクトリには、FlywayのVersioned Migrations（バージョン付きマイグレーション）を配置します。

## 命名規則

**形式**: `V{version}__{description}.sql`

**例**:
- `V1__create_users_table.sql`
- `V2__create_roles_table.sql`
- `V3__add_customer_id_to_users.sql`

## 注意事項

- バージョン番号は一度使用したら変更しない
- 既存のマイグレーションファイル名は変更しない
- ファイルの文字コードはUTF-8（BOMなし）を使用
- 既に実行済みのマイグレーションファイルは変更しない（新しいバージョンとして追加）

## マイグレーションファイルの作成

新しいマイグレーションファイルを作成する場合:

```bash
# 例: V3__add_customer_id_to_users.sql を作成
touch apps/backend/src/db/migration/V3__add_customer_id_to_users.sql
```

## 実行方法

```bash
# マイグレーション実行
pnpm backend:migrate

# または、スクリプトを直接実行
./scripts/database/migrate.sh
```

詳細は [スキーマ管理ドキュメント](../../../../docs/development/schema-management.md) を参照してください。
