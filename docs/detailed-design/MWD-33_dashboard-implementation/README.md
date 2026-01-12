# ダッシュボード機能実装設計書

## 概要

本設計書は、MWD-33「Task 4.1: ダッシュボード実装」の詳細設計を定義します。

### 目的

ユーザーが認証関連の統計情報やセキュリティ状態を一目で把握できるダッシュボード機能を実装します。これにより、ユーザーは自身のアカウントのセキュリティ状況を理解し、適切な対策を講じることができます。

### スコープ

- ダッシュボードデータ取得API
- 認証統計情報の表示（ログイン試行回数、MFA有効化状態、IP AllowList数など）
- セキュリティ状態の可視化
- ユーザーごとのダッシュボードデータ管理

### 非スコープ

- リアルタイム更新機能（将来実装）
- グラフ・チャートの描画（UI側の実装）
- 詳細なログ分析機能（別タスクで実装予定）
- アラート・通知機能（別タスクで実装予定）

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - DashboardController (New)       │
│  - DTOs (DashboardDto, etc.)       │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - GetDashboardDataUseCase (New)   │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - DashboardData Value Object (New)│
│  - IDashboardRepository (New)      │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - DashboardRepository (New)        │
│  - UserRepository (Existing)       │
│  - MfaRepository (Existing)        │
│  - IpAllowListRepository (Future)  │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **ストレージ**: インメモリ（初期実装）、将来はDBに移行

## 主要コンポーネント

### 1. Domain Layer

- **DashboardData Value Object**: ダッシュボードデータをカプセル化（不変性、バリデーション）
  - 認証統計情報
  - セキュリティ状態
  - MFA有効化状態
  - IP AllowList数
**注意**: Value Objectは自身の不変性と正当性を維持する責務を持ちます。データの集計ロジックはApplication層のUse Caseが担当します。`IDashboardRepository`は将来の統計情報永続化のために予約されていますが、初期実装では使用しません。

### 2. Application Layer

- **GetDashboardDataUseCase**: ダッシュボードデータ取得処理
  - ユーザー情報の取得（UserRepository経由）
  - MFA状態の取得（MfaRepository経由）
  - IP AllowList数の取得（IpAllowListRepository経由、将来実装）
  - 統計情報の集計
  - DashboardData Value Objectの生成

### 3. Infrastructure Layer

- **UserRepository (Existing)**: ユーザー情報の取得
- **MfaRepository (Existing)**: MFA状態の取得
- **IpAllowListRepository (Future)**: IP AllowList数の取得（将来実装）

**注意**: 初期実装では、`GetDashboardDataUseCase`が既存のRepository（`IUserRepository`、`IMfaRepository`、`IIpAllowListRepository`）を直接使用してデータを集計します。`DashboardRepository`は将来の統計情報永続化のために予約されていますが、初期実装では使用しません。

### 4. Presentation Layer

- **DashboardController**: ダッシュボード管理API
  - `GET /api/v1/dashboard` - ダッシュボードデータ取得
- **DTOs**: リクエスト/レスポンスの型定義

## データフロー

### ダッシュボードデータ取得フロー

1. クライアントが `GET /api/v1/dashboard` を呼び出し
2. `DashboardController` がリクエストを受信
3. `GetDashboardDataUseCase` が実行される
4. ユーザー情報を取得（UserRepository経由）
5. MFA状態を取得（MfaRepository経由）
6. IP AllowList数を取得（IpAllowListRepository経由、将来実装）
7. 統計情報を集計
8. DashboardData Value Objectを生成
9. レスポンスを返却

## セキュリティ考慮事項

### 1. 認証・認可

- ダッシュボードAPIは認証必須（JWT）
- ユーザーは自身のダッシュボードデータのみアクセス可能
- 管理者権限は不要（一般ユーザーもアクセス可能）

### 2. データプライバシー

- ユーザーごとのデータ分離を保証
- 他のユーザーの情報は一切返却しない

### 3. パフォーマンス

- ダッシュボードデータの取得は高速化を考慮
- 必要に応じてキャッシュを導入（将来実装）

## 実装詳細

### Phase 1: 基本機能実装（初期実装）

1. **Domain Layer**
   - `DashboardData` Value Objectの実装
   - `IDashboardRepository` インターフェースの定義

2. **Infrastructure Layer**
   - 既存のRepository（`UserRepository`、`MfaRepository`）を活用
   - `IpAllowListRepository`は将来実装（初期実装では0を返す）

3. **Application Layer**
   - `GetDashboardDataUseCase`の実装

4. **Presentation Layer**
   - `DashboardController`の実装
   - DTOsの実装

5. **テスト**
   - ユニットテスト
   - E2Eテスト

### Phase 2: データベース移行（将来）

1. ダッシュボード統計情報の永続化
2. `DashboardRepository` をDB実装に置き換え
3. マイグレーションスクリプト作成

## テスト戦略

### ユニットテスト

- **DashboardData Value Object**: データのバリデーション、不変性
- **GetDashboardDataUseCase**: 各Use Caseの正常系・異常系、データ集計ロジック

### E2Eテスト

- ダッシュボードデータ取得（正常系・異常系）
- 認証必須の検証
- ユーザーごとのデータ分離の検証

### テストカバレッジ目標

- ユニットテスト: 90%以上
- E2Eテスト: 主要フロー100%

## パフォーマンス考慮事項

- ダッシュボードデータの取得は、複数のRepository呼び出しを並列実行（`Promise.all`）して高速化
- 必要に応じてキャッシュを導入（将来実装）

## ダッシュボードデータ構造

### 認証統計情報

- アカウント作成日時
- 最終ログイン日時（将来実装）
- ログイン試行回数（将来実装）

### セキュリティ状態

- MFA有効化状態（`mfaEnabled`）
- IP AllowList数（将来実装）
- パスワード最終変更日時（将来実装）

### その他

- ユーザー情報（email、role）

## エラーハンドリング

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 404 | `USER_NOT_FOUND` | ユーザーが見つからない |
| 500 | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |

## 参照資料

- [NestJS Documentation](https://docs.nestjs.com/)
- [Onion Architecture](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)

