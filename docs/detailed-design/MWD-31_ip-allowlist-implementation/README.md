# IP AllowList機能実装設計書

## 概要

本設計書は、MWD-31「Task 3.5: IP AllowList機能実装」の詳細設計を定義します。

### 目的

セキュリティを強化するため、ユーザーがログイン可能なIPアドレスを制限するIP AllowList機能を導入します。許可されたIPアドレスからのみログインを許可し、不正アクセスを防止します。

### スコープ

- IPアドレスの追加・削除・一覧取得API
- CIDR記法のサポート（例: 192.168.1.0/24）
- IPv4とIPv6のサポート
- ログイン時のIPアドレス検証
- ユーザーごとのIP AllowList管理
- IPアドレス検証用Guardの実装

### 非スコープ

- IPアドレスの自動検出・提案機能
- IPアドレス変更通知機能
- 地理的位置情報に基づくIP制限
- 動的IPアドレスの自動更新

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - IpAllowListController (New)      │
│  - AuthController (Modified)        │
│  - IpAllowListGuard (New)           │
│  - DTOs (IpAllowListDto, etc.)     │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - AddIpAllowListUseCase (New)      │
│  - RemoveIpAllowListUseCase (New)   │
│  - GetIpAllowListUseCase (New)     │
│  - VerifyIpAllowListUseCase (New)  │
│  - LoginUseCase (Modified)         │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - IpAddress Value Object (New)     │
│  - IIpAllowListRepository (New)    │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - IpAllowListRepository (New)     │
│  - IpAddressService (New)           │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **IPアドレス検証**: `ipaddr.js` または Node.js標準ライブラリ
- **CIDR処理**: `ipaddr.js` または `ip-cidr` ライブラリ
- **ストレージ**: インメモリ（初期実装）、将来はDBに移行

## 主要コンポーネント

### 1. Domain Layer

- **IpAddress Value Object**: IPアドレスをカプセル化（バリデーション、不変性、CIDR記法のサポート）
- **IIpAllowListRepository**: IP AllowList関連データのリポジトリインターフェース

**注意**: Value Objectは自身の不変性と正当性を維持する責務を持ちます。IPアドレスのバリデーション、CIDR記法のパース、範囲チェック（`isInRange`）などのロジックは`IpAddress` Value Object内にカプセル化します。外部ライブラリとの連携など、より技術的な詳細はInfrastructure層の`IpAddressService`が担当します。

### 2. Application Layer

- **AddIpAllowListUseCase**: IPアドレス追加処理
  - IPアドレスバリデーション（IpAddressService経由）
  - 重複チェック
  - 永続化（IpAllowListRepository経由）
- **RemoveIpAllowListUseCase**: IPアドレス削除処理
  - IPアドレス存在確認
  - 削除（IpAllowListRepository経由）
- **GetIpAllowListUseCase**: IP AllowList一覧取得処理
  - ユーザーIDに基づくIP AllowList取得
- **VerifyIpAllowListUseCase**: IPアドレス検証処理
  - リクエスト元IPアドレスの取得
  - IP AllowListとの照合（IpAddressService経由）
  - CIDR記法のマッチング処理
- **LoginUseCase (Modified)**: IP AllowList検証を統合

### 3. Infrastructure Layer

- **IpAllowListRepository**: IP AllowListの永続化（初期実装はインメモリ）
- **IpAddressService**: 外部ライブラリとの連携など、より技術的な詳細を担当
  - 外部IPアドレス検証ライブラリ（`ipaddr.js`等）との連携
  - `IpAddress` Value Objectのファクトリメソッドとして機能（必要に応じて）

### 4. Presentation Layer

- **IpAllowListController**: IP AllowList管理API
  - `POST /api/v1/auth/ip-allowlist` - IPアドレス追加
  - `DELETE /api/v1/auth/ip-allowlist/:id` - IPアドレス削除
  - `GET /api/v1/auth/ip-allowlist` - IP AllowList一覧取得
- **DTOs**: リクエスト/レスポンスの型定義

**注意**: ログイン時のIP検証は`LoginUseCase`内で実行します。Guardは認証前に動作するため、ログインエンドポイントには適用しません。

