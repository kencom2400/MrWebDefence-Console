
### 13-10. ガードパイプラインと型の一貫性（PR #35）

**学習元**: PR #35 - Task 3.3: RBAC実装設計（Geminiレビュー指摘）

#### ガード実行パイプラインの明確化

**問題**: シーケンス図などで、認可ガード（`RolesGuard`）が認証ガード（`JwtAuthGuard`）を直接呼び出すように描くと、NestJSの実行モデル（パイプライン処理）と矛盾し、誤解を招く。

**解決策**:
1. **グローバルガードの順序定義**: `AppModule` に両方のガードを登録し、実行順序を明確にする（認証 → 認可）。
2. **依存関係の分離**: `RolesGuard` は `JwtAuthGuard` を呼び出すのではなく、前のパイプラインで処理された結果（`request.user`）を利用する設計にする。
3. **公開エンドポイントの扱い**: `JwtAuthGuard` 側で `@Public` を検知し、認証エラーをスローせずに通過させる（Optional Auth）。

```mermaid
sequenceDiagram
    participant Client
    participant JwtAuthGuard
    participant RolesGuard
    
    Client->>JwtAuthGuard: 1. Authentication
    alt Public
        JwtAuthGuard-->>RolesGuard: Pass
    else
        JwtAuthGuard->>JwtAuthGuard: Validate Token
        JwtAuthGuard-->>RolesGuard: User Attached
    end
    
    RolesGuard->>RolesGuard: 2. Authorization (Check Roles)
```

**理由**:
- フレームワークの仕組みに沿った正確な設計
- 各ガードの責務の明確化（認証と認可の分離）

#### クラス図における型表記

**問題**: クラス図などの設計書で `String` のような言語固有のクラス型とプリミティブ型 `string` が混在すると、実装時に混乱する。

**解決策**: TypeScript/JavaScriptのコンテキストでは、プリミティブ型には小文字の `string`, `number`, `boolean` を使用し、コードの実装と一致させる。

**理由**:
- 設計と実装の一貫性維持

### 13-11. 設定値のハードコーディング回避と命名規則（PR #36）

**学習元**: PR #36 - RBAC実装とRedisセッション管理（Geminiレビュー指摘）

#### 設定値の動的取得

**問題**: ユースケース層（`LoginUseCase`など）でトークンの有効期限などの設定値をハードコーディング（例: `const expiresIn = 1800;`）すると、環境変数や設定ファイルによる変更が反映されず、柔軟性が損なわれる。

**解決策**:
1. **サービス経由の取得**: 設定値を管理するサービス（`JwtService`など）にゲッターメソッドを追加し、そこから値を取得する。
2. **ConfigServiceの利用**: サービス自体も `ConfigService` を注入して環境変数から値を読み込むようにする。

```typescript
// Bad
const expiresIn = 1800;

// Good
const expiresIn = this.jwtService.getExpiresIn();
```

**理由**:
- 環境ごとの設定変更への対応
- 設定の一元管理

#### パラメータの命名規則

**問題**: メソッドの引数名に `pass` のような省略形を使用すると、可読性が低下し、意図が伝わりにくくなる。

**解決策**: `password` のように省略せずに記述する。

**理由**:
- コードの可読性と保守性の向上
- チーム開発における共通認識の維持

### 13-12. バックアップコードのライフサイクル管理と責務分離（PR #37）

**学習元**: PR #37 - MFA機能実装設計（Geminiレビュー指摘）

#### バックアップコードの提供タイミング

**問題**: MFAセットアップ時にバックアップコードを生成して返却すると、検証前にコードが漏洩するリスクがある。また、検証が完了しない場合に不要なコードが生成される。

**解決策**: バックアップコードは検証成功後にのみ生成・永続化し、その時点で一度だけ返却する。

```typescript
// Bad: セットアップ時にバックアップコードを生成
SetupMfaUseCase -> BackupCodeService.generateCodes()
SetupMfaUseCase -> return { qrCodeUrl, backupCodes, tempToken }

// Good: 検証成功後にバックアップコードを生成
VerifyMfaUseCase -> TotpService.verifyToken()
VerifyMfaUseCase -> BackupCodeService.generateCodes() // 検証成功後
VerifyMfaUseCase -> MfaRepository.saveBackupCodes()
VerifyMfaUseCase -> return { message, backupCodes }
```

**理由**:
- セキュリティ向上（検証前のコード漏洩防止）
- リソース効率（検証が完了しない場合の無駄な生成を防止）

#### バックアップコード管理APIの明確化

**問題**: バックアップコードの再生成機能が設計に含まれているが、API仕様が不明確。

