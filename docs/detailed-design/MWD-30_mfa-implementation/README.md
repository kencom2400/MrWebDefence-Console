# MFA（多要素認証）機能実装設計書

## 概要

本設計書は、MWD-30「Task 3.4: MFA機能実装」の詳細設計を定義します。

### 目的

セキュリティを強化するため、ユーザー認証に多要素認証（MFA: Multi-Factor Authentication）を導入します。パスワード認証に加えて、TOTP（Time-based One-Time Password）による二要素認証を実装し、アカウントのセキュリティを向上させます。

### スコープ

- TOTP実装（RFC 6238準拠）
- QRコード生成機能実装
- バックアップコード生成・管理機能
- MFA有効化/無効化API
- MFA認証フロー（ログイン時の二要素認証）
- 既存の認証機能との統合

## アーキテクチャ

### アーキテラクチャパターン

既存のOnion Architectureに従い、インフラストラクチャ層やプレゼンテーション層に必要なコンポーネントを追加します。

### レイヤ構成

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │
│  - MfaController (New)              │
│  - AuthController (Modified)        │
│  - DTOs (MfaSetupDto, etc.)        │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Application Layer                  │
│  - SetupMfaUseCase (New)            │
│  - VerifyMfaUseCase (New)           │
│  - DisableMfaUseCase (New)          │
│  - LoginUseCase (Modified)          │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Domain Layer                       │
│  - User Entity (Modified)           │
│  - MfaSecret Value Object (New)     │
│  - BackupCode Value Object (New)    │
│  - IMfaRepository (New)             │
└──────────────┬──────────────────────┘
               │ 依存