## データフロー

### IP AllowList追加フロー

1. クライアントが `POST /api/v1/auth/ip-allowlist` を呼び出し
2. `IpAllowListController` がリクエストを受信
3. `AddIpAllowListUseCase` が実行される
4. `IpAddressService` でIPアドレスのバリデーション
5. `IpAllowListRepository` で重複チェック
6. 重複がなければ `IpAllowListRepository` で永続化
7. レスポンスを返却

### ログイン時のIP検証フロー

1. クライアントが `POST /api/v1/auth/login` を呼び出し
2. `LoginUseCase` がパスワード認証を実行
3. 認証成功後、リクエスト元IPアドレスを取得
4. `VerifyIpAllowListUseCase` が実行される
5. ユーザーのIP AllowListを取得
6. `IpAddress` Value ObjectでIPアドレスのマッチング（CIDR記法対応）
7. マッチするIPアドレスがあればJWTトークンを返却、なければ403 Forbidden

**注意**: Guardは認証前に動作するため、ログインエンドポイントには適用できません。`LoginUseCase`内で認証成功後にIP検証を行います。

## セキュリティ考慮事項

### 1. IPアドレス偽装対策

- リバースプロキシ（Nginx、CloudFlare等）経由の場合、`X-Forwarded-For` ヘッダーからIPアドレスを取得
- 信頼できるプロキシの設定が必要
- 複数の `X-Forwarded-For` ヘッダーがある場合、最初のIPアドレスを使用（クライアントに最も近いIP）

### 2. CIDR記法のセキュリティ

- CIDR記法による範囲指定を許可（例: 192.168.1.0/24）
- 過度に広い範囲（例: 0.0.0.0/0）の追加は制限するか警告を表示
- プライベートIPアドレス範囲（RFC 1918）の使用を許可

### 3. IPv6サポート

- IPv4とIPv6の両方をサポート
- IPv6のCIDR記法もサポート（例: 2001:db8::/32）

### 4. デフォルト動作

- IP AllowListが空の場合、すべてのIPアドレスからのアクセスを許可（後方互換性のため）
- IP AllowListが設定されている場合のみ、制限を適用

## 実装詳細

### IPアドレスValue Object

```typescript
export class IpAddress {
  private readonly value: string; // IPv4またはIPv6アドレス、またはCIDR記法
  private readonly cidr?: number; // CIDRプレフィックス長（オプション）

  constructor(value: string) {
    // バリデーション: IPv4/IPv6形式、CIDR記法の検証
    this.validate(value);
    this.value = value;
    // CIDR記法の場合はプレフィックス長を抽出
    this.parseCidr(value);
  }

  public isInRange(ip: string): boolean {
    // CIDR記法の場合、指定されたIPアドレスが範囲内かチェック
    // 単一IPアドレスの場合は完全一致をチェック
    // このロジックはValue Object内にカプセル化
  }

  private validate(value: string): void {
    // IPv4/IPv6形式、CIDR記法の検証
  }

  private parseCidr(value: string): void {
    // CIDR記法の場合はプレフィックス長を抽出
  }
}
```

### ログインUseCaseの統合

`LoginUseCase` は、パスワード認証成功後に`VerifyIpAllowListUseCase`を呼び出してIP検証を行います。検証に失敗した場合は403 Forbiddenを返します。

**注意**: Guardは認証前に動作するため、ログインエンドポイントには適用できません。`LoginUseCase`内で認証成功後にIP検証を行います。

## データベース設計

### ip_allowlists テーブル（将来実装）

```sql
CREATE TABLE ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL, -- IPv4またはIPv6、CIDR記法も可
  description VARCHAR(255), -- オプション: IPアドレスの説明
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ip_address)
);

CREATE INDEX idx_ip_allowlists_user_id ON ip_allowlists(user_id);
```

**注意**: 初期実装ではインメモリストレージを使用し、将来DBに移行することを想定。

## 移行計画

### Phase 1: 基本機能実装（初期）