**解決策**:
1. **バックアップコード一覧取得API**: 実際のコード値は返さず、使用済み/未使用の状態のみを返却する。
2. **バックアップコード再生成API**: パスワード確認を必須とし、既存コードを無効化してから新規コードを生成する。

**理由**:
- セキュリティ向上（コード値の再表示を防止）
- ユーザビリティ向上（状態確認と再生成の明確な分離）

#### ドメインモデルとインフラストラクチャ層の責務分離

**問題**: `BackupCodeService` がDomain層とInfrastructure層のどちらに属するか不明確。

**解決策**:
- **Domain層**: `BackupCode` Value Object（ビジネスロジック、バリデーション）
- **Infrastructure層**: `BackupCodeService`（技術的な詳細：生成アルゴリズム、ハッシュ化）

```typescript
// Domain Layer - Value Object (ビジネスロジックのみ)
class BackupCode {
  private constructor(private readonly code: string) {}
  static create(code: string): BackupCode { 
    // バリデーション: 形式チェック（例: /^[A-Z0-9]{4}-[A-Z0-9]{4}$/）
    if (!this.isValidFormat(code)) {
      throw new Error('Invalid backup code format');
    }
    return new BackupCode(code);
  }
  getValue(): string { return this.code; }
  equals(other: BackupCode): boolean { return this.code === other.code; }
  private static isValidFormat(code: string): boolean { /* validation logic */ }
}

// Infrastructure Layer - Service (技術的な詳細)
class BackupCodeService {
  // 技術的な実装: ランダム文字列生成アルゴリズム
  generateCodes(count: number): string[] { 
    // 外部ライブラリや技術的な詳細を含む
    return Array.from({ length: count }, () => this.generateRandomCode());
  }
  // 技術的な実装: bcryptハッシュ化
  hashCode(code: string): string { 
    return bcrypt.hashSync(code, 10);
  }
  // 技術的な実装: ハッシュ比較
  verifyCode(code: string, hash: string): boolean { 
    return bcrypt.compareSync(code, hash);
  }
}
```

**理由**:
- Onion Architectureの原則に従った明確な責務分離
- テスト容易性の向上（Domain層の独立性）
- 技術的な詳細の変更がDomain層に影響しない

#### ユースケースの役割の明確化

**問題**: 複数のユースケースが混在し、各ユースケースの責務が不明確になる。

**解決策**: 各ユースケースは単一の責務を持つように設計し、必要に応じて他のユースケースを呼び出す。

```typescript
// Bad: 1つのユースケースが複数の責務を持つ
class VerifyMfaUseCase {
  execute(userId, code, type) {
    // 検証処理
    // バックアップコード生成処理 ← 別の責務
    // 永続化処理
  }
}

// Good: 責務を分離
class VerifyMfaUseCase {
  constructor(
    private generateBackupCodesUseCase: GenerateBackupCodesUseCase
  ) {}
  
  execute(userId, code, type) {
    // 検証処理のみ
    if (this.verifyCode(code)) {
      // 必要に応じて他のユースケースを呼び出す
      if (type === 'SETUP') {
        return this.generateBackupCodesUseCase.execute(userId);
      }
    }
  }
}

class GenerateBackupCodesUseCase {
  execute(userId) {
    // バックアップコード生成・永続化のみ
  }
}
```

**理由**:
- 単一責任の原則（SRP）に従う
- テスト容易性の向上
- 再利用性の向上

### 13-13. TOTP仕様の明確化とデータベース設計の冗長性排除（PR #37）

**学習元**: PR #37 - MFA機能実装設計（Geminiレビュー指摘）

#### TOTPハッシュアルゴリズムの明確化

**問題**: TOTPのアルゴリズム仕様が簡潔すぎて、将来の拡張性や互換性について不明確。

**解決策**: RFC 6238の仕様を明確に記載し、デフォルトアルゴリズムと将来の拡張性について説明を追加する。

```markdown
### TOTP仕様

- **アルゴリズム**: HMAC-SHA1（RFC 6238準拠、デフォルト）
  - 注: RFC 6238ではHMAC-SHA256、HMAC-SHA512もサポートされているが、互換性のためHMAC-SHA1を使用
  - 将来的にアルゴリズムを変更する場合は、OTPAUTH URIの `algorithm` パラメータで指定可能
```

**理由**:
- 実装時の混乱を防止
- 将来の拡張性を考慮した設計の明確化

#### データベース設計の冗長性排除

**問題**: `backup_codes` テーブルに `used` (boolean) と `used_at` (timestamp) の両方があると、データの冗長性が発生し、整合性の問題が生じる可能性がある。