┌──────────────▼──────────────────────┐
│  Infrastructure Layer               │
│  - MfaRepository (New)              │
│  - TotpService (New)                │
│  - QrCodeService (New)              │
│  - BackupCodeService (New)          │
└─────────────────────────────────────┘
```

### 技術スタック

- **フレームワーク**: NestJS
- **TOTP実装**: `speakeasy` または `otplib` ライブラリ
- **QRコード生成**: `qrcode` ライブラリ
- **ストレージ**: Redis（MFAシークレットの一時保存用、本番環境ではDBに保存）

## 主要コンポーネント

### 1. Domain Layer

- **User Entity**: `mfaEnabled` フラグと `mfaSecret` を追加
- **MfaSecret Value Object**: MFAシークレットをカプセル化
- **BackupCode Value Object**: バックアップコードをカプセル化
- **IMfaRepository**: MFA関連データのリポジトリインターフェース

### 2. Application Layer

- **SetupMfaUseCase**: MFAセットアップ処理
  - シークレット生成
  - QRコード生成
  - 一時保存（検証前）
- **GenerateBackupCodesUseCase**: バックアップコード生成処理（検証成功後）
  - バックアップコード生成
  - ハッシュ化
  - 永続化
- **VerifyMfaUseCase**: MFA検証処理
  - TOTPコード検証
  - バックアップコード検証
- **DisableMfaUseCase**: MFA無効化処理
- **LoginUseCase (Modified)**: MFA有効なユーザーの場合、二段階認証を要求

### 3. Infrastructure Layer

- **MfaRepository**: MFAシークレットとバックアップコードの永続化
- **TotpService**: TOTPコードの生成・検証（RFC 6238準拠）
- **QrCodeService**: QRコード生成（OTPAUTH URI形式）
- **BackupCodeService**: バックアップコードの生成・検証・ハッシュ化

### 4. Presentation Layer

- **MfaController**: MFA関連のHTTPエンドポイント
  - `POST /api/v1/auth/mfa/setup` - MFAセットアップ開始（QRコードのみ返却）
  - `POST /api/v1/auth/mfa/verify-setup` - セットアップ時の検証（成功時にバックアップコード返却）
  - `POST /api/v1/auth/mfa/verify` - ログイン時のMFA検証
  - `POST /api/v1/auth/mfa/disable` - MFA無効化
  - `GET /api/v1/auth/mfa/backup-codes` - バックアップコード一覧取得（使用済み/未使用の状態を含む）
  - `POST /api/v1/auth/mfa/backup-codes/regenerate` - バックアップコード再生成（既存コードは無効化）
- **AuthController (Modified)**: ログインAPIを修正し、MFA有効な場合は中間状態を返す

## データフロー

### 1. MFAセットアップフロー

1. ユーザーがMFAセットアップをリクエスト
2. `SetupMfaUseCase` がシークレットを生成
3. `QrCodeService` がQRコードを生成（OTPAUTH URI形式）
4. シークレットを一時的に保存（Redisまたはセッション）
5. クライアントにQRコードのみを返却（バックアップコードはまだ生成しない）
6. ユーザーが認証アプリでQRコードをスキャン
7. ユーザーがTOTPコードを入力して検証
8. 検証成功後、`BackupCodeService` がバックアップコードを生成
9. `MfaRepository` にシークレットとバックアップコード（ハッシュ化済み）を永続化
10. ユーザーエンティティの `mfaEnabled` を `true` に設定
11. クライアントにバックアップコードを返却（一度だけ表示可能）

### 2. ログイン時のMFA認証フロー

1. ユーザーが通常のログイン（メール/パスワード）を実行
2. `LoginUseCase` が認証を検証
3. ユーザーがMFA有効な場合：
   - ログインを完了せず、中間状態（`mfaRequired: true`）を返す
   - 一時トークン（MFA検証用）を生成して返却
4. クライアントがMFA検証APIを呼び出し（TOTPコード + 一時トークン）
5. `VerifyMfaUseCase` がTOTPコードを検証
6. 検証成功後、通常のJWTトークンを生成して返却

### 3. バックアップコード使用フロー

1. ユーザーがTOTPコードを入力できない場合、バックアップコードを使用
2. `VerifyMfaUseCase` がバックアップコードを検証（ハッシュ比較）
3. 検証成功後、使用したバックアップコードを無効化
4. 通常のJWTトークンを生成して返却

## セキュリティ考慮事項

- **シークレットの保護**: MFAシークレットは暗号化して保存（本番環境ではDBに保存、開発環境ではRedisでも可）
- **バックアップコードのハッシュ化**: バックアップコードはbcryptでハッシュ化して保存
- **一時トークンの有効期限**: MFA検証用の一時トークンは短い有効期限（例: 5分）を設定
- **レート制限**: MFA検証の試行回数に制限を設ける（ブルートフォース攻撃対策）
- **QRコードの一時性**: セットアップ時のQRコードは一度だけ表示し、検証後は無効化
- **バックアップコードの再生成**: ユーザーがバックアップコードを再生成できる機能を提供（既存コードは無効化）
- **バックアップコードの提供タイミング**: セットアップ検証成功後にのみバックアップコードを生成・返却（セキュリティ向上）
- **責務分離**: Domain層（Value Objects）とInfrastructure層（Services）の責務を明確に分離

## 実装詳細

### TOTP仕様

- **アルゴリズム**: HMAC-SHA1（RFC 6238準拠）
- **時間ステップ**: 30秒
- **桁数**: 6桁
- **許容時間ウィンドウ**: ±1ステップ（30秒前後を許容）

### QRコード形式

OTPAUTH URI形式を使用：

```
otpauth://totp/MrWebDefence:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MrWebDefence
```

### バックアップコード仕様

- **形式**: 8桁の英数字（例: `ABCD-1234`）
- **生成数**: 10個
- **有効期限**: 無期限（使用されるまで有効）
- **使用後**: 即座に無効化

## 移行計画

### 既存ユーザーへの影響

- 既存ユーザーはMFAが無効な状態で開始
- ユーザーは任意のタイミングでMFAを有効化可能
- MFA有効化は必須ではない（オプション機能）

### データベーススキーマ変更

- `users` テーブルに `mfa_enabled` (boolean) カラムを追加
- `users` テーブルに `mfa_secret` (encrypted string) カラムを追加
- `backup_codes` テーブルを新規作成（`user_id`, `code_hash`, `used_at`, `created_at`）

## テスト戦略

### ユニットテスト

- `TotpService`: TOTPコード生成・検証のテスト
- `QrCodeService`: QRコード生成のテスト
- `BackupCodeService`: バックアップコード生成・検証のテスト
- `SetupMfaUseCase`, `VerifyMfaUseCase`, `DisableMfaUseCase`: 各ユースケースのテスト

### E2Eテスト

- MFAセットアップフロー全体のテスト
- ログイン時のMFA認証フローのテスト
- バックアップコード使用フローのテスト
- MFA無効化フローのテスト

## 参照資料

- Issue: [MWD-30](https://kencom2400.atlassian.net/browse/MWD-30)
- RFC 6238: TOTP: Time-Based One-Time Password Algorithm
- OTPAUTH URI Scheme: https://github.com/google/google-authenticator/wiki/Key-Uri-Format