1. Domain Layer: `IpAddress` Value Object、`IIpAllowListRepository` インターフェース
2. Infrastructure Layer: `IpAddressService`、`IpAllowListRepository`（インメモリ）
3. Application Layer: Use Cases実装
4. Presentation Layer: `IpAllowListController`、DTOs
5. Guard実装: `IpAllowListGuard`
6. ユニットテスト実装

### Phase 2: ログイン統合

1. `LoginUseCase` へのIP検証統合
2. `AuthController` へのGuard適用
3. E2Eテスト実装

### Phase 3: データベース移行（将来）

1. `ip_allowlists` テーブル作成
2. `IpAllowListRepository` をDB実装に置き換え
3. マイグレーションスクリプト作成

## テスト戦略

### ユニットテスト

- **IpAddress Value Object**: IPアドレスバリデーション、CIDR記法のパース、範囲チェック
- **IpAddressService**: IPv4/IPv6検証、CIDR計算、マッチングロジック
- **Use Cases**: 各Use Caseの正常系・異常系
- **IpAllowListGuard**: IPアドレス抽出、検証ロジック

### E2Eテスト

- IP AllowList追加・削除・一覧取得
- 許可されたIPアドレスからのログイン成功
- 許可されていないIPアドレスからのログイン失敗（403 Forbidden）
- CIDR記法による範囲指定の検証
- IPv6アドレスの検証

### テストカバレッジ目標

- ユニットテスト: 90%以上
- E2Eテスト: 主要フロー100%

## パフォーマンス考慮事項

### IP AllowList検証の最適化

- IP AllowListはユーザーごとにキャッシュ可能
- 頻繁にアクセスされるIPアドレスはメモリキャッシュに保持
- CIDR計算は効率的なアルゴリズムを使用

### スケーラビリティ

- ユーザーごとのIP AllowList数に制限を設ける（例: 最大50件）
- 大量のIP AllowListがある場合の検証パフォーマンスを考慮

## エラーハンドリング

### 想定されるエラー

1. **無効なIPアドレス形式**: 400 Bad Request
2. **重複するIPアドレス**: 409 Conflict
3. **存在しないIP AllowList削除**: 404 Not Found
4. **許可されていないIPアドレスからのアクセス**: 403 Forbidden
5. **IP AllowList数制限超過**: 400 Bad Request

### エラーレスポンス形式

```json
{
  "statusCode": 400,
  "message": "Invalid IP address format",
  "error": "Bad Request"
}
```

## 将来の拡張可能性

1. **IPアドレスの自動検出**: 初回ログイン時にIPアドレスを自動提案
2. **IPアドレス変更通知**: 新しいIPアドレスからのログイン時にメール通知
3. **地理的位置情報**: IPアドレスから地理的位置を取得し、国単位での制限
4. **動的IPアドレスの自動更新**: 定期的にIPアドレスを更新する機能
5. **IP AllowListのインポート/エクスポート**: CSV形式での一括管理


## 概要

本設計書は、MWD-31「Task 3.5: IP AllowList機能実装」の詳細設計を定義します。

### 目的

セキュリティを強化するため、ユーザーがログイン可能なIPアドレスを制限するIP AllowList機能を導入します。許可されたIPアドレスからのみログインを許可し、不正アクセスを防止します。

### スコープ

- IPアドレスの追加・削除・一覧取得API
- CIDR記法のサポート（例: 192.168.1.0/24）
- IPv4とIPv6のサポート
- ログイン時のIPアドレス検証
- ユーザーごとのIP AllowList管理
- IPアドレス検証用Guardの実装

### 非スコープ

- IPアドレスの自動検出・提案機能
- IPアドレス変更通知機能
- 地理的位置情報に基づくIP制限
- 動的IPアドレスの自動更新

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - IpAllowListController (New)      │
│  - AuthController (Modified)        │
│  - IpAllowListGuard (New)           │
│  - DTOs (IpAllowListDto, etc.)     │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - AddIpAllowListUseCase (New)      │
│  - RemoveIpAllowListUseCase (New)   │
│  - GetIpAllowListUseCase (New)     │
│  - VerifyIpAllowListUseCase (New)  │
│  - LoginUseCase (Modified)         │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - IpAddress Value Object (New)     │
│  - IIpAllowListRepository (New)    │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - IpAllowListRepository (New)     │
│  - IpAddressService (New)           │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **IPアドレス検証**: `ipaddr.js` または Node.js標準ライブラリ
- **CIDR処理**: `ipaddr.js` または `ip-cidr` ライブラリ
- **ストレージ**: インメモリ（初期実装）、将来はDBに移行

