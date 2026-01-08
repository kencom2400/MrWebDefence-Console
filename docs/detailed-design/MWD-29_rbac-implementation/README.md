# RBAC（ロールベースアクセス制御）実装設計書

## 概要

本設計書は、MWD-29「Task 3.3: RBAC実装」の詳細設計を定義します。

### 目的

ユーザーの役割（ロール）に基づいたアクセス制御機能を提供し、不正なアクセスや権限昇格を防ぐことを目的とします。

### スコープ

- ロール定義とユーザーエンティティへの追加
- `@Roles` デコレータの実装
- `RolesGuard` の実装
- 既存の認証機能との統合

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - RolesGuard (New)                 │
│  - Roles Decorator (New)            │
│  - AuthController (Modified)        │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - (既存のUseCases)                  │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - UserRole Enum (New)              │
│  - User Entity (Modified)           │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - UserRepository (Modified)        │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **認証**: JWT + Guard
- **認可**: Custom Decorator + Guard

## 主要コンポーネント

### 1. Domain Layer

- **UserRole Enum**: 定義されたロール（`SERVICE_ADMIN`, `SERVICE_MEMBER` など）
- **User Entity**: `role` プロパティを追加

### 2. Presentation Layer

- **Roles Decorator**: エンドポイントに必要なロールを指定するメタデータデコレータ
- **RolesGuard**: 現在のユーザーのロールとエンドポイントに必要なロールを比較し、アクセス可否を判定

## データフロー

1. リクエスト受信（`JwtAuthGuard` がユーザーを認証し、`request.user` にセット）
2. `RolesGuard` が実行される
3. ハンドラーに設定された `@Roles` メタデータを取得
4. `request.user.role` と必要なロールを比較
5. 権限があれば処理続行、なければ `ForbiddenException`

## セキュリティ考慮事項

- デフォルトでアクセス拒否（Allowリスト方式）を検討（今回は明示的なガード適用で対応）
- ロール情報の改ざん防止（JWT署名による検証）

## 参照資料

- Issue: [MWD-29](https://kencom2400.atlassian.net/browse/MWD-29)

