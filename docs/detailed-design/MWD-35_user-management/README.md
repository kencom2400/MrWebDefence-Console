# ユーザー管理機能実装設計書

## 概要

本設計書は、MWD-35「Task 4.3: ユーザー管理機能実装」の詳細設計を定義します。

### 目的

サービス管理ユーザーと顧客ユーザーの管理機能を実装します。ユーザー情報を一元管理し、ユーザーの作成・編集・削除、ロール割り当て、検索や一覧表示を通じて効率的にユーザーを管理できるようにします。

### スコープ

- ユーザー作成API実装（POST /api/v1/users）
- ユーザー更新API実装（PATCH /api/v1/users/:id）
- ユーザー削除API実装（DELETE /api/v1/users/:id）
- ユーザー一覧取得・検索API実装（GET /api/v1/users、検索クエリパラメータ対応）
- ユーザー詳細取得API実装（GET /api/v1/users/:id）
- ユーザーロール変更API実装（PATCH /api/v1/users/:id/role）

## アーキテクチャ

### アーキテクチャパターン

Onion Architecture（オニオンアーキテクチャ）に従い、レイヤを明確に分離します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - UserController                    │
│  - DTOs (CreateUserDto, etc.)       │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                   │
│  - CreateUserUseCase                 │
│  - UpdateUserUseCase                 │
│  - DeleteUserUseCase                 │
│  - GetUserListUseCase                │
│  - GetUserByIdUseCase                │
│  - ChangeUserRoleUseCase             │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - User Entity                      │
│  - UserRole Enum                    │
│  - IUserRepository (interface)      │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - UserRepository (implementation)  │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **バリデーション**: class-validator, class-transformer
- **データベース**: 現段階ではインメモリ実装、将来はTypeORM/PrismaでDB接続
- **パスワードハッシュ**: bcrypt（既存のPasswordServiceを使用）

## 主要コンポーネント

### 1. Presentation Layer

- **UserController**: ユーザー関連のHTTPエンドポイントを提供
- **CreateUserDto**: ユーザー作成リクエストのDTO
- **UpdateUserDto**: ユーザー更新リクエストのDTO
- **UserResponseDto**: ユーザーレスポンスのDTO
- **UserListResponseDto**: ユーザー一覧レスポンスのDTO
- **ChangeUserRoleDto**: ユーザーロール変更リクエストのDTO

### 2. Application Layer

- **CreateUserUseCase**: ユーザー作成処理のユースケース
- **UpdateUserUseCase**: ユーザー更新処理のユースケース
- **DeleteUserUseCase**: ユーザー削除処理のユースケース
- **GetUserListUseCase**: ユーザー一覧取得・検索処理のユースケース（検索クエリパラメータ対応）
- **GetUserByIdUseCase**: ユーザー詳細取得処理のユースケース
- **ChangeUserRoleUseCase**: ユーザーロール変更処理のユースケース

### 3. Domain Layer

- **User Entity**: ユーザーエンティティ（既存）
- **UserRole Enum**: ユーザーロール（既存: SERVICE_ADMIN, SERVICE_MEMBER）
- **IUserRepository**: ユーザーリポジトリのインターフェース（既存、拡張が必要）

### 4. Infrastructure Layer

- **UserRepository**: ユーザーリポジトリの実装（既存、拡張が必要）

## データフロー

### ユーザー作成フロー

1. クライアントがユーザー作成リクエストを送信（email, password, role）
2. UserControllerがリクエストを受信し、バリデーション
3. CreateUserUseCaseがパスワードをハッシュ化
4. CreateUserUseCaseがユーザー作成処理を実行
5. UserRepositoryがユーザー情報を保存
6. レスポンスとしてユーザー情報を返却（パスワードは含めない）

### ユーザー一覧取得・検索フロー

1. クライアントがユーザー一覧取得・検索リクエストを送信（検索条件はクエリパラメータで指定）
2. UserControllerがリクエストを受信
3. GetUserListUseCaseがユーザー一覧取得・検索処理を実行
4. UserRepositoryが検索条件に基づいてユーザーを取得（検索条件がない場合は全件取得）
5. レスポンスとしてユーザー一覧を返却（パスワードは含めない）

### ユーザーロール変更フロー

1. クライアントがユーザーロール変更リクエストを送信
2. UserControllerがリクエストを受信し、バリデーション
3. ChangeUserRoleUseCaseがユーザーロール変更処理を実行
4. UserRepositoryがユーザー情報を更新
5. レスポンスとして更新されたユーザー情報を返却

## セキュリティ考慮事項

- 認証・認可: 管理者権限（SERVICE_ADMIN）が必要な操作（作成、削除、ロール変更）は適切に保護
- パスワード管理: パスワードはハッシュ化して保存し、レスポンスには含めない
- 入力バリデーション: すべての入力データをバリデーション
- データ保護: ユーザー情報の機密性を保護
- ログ記録: ユーザー情報の変更履歴を記録（将来実装）

## 参照資料

- Issue: [MWD-35](https://kencom2400.atlassian.net/browse/MWD-35)
- 既存実装: User Entity, UserRole Enum, IUserRepository

