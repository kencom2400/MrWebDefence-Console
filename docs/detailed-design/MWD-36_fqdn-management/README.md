# FQDN管理機能実装設計書

## 概要

本設計書は、MWD-36「Task 4.4: FQDN管理機能実装」の詳細設計を定義します。

### 目的

FQDN（Fully Qualified Domain Name）の登録・編集・削除、有効/無効化を管理できる機能を実装します。FQDN情報を一元管理し、検索や一覧表示を通じて効率的にFQDNを管理できるようにします。

### スコープ

- FQDN登録API実装（POST /api/v1/fqdns）
- FQDN編集API実装（PATCH /api/v1/fqdns/:id）
- FQDN削除API実装（DELETE /api/v1/fqdns/:id）
- FQDN一覧取得・検索API実装（GET /api/v1/fqdns、検索クエリパラメータ対応）
- FQDN詳細取得API実装（GET /api/v1/fqdns/:id）
- FQDNステータス更新API実装（PATCH /api/v1/fqdns/:id/status）

## アーキテクチャ

### アーキテクチャパターン

Onion Architecture（オニオンアーキテクチャ）に従い、レイヤを明確に分離します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - FqdnController                    │
│  - DTOs (CreateFqdnDto, etc.)        │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                   │
│  - CreateFqdnUseCase                │
│  - UpdateFqdnUseCase                │
│  - DeleteFqdnUseCase                │
│  - GetFqdnListUseCase               │
│  - GetFqdnByIdUseCase               │
│  - UpdateFqdnStatusUseCase          │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - Fqdn Entity                      │
│  - FqdnStatus Value Object          │
│  - IFqdnRepository (interface)     │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - FqdnRepository (implementation)  │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **バリデーション**: class-validator, class-transformer
- **データベース**: 現段階ではインメモリ実装、将来はTypeORM/PrismaでDB接続

## 主要コンポーネント

### 1. Presentation Layer

- **FqdnController**: FQDN関連のHTTPエンドポイントを提供
- **CreateFqdnDto**: FQDN作成リクエストのDTO
- **UpdateFqdnDto**: FQDN更新リクエストのDTO
- **FqdnResponseDto**: FQDNレスポンスのDTO
- **FqdnListResponseDto**: FQDN一覧レスポンスのDTO

### 2. Application Layer

- **CreateFqdnUseCase**: FQDN作成処理のユースケース
- **UpdateFqdnUseCase**: FQDN更新処理のユースケース
- **DeleteFqdnUseCase**: FQDN削除処理のユースケース
- **GetFqdnListUseCase**: FQDN一覧取得・検索処理のユースケース（検索クエリパラメータ対応）
- **GetFqdnByIdUseCase**: FQDN詳細取得処理のユースケース
- **UpdateFqdnStatusUseCase**: FQDNステータス更新処理のユースケース

### 3. Domain Layer

- **Fqdn Entity**: FQDNエンティティ
- **FqdnStatus Value Object**: FQDNステータス（有効/無効）の値オブジェクト
- **IFqdnRepository**: FQDNリポジトリのインターフェース

### 4. Infrastructure Layer

- **FqdnRepository**: FQDNリポジトリの実装（現段階ではインメモリ）

## データフロー

### FQDN作成フロー

1. クライアントがFQDN作成リクエストを送信
2. FqdnControllerがリクエストを受信し、バリデーション
3. CreateFqdnUseCaseがFQDN作成処理を実行
4. FqdnRepositoryがFQDN情報を保存
5. レスポンスとしてFQDN情報を返却

### FQDN一覧取得・検索フロー

1. クライアントがFQDN一覧取得・検索リクエストを送信（検索条件はクエリパラメータで指定）
2. FqdnControllerがリクエストを受信
3. GetFqdnListUseCaseがFQDN一覧取得・検索処理を実行
4. FqdnRepositoryが検索条件に基づいてFQDNを取得（検索条件がない場合は全件取得）
5. レスポンスとしてFQDN一覧を返却

## セキュリティ考慮事項

- 認証・認可: 管理者権限が必要な操作（削除、有効/無効化）は適切に保護
- 入力バリデーション: すべての入力データをバリデーション（FQDN形式の検証）
- データ保護: FQDN情報の機密性を保護
- ログ記録: FQDN情報の変更履歴を記録（将来実装）

## 参照資料

- Issue: [MWD-36](https://kencom2400.atlassian.net/browse/MWD-36)

