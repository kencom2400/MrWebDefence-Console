# WAFエンジン向け設定配信API実装設計書

## 概要

本設計書は、MWD-100「Task 4.6: WAFエンジン向け設定配信API実装」の詳細設計を定義します。

### 目的

WAFエンジン（設定取得エージェント）が設定を取得するためのAPIを実装します。WAFエンジンは定期的にこのAPIを呼び出し、最新の設定情報（FQDN、IP AllowList、顧客情報など）を取得して、WAFの動作を制御します。

### スコープ

- `GET /engine/v1/config`エンドポイント実装
- 認証・認可（APIキーまたはJWTトークン）
- 設定データの集約と配信
- レスポンスのキャッシュ対応（将来実装）

### 非スコープ

- 設定の変更・更新機能（既存の管理APIを使用）
- 設定の差分配信（将来実装）
- 設定のバージョン管理（将来実装）

## アーキテクチャ

### アーキテクチャパターン

Onion Architecture（オニオンアーキテクチャ）に従い、レイヤを明確に分離します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - EngineConfigController            │
│  - DTOs (EngineConfigResponseDto)    │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                   │
│  - GetEngineConfigUseCase            │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - EngineConfig Value Object         │
│  - IFqdnRepository (interface)      │
│  - IIpAllowListRepository (interface)│
│  - ICustomerRepository (interface)  │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - FqdnRepository (implementation)  │
│  - IpAllowListRepository (implementation)│
│  - CustomerRepository (implementation)│
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **認証**: APIキーまたはJWTトークン
- **データベース**: 既存のリポジトリを使用（FQDN、IP AllowList、顧客）

## 主要コンポーネント

### 1. Presentation Layer

- **EngineConfigController**: WAFエンジン向け設定配信APIのHTTPエンドポイントを提供
- **EngineConfigResponseDto**: 設定配信レスポンスのDTO

### 2. Application Layer

- **GetEngineConfigUseCase**: 設定情報を集約して返却するユースケース

### 3. Domain Layer

- **EngineConfig Value Object**: WAFエンジンに配信する設定情報を表す値オブジェクト
- **IFqdnRepository**: FQDNリポジトリのインターフェース（既存）
- **IIpAllowListRepository**: IP AllowListリポジトリのインターフェース（既存）
- **ICustomerRepository**: 顧客リポジトリのインターフェース（既存）

### 4. Infrastructure Layer

- **FqdnRepository**: FQDNリポジトリの実装（既存）
- **IpAllowListRepository**: IP AllowListリポジトリの実装（既存）
- **CustomerRepository**: 顧客リポジトリの実装（既存）

## データフロー

### 設定取得フロー

1. WAFエンジンが`GET /engine/v1/config`を呼び出し
2. EngineConfigControllerがリクエストを受信し、認証・認可を確認
3. GetEngineConfigUseCaseが実行される
4. 各リポジトリから設定情報を取得（FQDN、IP AllowList、顧客情報など）
5. EngineConfig Value Objectに集約
6. レスポンスとして設定情報を返却

## セキュリティ考慮事項

- **認証**: APIキーまたはJWTトークンによる認証を必須とする
- **認可**: WAFエンジン専用のロール・権限を設定（将来実装）
- **レート制限**: 過度なリクエストを防ぐため、レート制限を実装（将来実装）
- **HTTPS**: すべての通信はHTTPSを使用
- **データ保護**: 機密情報を含む設定データの保護

## パフォーマンス考慮事項

- **キャッシュ**: 設定データの変更頻度が低い場合、レスポンスをキャッシュ（将来実装）
- **効率的なデータ取得**: 必要なデータのみを取得し、不要なデータは除外
- **レスポンスサイズ**: 大量のデータがある場合、ページネーションを検討（将来実装）

## 参照資料

- Issue: [MWD-100](https://kencom2400.atlassian.net/browse/MWD-100)
- FQDN管理設計書: `docs/detailed-design/MWD-36_fqdn-management/`
- IP AllowList設計書: `docs/detailed-design/MWD-31_ip-allowlist-implementation/`
- 顧客管理設計書: `docs/detailed-design/MWD-34_customer-management/`
