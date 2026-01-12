# パスワードポリシー機能実装設計書

## 概要

本設計書は、MWD-32「Task 3.6: パスワードポリシー機能実装」の詳細設計を定義します。

### 目的

セキュリティを強化するため、パスワードの複雑さ要件と履歴管理を実装します。ユーザーが強力なパスワードを設定し、過去のパスワードの再利用を防ぐことで、アカウントのセキュリティを向上させます。

### スコープ

- パスワード複雑さ要件の実装（最小長、文字種、大文字/小文字/数字/記号）
- パスワード履歴管理（過去N個のパスワードを保存し、再利用を防ぐ）
- パスワード変更API
- パスワード強度チェックAPI
- パスワードポリシー設定の取得API
- 既存のログイン機能との統合

### 非スコープ

- パスワードリセット機能（別タスクで実装予定）
- パスワード有効期限の強制（将来実装）
- パスワード強度の可視化（UI側の実装）
- パスワードポリシーの動的変更（初期実装では固定）

## アーキテクチャ

### アーキテクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - PasswordController (New)        │
│  - DTOs (ChangePasswordDto, etc.)  │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - ChangePasswordUseCase (New)     │
│  - ValidatePasswordPolicyUseCase   │
│    (New)                            │
│  - GetPasswordPolicyUseCase (New)  │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - PasswordPolicy Value Object      │
│    (New)                            │
│  - IPasswordHistoryRepository      │
│    (New)                            │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - PasswordHistoryRepository (New) │
│  - PasswordPolicyService (New)      │
│  - PasswordService (Modified)      │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **パスワードハッシュ**: bcrypt（既存）
- **ストレージ**: インメモリ（初期実装）、将来はDBに移行

## 主要コンポーネント

### 1. Domain Layer

- **PasswordPolicy Value Object**: パスワードポリシー設定をカプセル化（バリデーション、不変性）
  - 最小長、最大長
  - 必須文字種（大文字、小文字、数字、記号）
  - 履歴保存数
- **IPasswordHistoryRepository**: パスワード履歴のリポジトリインターフェース

**注意**: Value Objectは自身の不変性と正当性を維持する責務を持ちます。パスワードの複雑さチェック（文字種、長さなど）やバリデーションロジックは`PasswordPolicy` Value Object内にカプセル化します。技術的な詳細（ハッシュ化、強度スコア計算など）はInfrastructure層の`PasswordPolicyService`が担当します。

### 2. Application Layer

- **ChangePasswordUseCase**: パスワード変更処理
  - 現在のパスワード検証
  - 新しいパスワードのポリシー検証
  - パスワード履歴チェック
  - パスワードハッシュ化（PasswordService経由）
  - パスワード履歴の保存（PasswordHistoryRepository経由）
  - ユーザーエンティティの更新（UserRepository経由）
- **ValidatePasswordPolicyUseCase**: パスワードポリシー検証処理
  - パスワードの複雑さチェック
  - パスワード履歴との照合
- **GetPasswordPolicyUseCase**: パスワードポリシー設定取得処理
  - 現在のパスワードポリシー設定を返却

### 3. Infrastructure Layer

- **PasswordHistoryRepository**: パスワード履歴の永続化（初期実装はインメモリ）
  - パスワード履歴の保存・取得・検証
- **PasswordPolicyService**: パスワードポリシー検証の技術的な実装
  - `PasswordPolicy` Value Objectのファクトリメソッドとして機能
  - パスワード強度スコア計算（技術的なアルゴリズム）
- **PasswordService (Modified)**: パスワードのハッシュ化と検証（既存機能を拡張）

### 4. Presentation Layer

- **PasswordController**: パスワード管理API
  - `POST /api/v1/auth/password/change` - パスワード変更
  - `POST /api/v1/auth/password/validate` - パスワード強度チェック
  - `GET /api/v1/auth/password/policy` - パスワードポリシー設定取得
- **DTOs**: リクエスト/レスポンスの型定義

## データフロー

### パスワード変更フロー

1. クライアントが `POST /api/v1/auth/password/change` を呼び出し
2. `PasswordController` がリクエストを受信
3. `ChangePasswordUseCase` が実行される
4. 現在のパスワードを検証（PasswordService経由）
5. 新しいパスワードのポリシー検証（PasswordPolicy Value Object経由）
6. パスワード履歴をチェック（PasswordHistoryRepository経由）
7. 新しいパスワードをハッシュ化（PasswordService経由）
8. パスワード履歴に保存（PasswordHistoryRepository経由）
9. ユーザーエンティティを更新（UserRepository経由）
10. レスポンスを返却

### パスワード強度チェックフロー

1. クライアントが `POST /api/v1/auth/password/validate` を呼び出し
2. `PasswordController` がリクエストを受信
3. `ValidatePasswordPolicyUseCase` が実行される
4. パスワードの複雑さチェック（PasswordPolicy Value Object経由）
5. パスワード強度スコアを計算（PasswordPolicyService経由）
6. 検証結果と強度スコアを返却