## 主要コンポーネント

### 1. Domain Layer

- **IpAddress Value Object**: IPアドレスをカプセル化（バリデーション、不変性、CIDR記法のサポート）
- **IIpAllowListRepository**: IP AllowList関連データのリポジトリインターフェース

**注意**: Value Objectは自身の不変性と正当性を維持する責務を持ちます。IPアドレスのバリデーション、CIDR記法のパース、範囲チェック（`isInRange`）などのロジックは`IpAddress` Value Object内にカプセル化します。外部ライブラリとの連携など、より技術的な詳細はInfrastructure層の`IpAddressService`が担当します。

### 2. Application Layer

- **AddIpAllowListUseCase**: IPアドレス追加処理
  - IPアドレスバリデーション（IpAddressService経由）
  - 重複チェック
  - 永続化（IpAllowListRepository経由）
- **RemoveIpAllowListUseCase**: IPアドレス削除処理
  - IPアドレス存在確認
  - 削除（IpAllowListRepository経由）
- **GetIpAllowListUseCase**: IP AllowList一覧取得処理
  - ユーザーIDに基づくIP AllowList取得
- **VerifyIpAllowListUseCase**: IPアドレス検証処理
  - リクエスト元IPアドレスの取得
  - IP AllowListとの照合（IpAddressService経由）
  - CIDR記法のマッチング処理
- **LoginUseCase (Modified)**: IP AllowList検証を統合

### 3. Infrastructure Layer

- **IpAllowListRepository**: IP AllowListの永続化（初期実装はインメモリ）
- **IpAddressService**: 外部ライブラリとの連携など、より技術的な詳細を担当
  - 外部IPアドレス検証ライブラリ（`ipaddr.js`等）との連携
  - `IpAddress` Value Objectのファクトリメソッドとして機能（必要に応じて）

### 4. Presentation Layer

- **IpAllowListController**: IP AllowList管理API
  - `POST /api/v1/auth/ip-allowlist` - IPアドレス追加
  - `DELETE /api/v1/auth/ip-allowlist/:id` - IPアドレス削除
  - `GET /api/v1/auth/ip-allowlist` - IP AllowList一覧取得
- **DTOs**: リクエスト/レスポンスの型定義

**注意**: ログイン時のIP検証は`LoginUseCase`内で実行します。Guardは認証前に動作するため、ログインエンドポイントには適用しません。

## データフロー

### IP AllowList追加フロー

1. クライアントが `POST /api/v1/auth/ip-allowlist` を呼び出し
2. `IpAllowListController` がリクエストを受信
3. `AddIpAllowListUseCase` が実行される
4. `IpAddressService` でIPアドレスのバリデーション
5. `IpAllowListRepository` で重複チェック
6. 重複がなければ `IpAllowListRepository` で永続化
7. レスポンスを返却

### ログイン時のIP検証フロー

1. クライアントが `POST /api/v1/auth/login` を呼び出し
2. `LoginUseCase` がパスワード認証を実行
3. 認証成功後、リクエスト元IPアドレスを取得
4. `VerifyIpAllowListUseCase` が実行される
5. ユーザーのIP AllowListを取得
6. `IpAddress` Value ObjectでIPアドレスのマッチング（CIDR記法対応）
7. マッチするIPアドレスがあればJWTトークンを返却、なければ403 Forbidden

**注意**: Guardは認証前に動作するため、ログインエンドポイントには適用できません。`LoginUseCase`内で認証成功後にIP検証を行います。

## セキュリティ考慮事項

### 1. IPアドレス偽装対策

- リバースプロキシ（Nginx、CloudFlare等）経由の場合、`X-Forwarded-For` ヘッダーからIPアドレスを取得
- 信頼できるプロキシの設定が必要
- 複数の `X-Forwarded-For` ヘッダーがある場合、最初のIPアドレスを使用（クライアントに最も近いIP）