**解決策**: `used` フラグを削除し、`used_at` の有無で使用状態を判定する。

```sql
-- Bad: 冗長な設計
CREATE TABLE backup_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,  -- 冗長
  used_at TIMESTAMP NULL,               -- used_at があれば used = true
  created_at TIMESTAMP NOT NULL
);

-- Good: 冗長性を排除
CREATE TABLE backup_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  used_at TIMESTAMP NULL,  -- NULL = 未使用、値あり = 使用済み
  created_at TIMESTAMP NOT NULL
);
```

**理由**:
- データの整合性向上（単一の真実の源）
- ストレージの節約
- クエリの簡素化（`used_at IS NULL` で未使用を判定）

#### 設計書間の一貫性確保

**問題**: クラス図、シーケンス図、API仕様、データベーススキーマの間で不整合があると、実装時に混乱が生じる。

**解決策**: 
1. データベーススキーマ変更時は、関連する全ての設計書を同時に更新する
2. レビュー時に設計書間の整合性を確認する
3. 変更履歴を追跡しやすくするため、設計書を一括で更新する

**理由**:
- 実装時の混乱防止
- 設計の信頼性向上

### 13-14. セキュリティ強化とエラーハンドリングの改善（PR #38）

**学習元**: PR #38 - MFA E2Eテストの修正とバックアップコード検証ロジックの改善（Geminiレビュー指摘）

#### 暗号学的に安全な乱数生成

**問題**: バックアップコードのようなセキュリティ上重要な値の生成に `Math.random()` を使用すると、予測可能な値が生成されるリスクがある。

**解決策**: Node.jsの `crypto` モジュールの `randomInt()` を使用して、暗号学的に安全な乱数を生成する。

```typescript
// Bad: 予測可能な乱数生成
code += characters.charAt(Math.floor(Math.random() * characters.length));

// Good: 暗号学的に安全な乱数生成
import { randomInt } from 'crypto';
code += characters.charAt(randomInt(characters.length));
```

**理由**:
- セキュリティ強化（予測不可能な値の生成）
- 暗号学的に安全な乱数生成のベストプラクティスに準拠

#### タイミング攻撃対策

**問題**: バックアップコード検証時に、有効なコードが見つかるとすぐにループを終了すると、コードの位置によって応答時間が変わり、タイミング攻撃に対して脆弱になる。

**解決策**: `Promise.all` を使用して全ての未使用コードを並行して検証し、応答時間がコードの位置に依存しないようにする。

```typescript
// Bad: 順次検証でタイミング攻撃に脆弱
for (const record of allRecords) {
  if (record.usedAt !== null) continue;
  const isCodeValid = await this.backupCodeService.verify(code, record.codeHash);
  if (isCodeValid) {
    await this.mfaRepository.markBackupCodeAsUsed(userId, record.codeHash);
    break; // 早期終了でタイミング情報が漏洩
  }
}

// Good: 並行検証でタイミング攻撃を緩和
const verificationPromises = allRecords
  .filter((record) => record.usedAt === null)
  .map(async (record) => ({
    isMatch: await this.backupCodeService.verify(code, record.codeHash),
    hash: record.codeHash,
  }));

const verificationResults = await Promise.all(verificationPromises);
const validResult = verificationResults.find((result) => result.isMatch);
if (validResult) {
  await this.mfaRepository.markBackupCodeAsUsed(userId, validResult.hash);
}
```

**理由**:
- セキュリティ強化（タイミング攻撃の緩和）
- 応答時間の一貫性確保

#### NestJSの組み込み例外の使用

**問題**: 汎用的な `Error` クラスを使用すると、コントローラー層でエラーメッセージ文字列に依存した分岐が必要になり、コードの堅牢性と保守性が低下する。

**解決策**: NestJSの組み込み例外（`NotFoundException`, `ConflictException`, `UnauthorizedException`, `BadRequestException` など）を使用する。

```typescript
// Bad: 汎用的なErrorクラス
if (!user) {
  throw new Error('User not found');
}
if (user.mfaEnabled) {
  throw new Error('MFA is already enabled');
}

// Good: NestJSの組み込み例外
import { NotFoundException, ConflictException } from '@nestjs/common';
if (!user) {
  throw new NotFoundException('User not found');
}
if (user.mfaEnabled) {
  throw new ConflictException('MFA is already enabled');
}
```

**理由**:
- エラーハンドリングの一貫性向上
- HTTPステータスコードの自動設定
- コントローラー層でのエラーメッセージ文字列解析が不要