## セキュリティ考慮事項

### 1. パスワード複雑さ要件

- **最小長**: 8文字以上（設定可能、デフォルト: 8）
- **最大長**: 128文字以下（設定可能、デフォルト: 128）
- **必須文字種**:
  - 大文字（A-Z）: 1文字以上
  - 小文字（a-z）: 1文字以上
  - 数字（0-9）: 1文字以上
  - 記号（!@#$%^&*等）: 1文字以上（設定可能、デフォルト: 必須）

### 2. パスワード履歴管理

- 過去N個のパスワードをハッシュ化して保存（設定可能、デフォルト: 5）
- 新しいパスワードが過去のパスワードと一致する場合は拒否
- パスワード履歴はハッシュ化して保存（bcrypt）

### 3. パスワード強度スコア

- 0-100のスコアでパスワード強度を評価
- スコア計算要素:
  - 長さ（長いほど高スコア）
  - 文字種の多様性（大文字、小文字、数字、記号）
  - 一般的なパスワードパターンの回避

### 4. タイミング攻撃対策

- パスワード検証時のタイミング攻撃を防ぐため、常にハッシュ化処理を実行
- エラーメッセージは詳細すぎないようにする（ユーザー存在の推測を防ぐ）

## 実装詳細

### Phase 1: 基本機能実装（初期実装）

1. **Domain Layer**
   - `PasswordPolicy` Value Objectの実装
   - `IPasswordHistoryRepository` インターフェースの定義

2. **Infrastructure Layer**
   - `PasswordHistoryRepository`（インメモリ実装）
   - `PasswordPolicyService`の実装
   - `PasswordService`の拡張（必要に応じて）

3. **Application Layer**
   - `ChangePasswordUseCase`の実装
   - `ValidatePasswordPolicyUseCase`の実装
   - `GetPasswordPolicyUseCase`の実装

4. **Presentation Layer**
   - `PasswordController`の実装
   - DTOsの実装

5. **テスト**
   - ユニットテスト
   - E2Eテスト

### Phase 2: データベース移行（将来）

1. `password_histories` テーブル作成
2. `PasswordHistoryRepository` をDB実装に置き換え
3. マイグレーションスクリプト作成

## テスト戦略

### ユニットテスト

- **PasswordPolicy Value Object**: ポリシー設定のバリデーション、不変性、パスワードの複雑さチェック
- **PasswordPolicyService**: Value Objectの生成（ファクトリ）、パスワード強度スコア計算
- **Use Cases**: 各Use Caseの正常系・異常系
- **PasswordHistoryRepository**: 履歴の保存・取得・検証

### E2Eテスト

- パスワード変更（正常系・異常系）
- パスワード強度チェック
- パスワードポリシー設定取得
- パスワード履歴による再利用防止の検証
- 複雑さ要件違反の検証

### テストカバレッジ目標

- ユニットテスト: 90%以上
- E2Eテスト: 主要フロー100%

## パフォーマンス考慮事項

- パスワード履歴の検証は、最新N個のみをチェック（全履歴をチェックしない）
- パスワードハッシュ化は非同期処理で実行（bcrypt）
- パスワード履歴の保存は、ユーザーごとに最新N個のみを保持（古い履歴は自動削除）

## 設定値

### デフォルトパスワードポリシー

```typescript
{
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  historyCount: 5, // 過去5個のパスワードを保存
}
```

### 環境変数（将来実装）

- `PASSWORD_MIN_LENGTH`: 最小長（デフォルト: 8）
- `PASSWORD_MAX_LENGTH`: 最大長（デフォルト: 128）
- `PASSWORD_REQUIRE_SYMBOLS`: 記号必須フラグ（デフォルト: true）
- `PASSWORD_HISTORY_COUNT`: 履歴保存数（デフォルト: 5）

## エラーハンドリング

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 400 | `INVALID_PASSWORD_FORMAT` | 無効なパスワード形式 |
| 400 | `PASSWORD_TOO_SHORT` | パスワードが短すぎる |
| 400 | `PASSWORD_TOO_LONG` | パスワードが長すぎる |
| 400 | `PASSWORD_MISSING_UPPERCASE` | 大文字が含まれていない |
| 400 | `PASSWORD_MISSING_LOWERCASE` | 小文字が含まれていない |
| 400 | `PASSWORD_MISSING_NUMBERS` | 数字が含まれていない |
| 400 | `PASSWORD_MISSING_SYMBOLS` | 記号が含まれていない |
| 400 | `PASSWORD_REUSED` | 過去のパスワードが再利用されている |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 401 | `INVALID_CURRENT_PASSWORD` | 現在のパスワードが間違っている |
| 404 | `USER_NOT_FOUND` | ユーザーが見つからない |

## 参照資料

- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

