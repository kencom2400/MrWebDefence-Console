# MWD-32 パスワードポリシー機能 実装計画

## 実装状況の確認

### 現在の状態
- ✅ **設計ドキュメント**: 完了（PR #40でマージ済み）
- ❌ **実装**: 未着手（0%）
- ❌ **テスト**: 未着手

### 設計ドキュメントの確認
- `docs/detailed-design/MWD-32_password-policy-implementation/README.md` - 設計書
- `docs/detailed-design/MWD-32_password-policy-implementation/class-diagrams.md` - クラス図
- `docs/detailed-design/MWD-32_password-policy-implementation/input-output-design.md` - 入出力設計
- `docs/detailed-design/MWD-32_password-policy-implementation/sequence-diagrams.md` - シーケンス図

### 既存実装の確認
- ✅ `PasswordService` - 既存（ハッシュ化・検証機能あり）
- ✅ `AuthModule` - 既存（モジュール構成あり）
- ❌ `PasswordPolicy` Value Object - **未実装**
- ❌ `IPasswordHistoryRepository` - **未実装**
- ❌ `PasswordHistoryRepository` - **未実装**
- ❌ `PasswordPolicyService` - **未実装**
- ❌ `ChangePasswordUseCase` - **未実装**
- ❌ `ValidatePasswordPolicyUseCase` - **未実装**
- ❌ `GetPasswordPolicyUseCase` - **未実装**
- ❌ `PasswordController` - **未実装**
- ❌ DTOs - **未実装**
- ❌ ユニットテスト - **未実装**
- ❌ E2Eテスト - **未実装**

## 実装計画

### Phase 1: Domain Layer（基盤実装）

#### 1.1 PasswordPolicy Value Object
**ファイル**: `apps/backend/src/domain/value-objects/password-policy.value-object.ts`
- パスワードポリシー設定のカプセル化
- バリデーションロジック（複雑さチェック）
- 不変性の保証

**実装内容**:
- `minLength`, `maxLength`, `requireUppercase`, `requireLowercase`, `requireNumbers`, `requireSymbols`, `historyCount` プロパティ
- `validate(password: string): ValidationResult` メソッド
- `equals(other: PasswordPolicy): boolean` メソッド

**テスト**: `apps/backend/src/domain/value-objects/password-policy.value-object.spec.ts`
- ポリシー設定のバリデーション
- パスワードの複雑さチェック（正常系・異常系）
- 不変性の検証

#### 1.2 IPasswordHistoryRepository インターフェース
**ファイル**: `apps/backend/src/domain/repositories/password-history.repository.interface.ts`
- パスワード履歴のリポジトリインターフェース定義

**実装内容**:
- `savePasswordHistory(userId: string, passwordHash: string): Promise<void>`
- `getPasswordHistory(userId: string, count: number): Promise<string[]>`
- `checkPasswordInHistory(userId: string, passwordHash: string, count: number): Promise<boolean>`
- `deleteOldHistory(userId: string, keepCount: number): Promise<void>`

### Phase 2: Infrastructure Layer（技術的実装）

#### 2.1 PasswordPolicyService
**ファイル**: `apps/backend/src/infrastructure/services/password-policy.service.ts`
- `PasswordPolicy` Value Objectのファクトリメソッド
- パスワード強度スコア計算（技術的なアルゴリズム）

**実装内容**:
- `createPasswordPolicy(): PasswordPolicy` - デフォルトポリシーの生成
- `calculateStrengthScore(password: string): number` - 強度スコア計算（0-100）

**テスト**: `apps/backend/src/infrastructure/services/password-policy.service.spec.ts`
- Value Objectの生成
- 強度スコア計算の検証

#### 2.2 PasswordHistoryRepository（インメモリ実装）
**ファイル**: `apps/backend/src/infrastructure/repositories/password-history.repository.ts`
- パスワード履歴の永続化（初期実装はインメモリ）

**実装内容**:
- `Map<string, string[]>` を使用したインメモリストレージ
- ユーザーごとのパスワード履歴管理
- 最新N個のみ保持（古い履歴は自動削除）

**テスト**: `apps/backend/src/infrastructure/repositories/password-history.repository.spec.ts`
- 履歴の保存・取得・検証
- 古い履歴の自動削除

### Phase 3: Application Layer（ビジネスロジック）

#### 3.1 ChangePasswordUseCase
**ファイル**: `apps/backend/src/application/use-cases/change-password.use-case.ts`
- パスワード変更処理

**実装内容**:
- 現在のパスワード検証（PasswordService経由）
- 新しいパスワードのポリシー検証（PasswordPolicy Value Object経由）
- パスワード履歴チェック（PasswordHistoryRepository経由）
- パスワードハッシュ化（PasswordService経由）
- パスワード履歴の保存（PasswordHistoryRepository経由）
- ユーザーエンティティの更新（UserRepository経由）

**テスト**: `apps/backend/src/application/use-cases/change-password.use-case.spec.ts`
- 正常系（パスワード変更成功）
- 異常系（現在のパスワードが間違っている、ポリシー違反、再利用など）

#### 3.2 ValidatePasswordPolicyUseCase
**ファイル**: `apps/backend/src/application/use-cases/validate-password-policy.use-case.ts`
- パスワードポリシー検証処理