#### ユースケースの自己完結性

**問題**: ユースケースが `userId` を引数に取るが、そのユーザーが存在するかどうかの検証が行われていない場合、後続の処理で予期しないエラーが発生する可能性がある。

**解決策**: ユースケースは自己完結しているべきであり、入力の妥当性を検証する。`IUserRepository` を注入し、`execute` メソッドの冒頭でユーザーの存在確認を行う。

```typescript
// Bad: ユーザー存在確認なし
@Injectable()
export class GenerateBackupCodesUseCase {
  constructor(
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
  ) {}
  
  public async execute(userId: string): Promise<GenerateBackupCodesResult> {
    const codes = this.backupCodeService.generateCodes();
    // ユーザーが存在しない場合のエラーハンドリングがない
  }
}

// Good: ユーザー存在確認を追加
@Injectable()
export class GenerateBackupCodesUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IMfaRepository')
    private readonly mfaRepository: IMfaRepository,
  ) {}
  
  public async execute(userId: string): Promise<GenerateBackupCodesResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const codes = this.backupCodeService.generateCodes();
  }
}
```

**理由**:
- 早期エラー検出
- ユースケースの自己完結性向上
- デバッグの容易性向上

#### 依存性注入の一貫性

**問題**: モジュール内のプロバイダーで、依存性の注入方法に一貫性がない。一部のプロバイダーはクラス名で直接注入されているが、他の多くは文字列トークンを使用している。

**解決策**: クラスベースのDIに統一する。クラス名で直接提供されているプロバイダー（`TotpService`, `QrCodeService`, `BackupCodeService`, `GenerateBackupCodesUseCase` など）は、`@Inject()` デコレータを削除してクラス名で直接注入する。インターフェース（`IUserRepository`, `IMfaRepository` など）やファクトリで提供されるプロバイダー（`PasswordService`, `JwtService` など）は文字列トークンを使用する。

```typescript
// Bad: 文字列トークンとクラス名が混在
@Injectable()
export class SetupMfaUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('TotpService')  // クラス名で提供されているのに文字列トークンを使用
    private readonly totpService: TotpService,
    @Inject('QrCodeService')  // クラス名で提供されているのに文字列トークンを使用
    private readonly qrCodeService: QrCodeService,
  ) {}
}

// Good: クラスベースのDIに統一
@Injectable()
export class SetupMfaUseCase {
  constructor(
    @Inject('IUserRepository')  // インターフェースは文字列トークン
    private readonly userRepository: IUserRepository,
    private readonly totpService: TotpService,  // クラス名で直接注入
    private readonly qrCodeService: QrCodeService,  // クラス名で直接注入
  ) {}
}
```

**理由**:
- 型安全性の向上
- コードの簡潔性向上
- 文字列トークンの重複定義の解消
- 保守性の向上

#### 未使用コードの削除

**問題**: 未使用のメソッドやインポートが残っていると、混乱を招き、保守の負担となる。

**解決策**: 未使用のコードは削除する。特に、インターフェースで定義されていないメソッドや、どこからも使用されていないメソッドは削除する。

```typescript
// Bad: 未使用のメソッドが残っている
export class MfaRepository implements IMfaRepository {
  public async findBackupCodeByHash(
    userId: string,
    codeHash: string,
  ): Promise<BackupCodeRecord | null> {
    // このメソッドはインターフェースで定義されておらず、使用されていない
  }
}

// Good: 未使用のメソッドを削除
export class MfaRepository implements IMfaRepository {
  // findBackupCodeByHashメソッドを削除
}
```

**理由**:
- コードの可読性向上
- 保守の負担軽減
- 混乱の防止

#### 冗長なコメントの削除

**問題**: 実装が完了しているにもかかわらず、TODOコメントや冗長なコメントが残っていると、混乱を招く。

**解決策**: 実装が完了している場合は、TODOコメントや冗長なコメントを削除する。

```typescript
// Bad: 実装済みなのにTODOコメントが残っている
} else {
  // ログイン検証成功時は、バックアップコードを使用済みとしてマーク（バックアップコードの場合）
  if (type === MfaVerificationType.BACKUP_CODE) {
    // TODO: 使用したバックアップコードを特定してマーク
    // 現在の実装では、どのハッシュが使用されたかを特定できない
  }
  return { success: true };
}

// Good: 実装済みの場合はコメントを削除
} else {
  // ログイン検証成功時
  // バックアップコードの場合は、上記の検証処理で既に使用済みとしてマークされている
  return { success: true };
}
```

**理由**:
- コードの可読性向上
- 混乱の防止
- 保守の負担軽減
