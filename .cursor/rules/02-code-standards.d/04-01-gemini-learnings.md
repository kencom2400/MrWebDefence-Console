
### 13-8. 設定管理とテスト効率化（PR #34）

**学習元**: PR #34 - Task 3.2: セッション管理機能実装 (Redis導入)（Geminiレビュー指摘）

#### ConfigModuleの使用

**問題**: 環境変数を`process.env`から直接読み込むと、テスト時のモック化が難しく、設定の一元管理ができない。

**解決策**: NestJSの`ConfigModule`と`ConfigService`を使用する。

```typescript
// ✅ 良い例
constructor(private readonly configService: ConfigService) {
  const host = this.configService.get<string>('REDIS_HOST', 'localhost');
  // ...
}
```

**理由**:
- テスト容易性の向上（ConfigServiceをモックできる）
- 設定の一元管理と型安全性
- デフォルト値の管理が容易

#### マジックストリングの排除

**問題**: Redisのキープレフィックスなどがハードコードされており、変更時の保守性が低い。

**解決策**: クラス定数として定義する。

```typescript
// ✅ 良い例
private readonly KEY_PREFIX = 'blacklist:';

// 使用時
await this.redisClient.set(`${this.KEY_PREFIX}${token}`, ...);
```

**理由**:
- コードの可読性と保守性の向上
- 一貫性の維持

#### 型アサーションの活用（@ts-ignoreの回避）

**問題**: 型定義が不足している場合に`@ts-ignore`を使用すると、意図しない型エラーまで隠蔽してしまう。

**解決策**: 適切な型定義を行うか、交差型を使用した型アサーションを行う。

```typescript
// ✅ 良い例
(request as Request & { user: JwtPayload }).user = payload;
```

**理由**:
- 型安全性の維持
- コードの意図が明確になる

#### テスト実行の効率化

**問題**: `pnpm run test`（ユニットテスト）と`pnpm run test:cov`（カバレッジ付きユニットテスト）を両方実行しており、処理が重複していた。

**解決策**: CIや全テスト実行時は、カバレッジ付きテストのみを実行する。

**理由**:
- CI時間の短縮
- リソースの有効活用