### 2. CIDR記法のセキュリティ

- CIDR記法による範囲指定を許可（例: 192.168.1.0/24）
- 過度に広い範囲（例: 0.0.0.0/0）の追加は制限するか警告を表示
- プライベートIPアドレス範囲（RFC 1918）の使用を許可

### 3. IPv6サポート

- IPv4とIPv6の両方をサポート
- IPv6のCIDR記法もサポート（例: 2001:db8::/32）

### 4. デフォルト動作

- IP AllowListが空の場合、すべてのIPアドレスからのアクセスを許可（後方互換性のため）
- IP AllowListが設定されている場合のみ、制限を適用

## 実装詳細

### IPアドレスValue Object

```typescript
export class IpAddress {
  private readonly value: string; // IPv4またはIPv6アドレス、またはCIDR記法
  private readonly cidr?: number; // CIDRプレフィックス長（オプション）

  constructor(value: string) {
    // バリデーション: IPv4/IPv6形式、CIDR記法の検証
    this.validate(value);
    this.value = value;
    // CIDR記法の場合はプレフィックス長を抽出
    this.parseCidr(value);
  }

  public isInRange(ip: string): boolean {
    // CIDR記法の場合、指定されたIPアドレスが範囲内かチェック
    // 単一IPアドレスの場合は完全一致をチェック
    // このロジックはValue Object内にカプセル化
  }

  private validate(value: string): void {
    // IPv4/IPv6形式、CIDR記法の検証
  }

  private parseCidr(value: string): void {
    // CIDR記法の場合はプレフィックス長を抽出
  }
}
```

### ログインUseCaseの統合

`LoginUseCase` は、パスワード認証成功後に`VerifyIpAllowListUseCase`を呼び出してIP検証を行います。検証に失敗した場合は403 Forbiddenを返します。

**注意**: Guardは認証前に動作するため、ログインエンドポイントには適用できません。`LoginUseCase`内で認証成功後にIP検証を行います。

## データベース設計

### ip_allowlists テーブル（将来実装）

```sql
CREATE TABLE ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL, -- IPv4またはIPv6、CIDR記法も可
  description VARCHAR(255), -- オプション: IPアドレスの説明
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ip_address)
);

CREATE INDEX idx_ip_allowlists_user_id ON ip_allowlists(user_id);
```

**注意**: 初期実装ではインメモリストレージを使用し、将来DBに移行することを想定。

## 移行計画

### Phase 1: 基本機能実装（初期）

1. Domain Layer: `IpAddress` Value Object、`IIpAllowListRepository` インターフェース
2. Infrastructure Layer: `IpAddressService`、`IpAllowListRepository`（インメモリ）
3. Application Layer: Use Cases実装
4. Presentation Layer: `IpAllowListController`、DTOs
5. Guard実装: `IpAllowListGuard`
6. ユニットテスト実装

### Phase 2: ログイン統合

1. `LoginUseCase` へのIP検証統合
2. `AuthController` へのGuard適用
3. E2Eテスト実装

### Phase 3: データベース移行（将来）

1. `ip_allowlists` テーブル作成
2. `IpAllowListRepository` をDB実装に置き換え
3. マイグレーションスクリプト作成

## テスト戦略

### ユニットテスト

- **IpAddress Value Object**: IPアドレスバリデーション、CIDR記法のパース、範囲チェック
- **IpAddressService**: IPv4/IPv6検証、CIDR計算、マッチングロジック
- **Use Cases**: 各Use Caseの正常系・異常系
- **IpAllowListGuard**: IPアドレス抽出、検証ロジック

### E2Eテスト

- IP AllowList追加・削除・一覧取得
- 許可されたIPアドレスからのログイン成功
- 許可されていないIPアドレスからのログイン失敗（403 Forbidden）
- CIDR記法による範囲指定の検証
- IPv6アドレスの検証

### テストカバレッジ目標

- ユニットテスト: 90%以上
- E2Eテスト: 主要フロー100%

## パフォーマンス考慮事項

