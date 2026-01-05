# ユーザー認証機能実装設計書

## 概要

本設計書は、MWD-27「Task 3.1: ユーザー認証機能実装」の詳細設計を定義します。

### 目的

ユーザーが安全にログインし、セッションを管理できるようにするための認証機能を実装します。

### スコープ

- ログインAPI実装（POST /api/v1/auth/login）
- ユーザー認証処理
- JWTトークン生成と返却
- セッション管理の基盤構築

## アーキテクチャ

### アーキテクチャパターン

Onion Architecture（オニオンアーキテクチャ）に従い、レイヤを明確に分離します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - AuthController                    │
│  - DTOs (LoginRequestDto, etc.)     │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                   │
│  - LoginUseCase                      │
│  - AuthenticationService             │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - User Entity                      │
│  - Authentication Domain Logic       │
│  - IUserRepository (interface)      │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - UserRepository (implementation)   │
│  - JwtService                       │
│  - PasswordService                  │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **認証方式**: JWT (JSON Web Token)
- **パスワードハッシュ**: bcrypt
- **バリデーション**: class-validator, class-transformer

## 主要コンポーネント

### 1. Presentation Layer

- **AuthController**: 認証関連のHTTPエンドポイントを提供
- **LoginRequestDto**: ログインリクエストのDTO
- **LoginResponseDto**: ログインレスポンスのDTO

### 2. Application Layer

- **LoginUseCase**: ログイン処理のユースケース
- **AuthenticationService**: 認証関連のビジネスロジック

### 3. Domain Layer

- **User Entity**: ユーザーエンティティ
- **IUserRepository**: ユーザーリポジトリのインターフェース

### 4. Infrastructure Layer

- **UserRepository**: ユーザーリポジトリの実装
- **JwtService**: JWTトークンの生成・検証サービス
- **PasswordService**: パスワードのハッシュ化・検証サービス

## データフロー

1. クライアントがログインリクエストを送信
2. AuthControllerがリクエストを受信し、バリデーション
3. LoginUseCaseが認証処理を実行
4. UserRepositoryがユーザー情報を取得
5. PasswordServiceがパスワードを検証
6. JwtServiceがJWTトークンを生成
7. レスポンスとしてJWTトークンを返却

## セキュリティ考慮事項

- パスワードはbcryptでハッシュ化して保存
- JWTトークンには有効期限を設定
- ログイン試行回数の制限（将来実装）
- HTTPS通信の必須化

## 参照資料

- [設計文書リポジトリ](https://github.com/kencom2400/MrWebDefence-Design/tree/main/docs)
- Issue: [MWD-27](https://kencom2400.atlassian.net/browse/MWD-27)
