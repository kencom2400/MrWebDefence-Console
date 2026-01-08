
### 13-7. NestJSアプリケーションの品質向上（PR #34）

**学習元**: PR #34 - Task 3.2: セッション管理機能実装 (Redis導入)（Geminiレビュー指摘）

#### deprecatedな依存関係の削除

**問題**: `ioredis` v5以降は型定義が同梱されており、`@types/ioredis`は不要かつ非推奨であるにも関わらず、依存関係に含まれていた。

**解決策**: 不要な`@types/ioredis`を削除する。

**理由**:
- パッケージ管理の健全化
- 不要な警告の抑制

#### 起動時のクリティカルエラー処理

**問題**: アプリケーションの動作に必須なRedisへの接続に失敗しても、エラーログを出力するだけで起動を継続していた。

**解決策**: `onModuleInit`などの初期化処理で必須リソースへの接続に失敗した場合は、エラーを再スローしてアプリケーションの起動を停止させる。

```typescript
// ✅ 良い例
async onModuleInit() {
  try {
    await this.redisClient.connect();
  } catch (error) {
    this.logger.error('Failed to connect to Redis:', error);
    // 必須リソースへの接続失敗はクリティカルなため、起動を失敗させる
    throw error;
  }
}
```

**理由**:
- 不完全な状態でアプリケーションが稼働することを防ぐ
- 問題の早期発見と対処が可能になる

#### 統一されたロガーの使用

**問題**: `console.error`を使用してログ出力を行っていたため、ログのフォーマットやレベル管理が一貫していなかった。

**解決策**: NestJS標準の`Logger`クラスを使用する。

```typescript
// ✅ 良い例
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);

  someMethod() {
    this.logger.log('処理を開始します');
    try {
      // ...
    } catch (error) {
      this.logger.error('エラーが発生しました', error);
    }
  }
}
```

**理由**:
- ログ出力の統一感と可読性の向上
- ログレベルの制御が容易になる
- 構造化ログへの移行が容易

#### 型安全性の向上（Express Request）

**問題**: コントローラーやガードで`request`オブジェクトを`any`型として扱っており、型安全性が損なわれていた。

**解決策**: `express`から`Request`型をインポートし、必要に応じて拡張インターフェースを定義して使用する。

```typescript
// ✅ 良い例
import { Request } from 'express';

// ユーザー情報を含むリクエスト型の定義
interface RequestWithUser extends Request {
  user: UserPayload;
}

@Post('logout')
public async logout(@Req() req: RequestWithUser): Promise<void> {
  // req.user や req.headers が型安全に利用可能
}
```

**理由**:
- コードの安全性と信頼性の向上
- 開発時の補完機能の恩恵
- 予期せぬ実行時エラーの防止

---

## 13-18. Docker Compose環境構築のベストプラクティス（PR #32）

**学習元**: PR #32 - MWD-92: Local環境構築（Docker Compose）: MrWebDefence-Console（Gemini Code Assistレビュー指摘）

### 1. 本番環境Dockerイメージのセキュリティ

**問題**: 本番環境のDockerイメージがrootユーザーで実行される

**❌ 悪い例**: rootユーザーで実行

```dockerfile
FROM node:20.18.0-alpine AS production
# ...
WORKDIR /app
# ...
CMD ["pnpm", "run", "start:prod"]
```

**✅ 良い例**: 非rootユーザーで実行

```dockerfile
FROM node:20.18.0-alpine AS production
# ...
# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
# ...
# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

CMD ["pnpm", "run", "start:prod"]
```

**理由**:

- セキュリティリスクを軽減（コンテナ侵害時の影響範囲を限定）
- ベストプラクティスに準拠
- 本番環境での運用安全性が向上

### 2. Docker Compose設定の簡潔性

**問題**: docker-compose.ymlに冗長な設定がある

**❌ 悪い例**: 冗長な設定

```yaml
services:
  backend:
    build:
      target: development
    # ...
    working_dir: /app
    command: pnpm run start:dev
```

`working_dir`と`command`はDockerfileで既に定義されているため、docker-compose.ymlで重複定義する必要はない。

**✅ 良い例**: 必要最小限の設定

```yaml
services:
  backend:
    build:
      target: development
    # ...
    # working_dirとcommandはDockerfileで定義済みのため削除
```

**理由**:

- 設定の重複を排除
- メンテナンス性の向上
- Dockerfileを単一の真実の源（Single Source of Truth）として扱える

### 3. スクリプトの一貫性

**問題**: 複数のスクリプト間で一貫性がない

**✅ 良い例**: 一貫したパターン

すべてのスクリプトで以下を統一：

- `set -e`でエラー時に即座に停止
- ヘルプ表示機能（`-h`または`--help`）
- 引数解析の統一的なパターン
- エラーメッセージの統一的な形式
- 進捗表示の統一的な形式

**理由**:

- 開発者がスクリプトを理解しやすい
- メンテナンスが容易
- 新しいスクリプト作成時のテンプレートとして使用可能

### Docker Compose実装チェックリスト

- [ ] 本番環境のDockerイメージは非rootユーザーで実行する
- [ ] docker-compose.ymlの設定は必要最小限にする（Dockerfileで定義済みの設定は重複しない）
- [ ] スクリプト間で一貫性を保つ（エラーハンドリング、ヘルプ表示、引数解析など）
- [ ] セキュリティベストプラクティスに準拠する（非rootユーザー、最小権限の原則）
- [ ] 設定の重複を避け、Dockerfileを単一の真実の源として扱う

**参照**: PR #32 - MWD-92: Local環境構築（Docker Compose）: MrWebDefence-Console（Gemini Code Assistレビュー指摘）

---