### IP AllowList検証の最適化

- IP AllowListはユーザーごとにキャッシュ可能
- 頻繁にアクセスされるIPアドレスはメモリキャッシュに保持
- CIDR計算は効率的なアルゴリズムを使用

### スケーラビリティ

- ユーザーごとのIP AllowList数に制限を設ける（例: 最大50件）
- 大量のIP AllowListがある場合の検証パフォーマンスを考慮

## エラーハンドリング

### 想定されるエラー

1. **無効なIPアドレス形式**: 400 Bad Request
2. **重複するIPアドレス**: 409 Conflict
3. **存在しないIP AllowList削除**: 404 Not Found
4. **許可されていないIPアドレスからのアクセス**: 403 Forbidden
5. **IP AllowList数制限超過**: 400 Bad Request

### エラーレスポンス形式

```json
{
  "statusCode": 400,
  "message": "Invalid IP address format",
  "error": "Bad Request"
}
```

## 将来の拡張可能性

1. **IPアドレスの自動検出**: 初回ログイン時にIPアドレスを自動提案
2. **IPアドレス変更通知**: 新しいIPアドレスからのログイン時にメール通知
3. **地理的位置情報**: IPアドレスから地理的位置を取得し、国単位での制限
4. **動的IPアドレスの自動更新**: 定期的にIPアドレスを更新する機能
5. **IP AllowListのインポート/エクスポート**: CSV形式での一括管理


## 概要

本設計書は、MWD-31「Task 3.5: IP AllowList機能実装」の詳細設計を定義します。

### 目的

セキュリティを強化するため、ユーザーがログイン可能なIPアドレスを制限するIP AllowList機能を導入します。許可されたIPアドレスからのみログインを許可し、不正アクセスを防止します。

### スコープ

- IPアドレスの追加・削除・一覧取得API
- CIDR記法のサポート（例: 192.168.1.0/24）
- IPv4とIPv6のサポート
- ログイン時のIPアドレス検証
- ユーザーごとのIP AllowList管理
- IPアドレス検証用Guardの実装

### 非スコープ

- IPアドレスの自動検出・提案機能
- IPアドレス変更通知機能
- 地理的位置情報に基づくIP制限
- 動的IPアドレスの自動更新

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - IpAllowListController (New)      │
│  - AuthController (Modified)        │
│  - IpAllowListGuard (New)           │
│  - DTOs (IpAllowListDto, etc.)     │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - AddIpAllowListUseCase (New)      │
│  - RemoveIpAllowListUseCase (New)   │
│  - GetIpAllowListUseCase (New)     │
│  - VerifyIpAllowListUseCase (New)  │
│  - LoginUseCase (Modified)         │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - IpAddress Value Object (New)     │
│  - IIpAllowListRepository (New)    │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - IpAllowListRepository (New)     │
│  - IpAddressService (New)           │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **IPアドレス検証**: `ipaddr.js` または Node.js標準ライブラリ
- **CIDR処理**: `ipaddr.js` または `ip-cidr` ライブラリ
- **ストレージ**: インメモリ（初期実装）、将来はDBに移行

## 主要コンポーネント

### 1. Domain Layer

- **IpAddress Value Object**: IPアドレスをカプセル化（バリデーション、不変性、CIDR記法のサポート）
- **IIpAllowListRepository**: IP AllowList関連データのリポジトリインターフェース

**注意**: Value Objectは自身の不変性と正当性を維持する責務を持ちます。IPアドレスのバリデーション、CIDR記法のパース、範囲チェック（`isInRange`）などのロジックは`IpAddress` Value Object内にカプセル化します。外部ライブラリとの連携など、より技術的な詳細はInfrastructure層の`IpAddressService`が担当します。

### 2. Application Layer

- **AddIpAllowListUseCase**: IPアドレス追加処理
  - IPアドレスバリデーション（IpAddressService経由）
  - 重複チェック
  - 永続化（IpAllowListRepository経由）
- **RemoveIpAllowListUseCase**: IPアドレス削除処理
  - IPアドレス存在確認
  - 削除（IpAllowListRepository経由）
