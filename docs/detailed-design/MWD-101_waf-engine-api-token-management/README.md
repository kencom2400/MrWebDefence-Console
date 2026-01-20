# WAFエンジン向けAPIトークン管理機能実装設計書

## 概要

本設計書は、MWD-101「Task 4.7: WAFエンジン向けAPIトークン管理機能実装」の詳細設計を定義します。

### 目的

WAFエンジン（設定取得エージェント）が管理APIにアクセスするためのAPIトークンを生成・管理する機能を実装します。WAFエンジンは、このAPIトークンを使用して`GET /engine/v1/config`エンドポイント（MWD-100で実装）にアクセスし、設定情報を取得します。

### スコープ

- APIトークンの生成・発行機能
- APIトークンの一覧取得機能
- APIトークンの削除・無効化機能
- APIトークンによる認証機能（MWD-100で使用）
- APIトークンの有効期限管理
- APIトークンのメタデータ管理（名前、説明、作成日時など）

### 非スコープ

- APIトークンの更新機能（削除して再発行する方式）
- APIトークンの権限管理（将来実装）
- APIトークンの使用履歴・監査ログ（将来実装）
- APIトークンのレート制限（将来実装）

## アーキテクチャ

### アーキテクチャパターン

Onion Architecture（オニオンアーキテクチャ）に従い、レイヤを明確に分離します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - ApiTokenController               │
│  - DTOs (CreateApiTokenDto,         │
│     ApiTokenResponseDto, etc.)      │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                   │
│  - CreateApiTokenUseCase            │
│  - ListApiTokensUseCase              │
│  - DeleteApiTokenUseCase            │
│  - RevokeApiTokenUseCase            │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - ApiToken Entity                  │
│  - IApiTokenRepository (interface)  │
│  - ApiTokenService                  │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - ApiTokenRepository (implementation)│
│  - ApiTokenAuthGuard (for MWD-100) │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **認証**: APIトークン（ランダム文字列、ハッシュ化して保存）
- **データベース**: 新規テーブル `api_tokens` を作成
- **ハッシュ化**: bcrypt（既存のPasswordServiceを再利用可能）

## 主要コンポーネント

### 1. Presentation Layer

- **ApiTokenController**: APIトークン管理APIのHTTPエンドポイントを提供
  - `POST /api/v1/api-tokens`: APIトークンの生成
  - `GET /api/v1/api-tokens`: APIトークンの一覧取得
  - `DELETE /api/v1/api-tokens/:id`: APIトークンの削除
  - `POST /api/v1/api-tokens/:id/revoke`: APIトークンの無効化
- **DTOs**: 
  - `CreateApiTokenDto`: APIトークン作成リクエスト
  - `ApiTokenResponseDto`: APIトークン情報レスポンス
  - `ListApiTokensResponseDto`: APIトークン一覧レスポンス

### 2. Application Layer

- **CreateApiTokenUseCase**: APIトークンの生成・発行
- **ListApiTokensUseCase**: APIトークンの一覧取得
- **DeleteApiTokenUseCase**: APIトークンの削除
- **RevokeApiTokenUseCase**: APIトークンの無効化

### 3. Domain Layer

- **ApiToken Entity**: APIトークンのドメインエンティティ
  - `id`: トークンID（UUID）
  - `name`: トークン名（識別用）
  - `description`: 説明（オプション）
  - `tokenHash`: トークンのハッシュ値（保存用）
  - `tokenPrefix`: トークンのプレフィックス（表示用、例: `waf_xxxxx`）
  - `expiresAt`: 有効期限（オプション、nullの場合は無期限）
  - `revokedAt`: 無効化日時（nullの場合は有効）
  - `createdAt`: 作成日時
  - `createdBy`: 作成者ID（ユーザーID）
- **IApiTokenRepository**: APIトークンリポジトリのインターフェース
- **ApiTokenService**: APIトークンの生成・検証ロジック

### 4. Infrastructure Layer

- **ApiTokenRepository**: APIトークンリポジトリの実装
- **ApiTokenAuthGuard**: APIトークン認証ガード（MWD-100で使用）

## データフロー

### APIトークン生成フロー

1. 管理者が`POST /api/v1/api-tokens`を呼び出し
2. ApiTokenControllerがリクエストを受信し、認証・認可を確認（管理者権限必須）
3. CreateApiTokenUseCaseが実行される
4. ApiTokenServiceがランダムなトークンを生成
5. トークンをハッシュ化してApiTokenエンティティを作成
6. ApiTokenRepositoryに保存
7. プレフィックス付きトークン（例: `waf_xxxxx...`）をレスポンスとして返却（この時点でしか表示されない）

### APIトークン認証フロー（MWD-100で使用）

1. WAFエンジンが`GET /engine/v1/config`を呼び出し、`Authorization: Bearer <API_TOKEN>`ヘッダーを送信
2. ApiTokenAuthGuardがトークンを検証
3. トークンのプレフィックスから検索対象を絞り込み
4. トークンをハッシュ化してApiTokenRepositoryで検索
5. トークンが存在し、有効期限が切れておらず、無効化されていない場合、認証成功
6. 認証成功後、GetEngineConfigUseCaseが実行される

## セキュリティ考慮事項

- **トークンのハッシュ化**: トークンは平文で保存せず、bcryptでハッシュ化して保存
- **トークンの表示**: トークンは生成時のみ1回だけ表示され、その後は表示不可
- **トークンのプレフィックス**: トークンにプレフィックス（例: `waf_`）を付与し、検索効率を向上
- **有効期限管理**: トークンに有効期限を設定可能（オプション、nullの場合は無期限）
- **無効化機能**: トークンを削除せずに無効化可能（監査ログ用）
- **管理者権限**: APIトークンの生成・管理は管理者権限のみ
- **HTTPS**: すべての通信はHTTPSを使用

## パフォーマンス考慮事項

- **トークンの検索効率**: プレフィックスによるインデックス検索で高速化
- **ハッシュ化のコスト**: bcryptのラウンド数を適切に設定（デフォルト10ラウンド）
- **トークンの一覧取得**: ページネーションを実装（将来実装）

## データベース設計

### api_tokens テーブル

```sql
CREATE TABLE api_tokens (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_prefix VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    INDEX idx_token_prefix (token_prefix),
    INDEX idx_token_hash (token_hash),
    INDEX idx_revoked_at (revoked_at),
    INDEX idx_expires_at (expires_at)
);
```

## 参照資料

- Issue: [MWD-101](https://kencom2400.atlassian.net/browse/MWD-101)
- WAFエンジン向け設定配信API設計書: `docs/detailed-design/MWD-100_waf-engine-config-delivery/`
- ユーザー認証設計書: `docs/detailed-design/MWD-27_user-authentication/`