**実装内容**:
- パスワードの複雑さチェック（PasswordPolicy Value Object経由）
- パスワード強度スコア計算（PasswordPolicyService経由）
- パスワード履歴との照合（PasswordHistoryRepository経由）

**テスト**: `apps/backend/src/application/use-cases/validate-password-policy.use-case.spec.ts`
- 正常系（有効なパスワード、無効なパスワード、再利用パスワード）

#### 3.3 GetPasswordPolicyUseCase
**ファイル**: `apps/backend/src/application/use-cases/get-password-policy.use-case.ts`
- パスワードポリシー設定取得処理

**実装内容**:
- 現在のパスワードポリシー設定を返却（PasswordPolicyService経由）

**テスト**: `apps/backend/src/application/use-cases/get-password-policy.use-case.spec.ts`
- 正常系（ポリシー設定の取得）

### Phase 4: Presentation Layer（API実装）

#### 4.1 DTOs
**ファイル**: 
- `apps/backend/src/presentation/dto/change-password.dto.ts`
- `apps/backend/src/presentation/dto/validate-password.dto.ts`
- `apps/backend/src/presentation/dto/password-policy.dto.ts`
- `apps/backend/src/presentation/dto/validate-password-result.dto.ts`

**実装内容**:
- リクエスト/レスポンスの型定義
- class-validator によるバリデーション

#### 4.2 PasswordController
**ファイル**: `apps/backend/src/presentation/controllers/password.controller.ts`
- パスワード管理API

**実装内容**:
- `POST /api/v1/auth/password/change` - パスワード変更
- `POST /api/v1/auth/password/validate` - パスワード強度チェック
- `GET /api/v1/auth/password/policy` - パスワードポリシー設定取得

**テスト**: `apps/backend/src/presentation/controllers/password.controller.spec.ts`
- コントローラーのユニットテスト

#### 4.3 AuthModule の更新
**ファイル**: `apps/backend/src/presentation/auth.module.ts`
- `PasswordController` の追加
- Use Cases の追加
- `PasswordPolicyService` の追加
- `IPasswordHistoryRepository` の追加

### Phase 5: E2Eテスト

#### 5.1 E2Eテスト
**ファイル**: `apps/backend/test/password.e2e-spec.ts`

**テストケース**:
1. **パスワード変更（正常系）**
   - 有効なパスワードで変更成功
   - パスワード履歴に保存されることを確認

2. **パスワード変更（異常系）**
   - 現在のパスワードが間違っている
   - パスワードポリシー違反（短すぎる、文字種不足など）
   - パスワード再利用（過去のパスワード）

3. **パスワード強度チェック**
   - 有効なパスワードの検証
   - 無効なパスワードの検証
   - 再利用パスワードの検証
   - 強度スコアの確認

4. **パスワードポリシー設定取得**
   - ポリシー設定の取得

5. **認証エラー**
   - 未認証でのアクセス

## 実装順序（推奨）

1. **Phase 1: Domain Layer**（基盤）
   - PasswordPolicy Value Object
   - IPasswordHistoryRepository インターフェース

2. **Phase 2: Infrastructure Layer**（技術的実装）
   - PasswordPolicyService
   - PasswordHistoryRepository

3. **Phase 3: Application Layer**（ビジネスロジック）
   - GetPasswordPolicyUseCase（最もシンプル）
   - ValidatePasswordPolicyUseCase
   - ChangePasswordUseCase（最も複雑）

4. **Phase 4: Presentation Layer**（API）
   - DTOs
   - PasswordController
   - AuthModule の更新

5. **Phase 5: E2Eテスト**
   - 全エンドポイントのE2Eテスト

## 実装時の注意事項

### セキュリティ
- パスワードは常にハッシュ化して保存（bcrypt）
- タイミング攻撃対策（常にハッシュ化処理を実行）
- エラーメッセージは詳細すぎないようにする

### パフォーマンス
- パスワード履歴の検証は、最新N個のみをチェック
- パスワードハッシュ化は非同期処理で実行
- パスワード履歴の保存は、ユーザーごとに最新N個のみを保持

### テスト
- ユニットテスト: 90%以上のカバレッジ目標
- E2Eテスト: 主要フロー100%カバー
- テスト間での状態分離（Redisのflushdbなど）

### コード品質
- Onion Architectureに従う
- Value ObjectとServiceの責務分離
- 依存性注入の適切な使用
- 型安全性の確保

## 見積もり

### 実装時間（目安）
- Phase 1: Domain Layer - **2-3時間**
- Phase 2: Infrastructure Layer - **3-4時間**
- Phase 3: Application Layer - **4-5時間**
- Phase 4: Presentation Layer - **2-3時間**
- Phase 5: E2Eテスト - **2-3時間**
- **合計: 13-18時間**

### 実装ステップ数
- 新規ファイル作成: **約20ファイル**
- 既存ファイル修正: **1ファイル**（AuthModule）

## 次のステップ

1. 実装ブランチの作成: `feature/MWD-32-password-policy-implementation`
2. Phase 1から順次実装
3. 各Phase完了時にコミット
4. 全実装完了後にPR作成
5. レビュー対応
6. CI通過確認
7. マージ