- **GetIpAllowListUseCase**: IP AllowList一覧取得処理
  - ユーザーIDに基づくIP AllowList取得
- **VerifyIpAllowListUseCase**: IPアドレス検証処理
  - リクエスト元IPアドレスの取得
  - IP AllowListとの照合（IpAddressService経由）
  - CIDR記法のマッチング処理
- **LoginUseCase (Modified)**: IP AllowList検証を統合

### 3. Infrastructure Layer

- **IpAllowListRepository**: IP AllowListの永続化（初期実装はインメモリ）
- **IpAddressService**: 外部ライブラリとの連携など、より技術的な詳細を担当
  - 外部IPアドレス検証ライブラリ（`ipaddr.js`等）との連携
  - `IpAddress` Value Objectのファクトリメソッドとして機能（必要に応じて）

### 4. Presentation Layer

- **IpAllowListController**: IP AllowList管理API
  - `POST /api/v1/auth/ip-allowlist` - IPアドレス追加
  - `DELETE /api/v1/auth/ip-allowlist/:id` - IPアドレス削除
  - `GET /api/v1/auth/ip-allowlist` - IP AllowList一覧取得
- **DTOs**: リクエスト/レスポンスの型定義

**注意**: ログイン時のIP検証は`LoginUseCase`内で実行します。Guardは認証前に動作するため、ログインエンドポイントには適用しません。

## データフロー

### IP AllowList追加フロー

1. クライアントが `POST /api/v1/auth/ip-allowlist` を呼び出し
2. `IpAllowListController` がリクエストを受信
3. `AddIpAllowListUseCase` が実行される
4. `IpAddressService` でIPアドレスのバリデーション
5. `IpAllowListRepository` で重複チェック
6. 重複がなければ `IpAllowListRepository` で永続化
7. レスポンスを返却

### ログイン時のIP検証フロー

1. クライアントが `POST /api/v1/auth/login` を呼び出し
2. `LoginUseCase` がパスワード認証を実行
3. 認証成功後、リクエスト元IPアドレスを取得
4. `VerifyIpAllowListUseCase` が実行される
5. ユーザーのIP AllowListを取得
6. `IpAddress` Value ObjectでIPアドレスのマッチング（CIDR記法対応）
7. マッチするIPアドレスがあればJWTトークンを返却、なければ403 Forbidden

**注意**: Guardは認証前に動作するため、ログインエンドポイントには適用できません。`LoginUseCase`内で認証成功後にIP検証を行います。

## セキュリティ考慮事項

### 1. IPアドレス偽装対策

- リバースプロキシ（Nginx、CloudFlare等）経由の場合、`X-Forwarded-For` ヘッダーからIPアドレスを取得
- 信頼できるプロキシの設定が必要
- 複数の `X-Forwarded-For` ヘッダーがある場合、最初のIPアドレスを使用（クライアントに最も近いIP）

### 2. CIDR記法のセキュリティ

- CIDR記法による範囲指定を許可（例: 192.168.1.0/24）
- 過度に広い範囲（例: 0.0.0.0/0）の追加は制限するか警告を表示
- プライベートIPアドレス範囲（RFC 1918）の使用を許可

### 3. IPv6サポート

- IPv4とIPv6の両方をサポート
- IPv6のCIDR記法もサポート（例: 2001:db8::/32）

### 4. デフォルト動作

- IP AllowListが空の場合、すべてのIPアドレスからのアクセスを許可（後方互換性のため）
- IP AllowListが設定されている場合のみ、制限を適用

## 実装詳細

### IPアドレスValue Object

```typescript
export class IpAddress {
  private readonly value: string; // IPv4またはIPv6アドレス、またはCIDR記法
  private readonly cidr?: number; // CIDRプレフィックス長（オプション）

  constructor(value: string) {
    // バリデーション: IPv4/IPv6形式、CIDR記法の検証
    this.validate(value);
    this.value = value;
    // CIDR記法の場合はプレフィックス長を抽出
    this.parseCidr(value);
  }

  public isInRange(ip: string): boolean {
    // CIDR記法の場合、指定されたIPアドレスが範囲内かチェック
    // 単一IPアドレスの場合は完全一致をチェック
    // このロジックはValue Object内にカプセル化
  }

  private validate(value: string): void {
    // IPv4/IPv6形式、CIDR記法の検証
  }

  private parseCidr(value: string): void {
    // CIDR記法の場合はプレフィックス長を抽出
  }
}
```

