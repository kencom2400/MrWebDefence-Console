# 顧客管理機能実装設計書

## 概要

本設計書は、MWD-34「Task 4.2: 顧客管理機能実装」の詳細設計を定義します。

### 目的

顧客の登録・編集・削除、有効/無効化を管理できる機能を実装します。顧客情報を一元管理し、検索や一覧表示を通じて効率的に顧客を管理できるようにします。

### スコープ

- 顧客登録API実装（POST /api/v1/customers）
- 顧客編集API実装（PUT /api/v1/customers/:id）
- 顧客削除API実装（DELETE /api/v1/customers/:id）
- 顧客一覧取得API実装（GET /api/v1/customers）
- 顧客詳細取得API実装（GET /api/v1/customers/:id）
- 顧客検索API実装（GET /api/v1/customers/search）
- 顧客有効/無効化API実装（PATCH /api/v1/customers/:id/status）

## アーキテクチャ

### アーキテクチャパターン

Onion Architecture（オニオンアーキテクチャ）に従い、レイヤを明確に分離します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - CustomerController                │
│  - DTOs (CreateCustomerDto, etc.)  │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                   │
│  - CreateCustomerUseCase            │
│  - UpdateCustomerUseCase            │
│  - DeleteCustomerUseCase            │
│  - GetCustomerListUseCase           │
│  - GetCustomerByIdUseCase           │
│  - SearchCustomersUseCase           │
│  - ToggleCustomerStatusUseCase       │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - Customer Entity                  │
│  - CustomerStatus Value Object      │
│  - ICustomerRepository (interface) │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - CustomerRepository (implementation)│
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **バリデーション**: class-validator, class-transformer
- **データベース**: 現段階ではインメモリ実装、将来はTypeORM/PrismaでDB接続

## 主要コンポーネント

### 1. Presentation Layer

- **CustomerController**: 顧客関連のHTTPエンドポイントを提供
- **CreateCustomerDto**: 顧客作成リクエストのDTO
- **UpdateCustomerDto**: 顧客更新リクエストのDTO
- **CustomerResponseDto**: 顧客レスポンスのDTO
- **CustomerListResponseDto**: 顧客一覧レスポンスのDTO

### 2. Application Layer

- **CreateCustomerUseCase**: 顧客作成処理のユースケース
- **UpdateCustomerUseCase**: 顧客更新処理のユースケース
- **DeleteCustomerUseCase**: 顧客削除処理のユースケース
- **GetCustomerListUseCase**: 顧客一覧取得処理のユースケース
- **GetCustomerByIdUseCase**: 顧客詳細取得処理のユースケース
- **SearchCustomersUseCase**: 顧客検索処理のユースケース
- **ToggleCustomerStatusUseCase**: 顧客有効/無効化処理のユースケース

### 3. Domain Layer

- **Customer Entity**: 顧客エンティティ
- **CustomerStatus Value Object**: 顧客ステータス（有効/無効）の値オブジェクト
- **ICustomerRepository**: 顧客リポジトリのインターフェース

### 4. Infrastructure Layer

- **CustomerRepository**: 顧客リポジトリの実装（現段階ではインメモリ）

## データフロー

### 顧客作成フロー

1. クライアントが顧客作成リクエストを送信
2. CustomerControllerがリクエストを受信し、バリデーション
3. CreateCustomerUseCaseが顧客作成処理を実行
4. CustomerRepositoryが顧客情報を保存
5. レスポンスとして顧客情報を返却

### 顧客一覧取得フロー

1. クライアントが顧客一覧取得リクエストを送信
2. CustomerControllerがリクエストを受信
3. GetCustomerListUseCaseが顧客一覧取得処理を実行
4. CustomerRepositoryが顧客一覧を取得
5. レスポンスとして顧客一覧を返却

### 顧客検索フロー

1. クライアントが顧客検索リクエストを送信（検索条件を含む）
2. CustomerControllerがリクエストを受信
3. SearchCustomersUseCaseが顧客検索処理を実行
4. CustomerRepositoryが検索条件に基づいて顧客を検索
5. レスポンスとして検索結果を返却

## セキュリティ考慮事項

- 認証・認可: 管理者権限が必要な操作（削除、有効/無効化）は適切に保護
- 入力バリデーション: すべての入力データをバリデーション
- データ保護: 顧客情報の機密性を保護
- ログ記録: 顧客情報の変更履歴を記録（将来実装）

## 参照資料

- Issue: [MWD-34](https://kencom2400.atlassian.net/browse/MWD-34)

