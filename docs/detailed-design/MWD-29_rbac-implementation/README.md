# RBAC（ロールベースアクセス制御）実装設計書

## 概要

本設計書は、MWD-29「Task 3.3: RBAC実装」の詳細設計を定義します。

### 目的

ユーザーの役割（ロール）に基づいたアクセス制御機能を提供し、不正なアクセスや権限昇格を防ぐことを目的とします。

### スコープ

- ロール定義とユーザーエンティティへの追加
- `@Roles` デコレータの実装
- `RolesGuard` の実装
- 既存の認証機能（LoginUseCase/JwtService）の修正（JWTペイロードへのロール追加）
- 既存データの移行計画

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - RolesGuard (New - Global)        │
│  - Roles Decorator (New)            │
│  - Public Decorator (New)           │
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
│  - JwtService (Modified)            │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **認証**: JWT + Guard
- **認可**: Custom Decorator + Guard (Global Scope)

## 主要コンポーネント

### 1. Domain Layer

- **UserRole Enum**: 定義されたロール（`SERVICE_ADMIN`, `SERVICE_MEMBER` など）
- **User Entity**: `role` プロパティを追加

### 2. Presentation Layer

- **Roles Decorator**: エンドポイントに必要なロールを指定するメタデータデコレータ
- **Public Decorator**: 認証/認可をバイパスするエンドポイントを指定するデコレータ
- **RolesGuard**: 
  - グローバルガードとして適用
  - `@Roles` が指定されている場合：ユーザーのロールと照合
  - `@Public` が指定されている場合：許可
  - **どちらも指定されていない場合：拒否（Fail Safe）**

## データフロー

1. **ログイン処理（変更点）**
   - `LoginUseCase` がユーザー認証に成功
   - `JwtService` がJWTを生成する際、ペイロードに `role` を含める

2. **リクエスト受信（認可フロー）**
   - `JwtAuthGuard` がユーザーを認証し、`request.user` にセット（JWTペイロードから `role` も復元される）
   - `RolesGuard` が実行される
   - ハンドラーのメタデータをチェック
     - `@Public` がある → 許可
     - `@Roles` がある → `request.user.role` と比較して判定
     - メタデータなし → **拒否** (`ForbiddenException`)

## セキュリティ考慮事項

- **Default Deny (デフォルト拒否)**: ガードの付け忘れによる事故を防ぐため、明示的に許可されたエンドポイント以外はアクセス不可とする。
- **Fail Safe**: `@Roles` 指定がないエンドポイントは、意図せず公開されるのを防ぐため、デフォルトでアクセスを拒否する。
- **JWT Integrity**: ロール情報の改ざん防止（JWT署名による検証）。

## 参照資料

- Issue: [MWD-29](https://kencom2400.atlassian.net/browse/MWD-29)