### ログインUseCaseの統合

`LoginUseCase` は、パスワード認証成功後に`VerifyIpAllowListUseCase`を呼び出してIP検証を行います。検証に失敗した場合は403 Forbiddenを返します。

**注意**: Guardは認証前に動作するため、ログインエンドポイントには適用できません。`LoginUseCase`内で認証成功後にIP検証を行います。

## データベース設計

### ip_allowlists テーブル（将来実装）

```sql
CREATE TABLE ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL, -- IPv4またはIPv6、CIDR記法も可
  description VARCHAR(255), -- オプション: IPアドレスの説明
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ip_address)
);

CREATE INDEX idx_ip_allowlists_user_id ON ip_allowlists(user_id);
```

**注意**: 初期実装ではインメモリストレージを使用し、将来DBに移行することを想定。

## 移行計画

### Phase 1: 基本機能実装（初期）

1. Domain Layer: `IpAddress` Value Object、`IIpAllowListRepository` インターフェース
2. Infrastructure Layer: `IpAddressService`、`IpAllowListRepository`（インメモリ）
3. Application Layer: Use Cases実装
4. Presentation Layer: `IpAllowListController`、DTOs
5. Guard実装: `IpAllowListGuard`
6. ユニットテスト実装

### Phase 2: ログイン統合

1. `LoginUseCase` へのIP検証統合
2. `AuthController` へのGuard適用
3. E2Eテスト実装

### Phase 3: データベース移行（将来）

1. `ip_allowlists` テーブル作成
2. `IpAllowListRepository` をDB実装に置き換え
3. マイグレーションスクリプト作成

## テスト戦略

### ユニットテスト

- **IpAddress Value Object**: IPアドレスバリデーション、CIDR記法のパース、範囲チェック
- **IpAddressService**: IPv4/IPv6検証、CIDR計算、マッチングロジック
- **Use Cases**: 各Use Caseの正常系・異常系
- **IpAllowListGuard**: IPアドレス抽出、検証ロジック

### E2Eテスト

- IP AllowList追加・削除・一覧取得
- 許可されたIPアドレスからのログイン成功
- 許可されていないIPアドレスからのログイン失敗（403 Forbidden）
- CIDR記法による範囲指定の検証
- IPv6アドレスの検証

### テストカバレッジ目標

- ユニットテスト: 90%以上
- E2Eテスト: 主要フロー100%

## パフォーマンス考慮事項

### IP AllowList検証の最適化

- IP AllowListはユーザーごとにキャッシュ可能
- 頻繁にアクセスされるIPアドレスはメモリキャッシュに保持
- CIDR計算は効率的なアルゴリズムを使用

### スケーラビリティ

- ユーザーごとのIP AllowList数に制限を設ける（例: 最大50件）
- 大量のIP AllowListがある場合の検証パフォーマンスを考慮

## エラーハンドリング

### 想定されるエラー

1. **無効なIPアドレス形式**: 400 Bad Request
2. **重複するIPアドレス**: 409 Conflict
3. **存在しないIP AllowList削除**: 404 Not Found
4. **許可されていないIPアドレスからのアクセス**: 403 Forbidden
5. **IP AllowList数制限超過**: 400 Bad Request

### エラーレスポンス形式

```json
{
  "statusCode": 400,
  "message": "Invalid IP address format",
  "error": "Bad Request"
}
```

## 将来の拡張可能性

1. **IPアドレスの自動検出**: 初回ログイン時にIPアドレスを自動提案
2. **IPアドレス変更通知**: 新しいIPアドレスからのログイン時にメール通知
3. **地理的位置情報**: IPアドレスから地理的位置を取得し、国単位での制限
4. **動的IPアドレスの自動更新**: 定期的にIPアドレスを更新する機能
5. **IP AllowListのインポート/エクスポート**: CSV形式での一括管理

