## 4. テスト実装ガイドライン

**優先度レベル**: `03-XX` - **一般（MAY）** - 推奨されるルール

### 🚫 テストでの絶対禁止事項

#### 4-1. any型の安易な使用禁止

```typescript
// ❌ 悪い例
const mockData: any = { id: 1 };
const result: any = await service.execute();
```

**✅ 良い例**:

```typescript
// ✅ テストでも適切な型定義を使用
const mockData: CreditCardEntity = {
  id: "1",
  issuer: "Test Card",
  // ... 必要なプロパティを全て定義
};

// モックオブジェクトでのみany型を許容（理由コメント必須）
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
} as any; // Jest型定義の制約によりany使用
```

#### 4-2. テストエラー・警告の握りつぶし禁止

```typescript
// ❌ 絶対に禁止
it.skip("should process payment", () => {
  // 理由なしのskipは禁止
});

// エラーを握りつぶす
try {
  await service.execute();
} catch (error) {
  // 何もしない  // ❌
}
```

**✅ 正しい対応**:

```typescript
// ✅ 一時的にスキップする場合は理由とTODOを明記
// TODO: #456 - APIモックの修正後にこのテストを有効化
it.skip("should process payment", () => {
  // ...
});

// エラーは適切にテスト
it("should throw error when invalid data", async () => {
  await expect(service.execute(invalidData)).rejects.toThrow("Invalid data");
});
```

#### 4-3. Jest forceExitの使用禁止

**❌ 禁止**:

```typescript
// jest.config.json
{
  "forceExit": true  // ❌ 根本的な問題を隠すため禁止
}
```

**問題点**:

- `forceExit: true`はJestが終了しない根本的な原因（リソースリークなど）を隠してしまう
- Jest公式ドキュメントでもこのオプションの使用は非推奨
- デバッグが困難になり、将来的な問題の原因となる

**✅ 正しい対応**:

1. **根本原因を特定する**

```bash
# --detectOpenHandlesで原因を調査
pnpm test:e2e --detectOpenHandles
```

2. **一般的な原因と対処法**

```typescript
// ✅ ScheduleModuleなどのリソースを適切にクリーンアップ

// テストセットアップ（test-setup.ts）
export async function createTestApp(
  moduleBuilder: TestingModuleBuilder,
  options: TestAppOptions = {},
): Promise<INestApplication> {
  const moduleFixture = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // シャットダウンフックを有効化
  // ScheduleModuleなどのリソースを適切にクリーンアップ
  app.enableShutdownHooks();

  await app.init();
  return app;
}

// テストのafterAll
afterAll(async () => {
  // app.close()がすべてのリソースをクリーンアップ
  await app.close();
});
```

3. **よくある原因**
   - **ScheduleModule**: cronジョブやタイマーがアクティブなまま
   - **データベース接続**: コネクションプールが閉じられていない
   - **EventEmitter**: リスナーが登録されたまま
   - **タイマー**: setTimeoutやsetIntervalが残っている

**参考**:

- Jest公式: <https://jestjs.io/docs/configuration#forceexit-boolean>
- PR #251 Gemini Code Assistレビュー指摘

#### 新機能実装時

1. **ユニットテストコードを作成する**
   - ドメインロジック、UseCase、コントローラーなど、各レイヤーのユニットテストを作成
2. **E2Eテストコードを作成する（該当する場合）**
   - 新規APIエンドポイント: Backend E2Eテスト
   - 新規UI機能: Frontend E2Eテスト
3. **必ずテストを実行する（コンテナ使用）**
   - ユニットテスト: `./scripts/backend/test.sh unit`（コンテナ使用）
   - E2Eテスト: `./scripts/backend/test.sh e2e`（コンテナ使用）
4. **全てのテストが成功するまで修正する**

#### テスト実行コマンド（コンテナ使用が必須）

```bash
# ユニットテスト（コンテナ使用）
./scripts/backend/test.sh unit

# E2Eテスト（コンテナ使用）
./scripts/backend/test.sh e2e

# すべてのテスト（ユニット + E2E）
./scripts/backend/test.sh all
```

**⚠️ 重要: テスト実行は必ずコンテナを使用したスクリプトで実行すること**
- ❌ ローカルで直接実行: `pnpm test`, `pnpm test:e2e` など（禁止）
- ✅ コンテナを使用: `./scripts/backend/test.sh unit`, `./scripts/backend/test.sh e2e`（必須）

### テストの構造（AAA パターン）

```typescript
describe("CreditCardEntity", () => {
  describe("constructor", () => {
    it("should create a valid credit card entity", () => {
      // Arrange - 準備
      const cardData = {
        id: "cc_123",
        cardName: "テストカード",
      };

      // Act - 実行
      const creditCard = new CreditCardEntity(/* ... */);

      // Assert - 検証
      expect(creditCard.id).toBe("cc_123");
      expect(creditCard.cardName).toBe("テストカード");
    });
  });
});
```

### モックとスパイのクリーンアップ（必須パターン）

**Issue #248 / PR #273で確立されたベストプラクティス**

#### ✅ 推奨パターン（統一すべきアプローチ）

```typescript
describe("MyService", () => {
  let service: MyService;
  // 1. describeスコープでspy変数を宣言
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    // 2. beforeEachでspyインスタンスを代入
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // テストモジュールのセットアップ
    const module = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  afterEach(() => {
    // 3. jest.clearAllMocks()でモックの呼び出し履歴をクリア
    jest.clearAllMocks();
    // 4. 個別にmockRestore()でspyを復元
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should handle errors gracefully", async () => {
    // テストロジック
  });
});
```

#### 🎯 重要な改善点（Geminiレビュー指摘）

##### 1. `jest.clearAllMocks()`の配置

**✅ 推奨**: `afterEach`に配置してクリーンアップ処理をまとめる

```typescript
// ✅ 良い例: クリーンアップがまとまっている
beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks(); // モックの呼び出し履歴をクリア
  consoleErrorSpy.mockRestore(); // spyを復元
});

// ❌ 避けるべき: beforeEachにclearAllMocksがある
beforeEach(() => {
  jest.clearAllMocks(); // ここにあると、セットアップとクリーンアップが分散
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});
```

**理由:**

- クリーンアップ処理が一箇所にまとまり可読性向上
- テストライフサイクルの意図が明確
- 今回確立したベストプラクティスとの一貫性

##### 2. mockImplementationで複数引数を受け取る

**✅ 推奨**: `...args`を使って全引数を受け取る

```typescript
// ✅ 良い例: 全引数を受け取り、すべてをリダイレクト
consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((...args) => {
  if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) {
    return; // 特定のエラーのみ抑制
  }
  console.warn(...args); // すべての引数を渡す
});

// ❌ 避けるべき: 第一引数のみを受け取る
consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message) => {
  if (typeof message === "string" && message.includes("not wrapped in act")) {
    return;
  }
  console.warn(message); // 第一引数しか渡されない
});
```

**理由:**

- `console.error`は複数の引数を取ることがある
- すべての引数を保持しないと情報が欠落する
- より堅牢なエラーハンドリング

#### ❌ 避けるべきパターン

```typescript
// ❌ パターン1: jest.restoreAllMocks()の使用
afterEach(() => {
  jest.restoreAllMocks(); // 影響範囲が広く、意図しない副作用の可能性
});

// ❌ パターン2: spy変数を保存しない
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  // 変数に保存していないため、個別にrestoreできない
});

// ❌ パターン3: clearAllMocks()の欠如
afterEach(() => {
  consoleErrorSpy.mockRestore();
  // jest.clearAllMocks()がないため、テスト間でモックの呼び出し履歴が残る
});
```

#### 📝 このパターンを使う理由

1. **一貫性**: テストスイート全体で同じパターンを使用
   - コードレビューが容易
   - メンテナンス性向上

2. **安全性**: 個別リストアで意図しない副作用を防止
   - `jest.restoreAllMocks()`は影響範囲が広く、他のテストに影響する可能性
   - 明示的なspy変数宣言で、何がモック化されているか明確

3. **保守性**: spy変数の明示的な宣言で可読性向上
   - どのオブジェクトがモック化されているか一目でわかる
   - IDEの補完が効く

4. **テスト分離**: `jest.clearAllMocks()`でテスト間の影響を排除
   - モックの呼び出し履歴がテスト間で干渉しない
   - `toHaveBeenCalledTimes()`などのアサーションが正確に動作

#### 🎯 適用ケース

- **コンソール出力の抑制**: 意図的なエラーテストでの出力抑制
- **外部サービスのモック**: API呼び出し、データベースアクセスなど
- **日付・時刻のモック**: `Date.now()`、`new Date()`など
- **ランダム値のモック**: `Math.random()`など

### 4-7. E2Eテストのベストプラクティス

#### ✅ テストデータのクリーンアップ

```typescript
// ✅ 良い例: テスト後にデータをクリーンアップ
describe("Transaction API (e2e)", () => {
  let app: INestApplication;

  afterEach(async () => {
    // 各テストで作成したデータをクリーンアップ
    await connection.manager.query("DELETE FROM transactions;");
    await connection.manager.query("DELETE FROM categories;");
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });
});
```

**重要なポイント**:

- **テスト間の独立性を保つ**: 前のテストのデータが次のテストに影響しない
- **`afterEach`でクリーンアップ**: 各テスト後にデータを削除
- **`afterAll`でリソース解放**: データベース接続やアプリケーションをクローズ

#### ❌ 避けるべきパターン: `waitForTimeout`の使用

```typescript
// ❌ 悪い例: 固定時間待機
await select.selectOption(newOption);
await page.waitForTimeout(1000); // 不安定・遅い
const updatedCategory = await page.locator("...").textContent();
```

**問題**:

- テストが不安定になる（環境によって必要な時間が異なる）
- 不必要に遅くなる（実際には500msで完了するのに1000ms待つ）
- Playwrightの自動待機機能を活用していない

```typescript
// ✅ 良い例: UI状態の確認で待機
await select.selectOption(newOption);
// カテゴリが変更されたことを確認（元のカテゴリ名とは異なる）
await expect(
  page.locator("tbody tr:first-child button").first(),
).not.toHaveText(originalCategory || "");
```

**原則**:

- **UI状態の確認で待機**: `expect(...).toBeVisible()`、`expect(...).toHaveText()`、`expect(...).not.toBeEmpty()`など
- **自動待機機能を活用**: `not.toBeVisible()`などは自動的に待機するため、その前の`waitForTimeout`は不要
- **固定時間待機は最終手段**: どうしても必要な場合のみ使用

#### ❌ 避けるべきパターン: `waitForFunction`のcatchブロックで潜在的な問題を隠蔽

```typescript
// ❌ 悪い例: catchブロックでエラーを握りつぶす
await page
  .waitForFunction(
    (input) => {
      const element = input as HTMLInputElement;
      return element.value.length > 0;
    },
    await nameInput.elementHandle(),
    { timeout: 10000 },
  )
  .catch(async () => {
    // タイムアウトした場合は、少し待ってから再確認
    await page.waitForTimeout(1000); // 潜在的な問題を隠蔽
  });
```

**問題**:

- `waitForFunction`がタイムアウトするのはテストが期待通りに動作していない兆候
- 潜在的な問題を隠蔽してしまう

```typescript
// ✅ 良い例: より堅牢なアサーションを使用
await expect(nameInput).not.toBeEmpty({ timeout: 10000 }); // より堅牢な待機方法
```

**原則**:

- **潜在的な問題を隠蔽しない**: `waitForFunction`のcatchブロックでエラーを握りつぶさない
- **より堅牢なアサーションを使用**: `expect(...).not.toBeEmpty()`など、Playwrightの自動待機機能を活用

#### ✅ E2Eテストでのデータベース状態の検証

**問題**: APIレスポンスの検証のみでは、副作用（データベースへの変更）が正しく実行されたか確認できない。

```typescript
// ❌ 不十分な例: APIレスポンスのみを検証
it("取引のカテゴリを更新できる", async () => {
  const response = await request(app.getHttpServer())
    .patch(`/transactions/${id}/category`)
    .send({ category: newCategory })
    .expect(200);

  expect(response.body.data.category.id).toBe("cat-002");
  // データベースに履歴が記録されているかは未検証
});
```

**✅ 推奨パターン**: APIレスポンスとデータベース状態の両方を検証

```typescript
// ✅ 良い例: データベース状態も検証
it("取引のカテゴリを更新できる", async () => {
  const response = await request(app.getHttpServer())
    .patch(`/transactions/${id}/category`)
    .send({ category: newCategory })
    .expect(200);

  // 1. APIレスポンスの検証
  expect(response.body.data.category.id).toBe("cat-002");

  // 2. データベース状態の検証
  const history = await dataSource.query(
    "SELECT * FROM transaction_category_change_history WHERE transactionId = ?",
    [id],
  );
  expect(history).toHaveLength(1);
  expect(history[0].oldCategoryId).toBe("cat-001");
  expect(history[0].newCategoryId).toBe("cat-002");
});
```

**重要なポイント**:

- **副作用の検証**: 重要な副作用（履歴記録、通知送信など）は必ずデータベースで確認
- **E2Eテストの価値最大化**: エンドツーエンドでの動作を完全に検証
- **dbHelperの活用**: `E2ETestDatabaseHelper`やDataSourceを使用してデータベースにアクセス

### 4-8. テストでのアサーション追加

#### ✅ 重要な副作用を検証する

```typescript
// ✅ 良い例: 変更履歴が作成されることを検証
it("取引のカテゴリを正しく更新できる", async () => {
  const result = await useCase.execute({
    transactionId,
    category: newCategory,
  });

  expect(mockRepository.findById).toHaveBeenCalledWith(transactionId);
  expect(mockHistoryRepository.create).toHaveBeenCalled(); // 履歴作成を検証
  expect(mockRepository.update).toHaveBeenCalled();
  expect(result.category).toEqual(newCategory);
});
```

**重要なポイント**:

- **重要な副作用は必ず検証**: 変更履歴の記録、通知の送信など
- **モックの呼び出しを確認**: `toHaveBeenCalled()`, `toHaveBeenCalledWith()`
- **ビジネスロジックを網羅**: 正常系だけでなく、重要な処理も確認

#### 参考

- Issue #248: テスト実行時のエラー出力抑制
- PR #273: Geminiレビュー対応
- Gemini指摘: モッククリーンアップの統一

### 4-9. テストでの例外検証のベストプラクティス

#### ✅ 効率的な例外アサーション

Jestの`toThrow`マッチャーは、例外のインスタンスを渡すことで、型とメッセージの両方を一度に検証できます。

❌ **悪い例**: 冗長な二重アサーション

```typescript
// ❌ useCase.executeが2回呼び出される（非効率）
await expect(useCase.execute({ creditCardId })).rejects.toThrow(
  NotFoundException,
);
await expect(useCase.execute({ creditCardId })).rejects.toThrow(
  `Credit card not found with ID: ${creditCardId}`,
);
```

**問題点**:

- `useCase.execute`が2回実行される（非効率、副作用の可能性）
- 型チェックとメッセージチェックが分離している
- テストの意図が不明確

✅ **良い例**: 例外インスタンスで一度に検証

```typescript
// ✅ 一度の呼び出しで型とメッセージの両方を検証
await expect(useCase.execute({ creditCardId })).rejects.toThrow(
  new NotFoundException(`Credit card not found with ID: ${creditCardId}`),
);
```

**改善点**:

- **効率的**: 1回の実行で完全な検証
- **簡潔**: コードが読みやすい
- **明確**: テストの意図が一目瞭然
- **型安全**: 例外の型とメッセージを同時に検証

#### ✅ 適用例

```typescript
// AccountService
it("should throw NotFoundException when account does not exist", async () => {
  mockRepository.findById.mockResolvedValue(null);

  await expect(service.getAccount(accountId)).rejects.toThrow(
    new NotFoundException(`Account not found: ${accountId}`),
  );
});

// UserService
it("should throw BadRequestException for invalid email", async () => {
  const invalidEmail = "invalid-email";

  await expect(service.createUser({ email: invalidEmail })).rejects.toThrow(
    new BadRequestException(`Invalid email format: ${invalidEmail}`),
  );
});
```

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **学習元**: fetch-credit-card-transactions.use-case.spec.ts, fetch-security-transactions.use-case.spec.ts

---

### 4-10. エラーハンドリングでのステータス保護

#### 🔴 クリティカル: 特定のエラーによるステータス上書き防止

非同期処理でキャンセルやタイムアウトなどの特定のエラーが発生した場合、外側のcatchブロックで意図しないステータスに上書きされる問題に注意が必要です。

❌ **悪い例**: キャンセルエラーがFAILEDに上書きされる

```typescript
try {
  // RUNNING状態に更新
  syncHistory = syncHistory.markAsRunning();
  await this.syncHistoryRepository.update(syncHistory);

  try {
    // 同期処理（キャンセル可能）
    await this.fetchTransactions(abortSignal);
  } catch (error) {
    // ここでエラーをログに出力して再スロー
    this.logger.error("取引取得エラー", error);
    throw error;
  }

  // COMPLETED状態に更新
  syncHistory = syncHistory.markAsCompleted();
  await this.syncHistoryRepository.update(syncHistory);
} catch (error) {
  // ❌ キャンセルエラーもFAILEDに上書きされてしまう
  syncHistory = syncHistory.markAsFailed(error.message);
  await this.syncHistoryRepository.update(syncHistory);
}
```

**問題点**:

- キャンセルエラーが発生すると、CANCELLEDではなくFAILEDステータスに上書きされる
- ユーザーの意図的なキャンセル操作が「失敗」として記録される
- ステータスの整合性が失われる

✅ **良い例**: キャンセルエラーを判定して早期return

```typescript
try {
  // RUNNING状態に更新
  syncHistory = syncHistory.markAsRunning();
  await this.syncHistoryRepository.update(syncHistory);

  try {
    // 同期処理（キャンセル可能）
    await this.fetchTransactions(abortSignal);
  } catch (error) {
    // ✅ キャンセルエラーの場合は、CANCELLEDステータスを設定して早期return
    if (
      error instanceof Error &&
      error.message === "Transaction fetch was cancelled"
    ) {
      this.logger.log("同期キャンセル");
      syncHistory = syncHistory.markAsCancelled();
      await this.syncHistoryRepository.update(syncHistory);

      return {
        success: false,
        status: syncHistory.status, // CANCELLEDステータスを保持
        errorMessage: "Sync cancelled",
      };
    }

    // その他のエラーは再スロー
    this.logger.error("取引取得エラー", error);
    throw error;
  }

  // COMPLETED状態に更新
  syncHistory = syncHistory.markAsCompleted();
  await this.syncHistoryRepository.update(syncHistory);
} catch (error) {
  // ✅ ここに到達するのは予期しないエラーのみ
  syncHistory = syncHistory.markAsFailed(error.message);
  await this.syncHistoryRepository.update(syncHistory);
}
```

**改善点**:

- **キャンセルエラーを明示的に判定**: 特定のエラーメッセージで判別
- **適切なステータス設定**: CANCELLEDステータスを保持
- **早期return**: 外側のcatchブロックに到達しない
- **意図の明確化**: コメントで処理の意図を明示

#### ✅ 適用すべきシナリオ

1. **AbortController によるキャンセル処理**
   - ユーザーの明示的なキャンセル操作
   - タイムアウトによる自動キャンセル

2. **ステータス遷移が重要な処理**
   - ワークフロー管理（PENDING → RUNNING → COMPLETED/FAILED/CANCELLED）
   - ジョブステータス管理

3. **複数のエラー状態を持つ処理**
   - バッチ処理（成功/失敗/スキップ/キャンセル）
   - トランザクション処理

#### ✅ 実装パターン

```typescript
// パターン1: 特定のエラークラスで判定
if (error instanceof CancellationError) {
  // キャンセル処理
  return handleCancellation();
}

// パターン2: エラーメッセージで判定
if (error instanceof Error && error.message.includes("cancelled")) {
  // キャンセル処理
  return handleCancellation();
}

// パターン3: カスタムプロパティで判定
if (error instanceof Error && "isCancelled" in error && error.isCancelled) {
  // キャンセル処理
  return handleCancellation();
}
```

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **修正箇所**: sync-all-transactions.use-case.ts
- **学習元**: 同期キャンセル処理のAbortController導入

---

### 4-11. カスタムエラークラスによる型安全なエラーハンドリング

#### 🔴 推奨: エラーメッセージの文字列依存を排除

エラーメッセージの文字列に依存してエラー判定を行うと、メッセージ変更時にロジックが壊れる脆弱な実装となります。

❌ **悪い例**: エラーメッセージの文字列依存（脆弱）

```typescript
// ❌ エラーメッセージの文字列に依存
try {
  await fetchData();
} catch (error) {
  if (
    error instanceof Error &&
    error.message === "Transaction fetch was cancelled"
  ) {
    // キャンセル処理
  }
}
```

**問題点**:

- エラーメッセージが変更されるとロジックが壊れる
- 文字列の完全一致が必要で脆弱
- 意図が不明確（どのような種類のエラーなのか）

✅ **良い例**: カスタムエラークラスで型安全に判定

```typescript
// ✅ カスタムエラークラスを定義
export class CancellationError extends Error {
  constructor(message: string = "Operation was cancelled") {
    super(message);
    this.name = "CancellationError";
    Error.captureStackTrace?.(this, CancellationError);
  }
}

// エラーのスロー
if (abortSignal?.aborted) {
  throw new CancellationError("Transaction fetch was cancelled");
}

// エラーの判定（型安全）
try {
  await fetchData();
} catch (error) {
  if (error instanceof CancellationError) {
    // キャンセル処理
    return handleCancellation();
  }
  // その他のエラー処理
  throw error;
}
```

**改善点**:

- **型安全**: `instanceof` で型チェック
- **保守性**: エラーメッセージ変更に強い
- **明確性**: エラーの種類が一目瞭然
- **拡張性**: カスタムプロパティを追加可能

#### ✅ カスタムエラークラスの設計パターン

```typescript
// 基本パターン
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = "ValidationError";
    Error.captureStackTrace?.(this, ValidationError);
  }
}

// 使用例
try {
  if (!email.includes("@")) {
    throw new ValidationError("Invalid email format", "email");
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(`Validation failed for field: ${error.field}`);
  }
}
```

#### ✅ 適用すべきシナリオ

1. **ユーザー操作によるキャンセル**
   - AbortControllerによる中断
   - タイムアウト

2. **ビジネスルール違反**
   - バリデーションエラー
   - 権限エラー

3. **リトライ可能なエラー**
   - ネットワークエラー
   - 一時的なサービス障害

#### ✅ 共通エラークラスの配置

```
src/
  common/
    errors/
      index.ts              # エクスポート
      cancellation.error.ts # キャンセルエラー
      validation.error.ts   # バリデーションエラー
      network.error.ts      # ネットワークエラー
```

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **実装**: src/common/errors/cancellation.error.ts
- **適用箇所**: fetch-credit-card-transactions.use-case.ts, fetch-security-transactions.use-case.ts, sync-all-transactions.use-case.ts

---

### 4-12. NestJS Controllerでの適切なHTTPステータスコードの使用

#### 🔴 重要: エラーの原因に応じた適切なステータスコードを返す

Issue #296 / PR #312のGeminiレビューから学習した、エラーハンドリングにおける重要な原則です。

**原則**: エラーの原因に応じて適切なHTTPステータスコードを返すこと

- **クライアント起因のエラー**: 4xx系（Bad Request, Not Found, etc.）
- **サーバー内部のエラー**: 5xx系（Internal Server Error, Service Unavailable, etc.）

#### ❌ 避けるべきパターン: すべてのエラーを400で返す

```typescript
// ❌ 悪い例: 予期せぬエラーを400で返す
@Post('classify')
async classify(@Body() dto: ClassificationRequestDto): Promise<ClassificationResponseDto> {
  try {
    const result = await this.classifyUseCase.execute(dto);
    return { success: true, data: result };
  } catch (error) {
    this.logger.error('分類処理に失敗しました', error);

    if (error instanceof NotFoundException) {
      throw error;
    }

    // ❌ 問題: サーバー内部のエラーも400で返している
    throw new BadRequestException({
      success: false,
      error: {
        code: 'CLASSIFICATION_FAILED',
        message: '分類処理に失敗しました',
      },
    });
  }
}
```

**問題点**:

1. **APIの仕様と実装の不一致**:
   - APIドキュメント（Swagger）では500エラーを定義しているが、実際には400を返す
   - クライアント側のエラーハンドリングが混乱する

2. **エラーの原因が不明確**:
   - 400（Bad Request）は「クライアントのリクエストが不正」を意味する
   - サーバー内部のエラー（DB接続エラー、外部API障害等）は500を返すべき

3. **監視・運用の問題**:
   - 4xx系エラーはクライアント起因として扱われ、アラート対象外になる可能性
   - 実際にはサーバー側の障害なのに、適切な監視ができない

#### ✅ 正しいパターン: エラーの原因に応じたステータスコードを返す

```typescript
// ✅ 良い例: エラーの原因に応じて適切なステータスコードを返す
import {
  Controller,
  Post,
  Body,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Post('classify')
@ApiResponse({ status: 200, description: '分類成功' })
@ApiResponse({ status: 400, description: 'リクエストボディが不正' })
@ApiResponse({ status: 404, description: 'サブカテゴリが見つからない' })
@ApiResponse({ status: 500, description: '分類処理に失敗' }) // 👈 500の定義
async classify(@Body() dto: ClassificationRequestDto): Promise<ClassificationResponseDto> {
  try {
    const result = await this.classifyUseCase.execute(dto);
    return { success: true, data: result };
  } catch (error) {
    this.logger.error('分類処理に失敗しました', error);

    // クライアント起因のエラーはそのままスロー（4xx系）
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    // ✅ 正しい: 予期せぬエラーは500で返す
    throw new InternalServerErrorException({
      success: false,
      error: {
        code: 'CLASSIFICATION_FAILED',
        message: '分類処理に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
```

#### ✅ HTTPステータスコードの使い分け

| ステータスコード          | 例外クラス                     | 使用すべき状況                         | 例                                       |
| ------------------------- | ------------------------------ | -------------------------------------- | ---------------------------------------- |
| 400 Bad Request           | `BadRequestException`          | リクエストボディのバリデーションエラー | 必須項目が欠けている、形式が不正         |
| 404 Not Found             | `NotFoundException`            | リソースが存在しない                   | 指定されたIDのエンティティが見つからない |
| 409 Conflict              | `ConflictException`            | リソースの競合                         | 重複登録、楽観的ロック違反               |
| 500 Internal Server Error | `InternalServerErrorException` | サーバー内部のエラー                   | DB接続エラー、予期せぬ例外               |
| 502 Bad Gateway           | `BadGatewayException`          | 外部APIからの不正なレスポンス          | 外部API呼び出しの失敗                    |
| 503 Service Unavailable   | `ServiceUnavailableException`  | サービス一時停止                       | メンテナンス中、負荷超過                 |

#### ✅ エラーハンドリングのチェックリスト

1. **try-catch内での例外の種類を判定**

   ```typescript
   if (error instanceof NotFoundException) {
     throw error; // 4xx系はそのまま
   }
   ```

2. **予期せぬエラーは500で返す**

   ```typescript
   throw new InternalServerErrorException({...});
   ```

3. **@ApiResponse()でステータスコードを明示**

   ```typescript
   @ApiResponse({ status: 500, description: '分類処理に失敗' })
   ```

4. **ログ出力**

   ```typescript
   this.logger.error("エラーメッセージ", error);
   ```

**参考**: Issue #296 / PR #312 - Gemini指摘：エラーハンドリングでの適切なステータスコード使用

---

### 4-13. フロントエンドでのエラーメッセージの動的取得

#### 🟡 推奨: 固定文字列ではなく、APIからのエラーメッセージを表示する

フロントエンドでエラー通知を表示する際は、固定のエラーメッセージではなく、APIから返されたエラーメッセージを優先的に表示することで、ユーザーにより詳細で具体的なエラー情報を提供できます。

❌ **悪い例**: 固定文字列のエラーメッセージ

```typescript
try {
  await aggregationApi.aggregate({ cardId, startMonth, endMonth });
} catch (err) {
  console.error("Failed to aggregate:", err);
  // ❌ 固定文字列で、具体的なエラー原因が分からない
  showErrorToast("error", "集計の実行に失敗しました");
}
```

**問題点**:

- APIから返された具体的なエラー情報が失われる
- ユーザーがエラーの原因を把握できない
- デバッグが困難になる

✅ **良い例**: エラーメッセージを動的に取得

```typescript
try {
  await aggregationApi.aggregate({ cardId, startMonth, endMonth });
} catch (err) {
  console.error("Failed to aggregate:", err);
  // ✅ エラーメッセージがあればそれを表示、なければデフォルトメッセージ
  const errorMessage =
    err instanceof Error ? err.message : "集計の実行に失敗しました";
  showErrorToast("error", errorMessage);
}
```

**利点**:

- APIから返された具体的なエラー情報をユーザーに提供
- エラーの原因を把握しやすくなる
- デバッグが容易になる

#### ✅ 実装パターン

```typescript
// パターン1: Error型の判定
const errorMessage =
  error instanceof Error ? error.message : "デフォルトメッセージ";

// パターン2: エラーオブジェクトのプロパティ確認
const errorMessage = error?.message || "デフォルトメッセージ";

// パターン3: 型ガードを使用
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "予期せぬエラーが発生しました";
}
```

#### ✅ 適用箇所

- **トースト通知**: `showErrorToast()`を使用する箇所
- **エラーモーダル**: エラーダイアログを表示する箇所
- **フォームバリデーション**: バリデーションエラーの表示

#### 参考

- **PR #340**: Geminiレビュー指摘（Issue #337）
- **修正箇所**: AggregateButton.tsx, PaymentStatusCard.tsx
- **学習元**: エラーハンドリングの一貫性とユーザー体験の向上

---

### 4-14. エラーメッセージ抽出ロジックの共通化

#### 🟡 推奨: 重複するエラーメッセージ抽出ロジックを共通ユーティリティ関数に抽出

複数のコンポーネントで同じエラーメッセージ抽出ロジックが重複している場合、共通のユーティリティ関数に抽出することで、コードの保守性を向上させることができます。

❌ **悪い例**: 複数箇所で同じロジックが重複

```typescript
// AggregateButton.tsx
try {
  await aggregationApi.aggregate({ cardId, startMonth, endMonth });
} catch (err) {
  const errorMessage =
    err instanceof Error ? err.message : "集計の実行に失敗しました";
  showErrorToast("error", errorMessage);
}

// PaymentStatusCard.tsx
try {
  await paymentStatusApi.updateStatus(cardSummaryId, { newStatus, notes });
} catch (error) {
  const errorMessage =
    error instanceof Error ? error.message : "ステータスの更新に失敗しました";
  showErrorToast("error", errorMessage);
}
```

**問題点**:

- 同じロジックが複数箇所に存在し、保守性が低下
- ロジックを変更する際に複数箇所を修正する必要がある
- コードの重複が増える

✅ **良い例**: 共通ユーティリティ関数に抽出

```typescript
// utils/error.utils.ts
export function getErrorMessage(
  error: unknown,
  defaultMessage: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}

// AggregateButton.tsx
import { getErrorMessage } from "@/utils/error.utils";

try {
  await aggregationApi.aggregate({ cardId, startMonth, endMonth });
} catch (err) {
  const errorMessage = getErrorMessage(err, "集計の実行に失敗しました");
  showErrorToast("error", errorMessage);
}

// PaymentStatusCard.tsx
import { getErrorMessage } from "@/utils/error.utils";

try {
  await paymentStatusApi.updateStatus(cardSummaryId, { newStatus, notes });
} catch (error) {
  const errorMessage = getErrorMessage(error, "ステータスの更新に失敗しました");
  showErrorToast("error", errorMessage);
}
```

**利点**:

- ロジックが一箇所に集約され、保守性が向上
- ロジックを変更する際に1箇所の修正で済む
- コードの重複が削減される
- テストが容易になる

#### ✅ 実装パターン

```typescript
// パターン1: シンプルなエラーメッセージ抽出
export function getErrorMessage(
  error: unknown,
  defaultMessage: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}

// パターン2: より詳細な型判定
export function getErrorMessage(
  error: unknown,
  defaultMessage: string,
): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return defaultMessage;
}
```

#### ✅ 適用箇所

- **エラーメッセージ抽出**: 複数のコンポーネントで同じロジックが使用されている場合
- **エラーハンドリング**: エラーオブジェクトから情報を抽出する処理
- **バリデーション**: バリデーションエラーメッセージの取得

#### 参考

- **PR #340**: Geminiレビュー指摘（Issue #337）
- **新規作成**: `apps/frontend/src/utils/error.utils.ts`
- **修正箇所**: AggregateButton.tsx, PaymentStatusCard.tsx
- **学習元**: コードの重複を避け、保守性を高める

---

### 4-15. エラーハンドリングでの複数エラー情報の保持

#### 🟡 推奨: 複数のエラーが発生した場合、すべてのエラー情報を含むエラーをスローする

エラーハンドリングで複数のエラーが発生する可能性がある場合（例: 作成失敗後に既存データ取得も失敗）、元のエラーをそのままスローするのではなく、すべてのエラー情報を含む新しいエラーをスローすることで、デバッグ時の原因特定を容易にします。

❌ **悪い例**: 元のエラーをそのままスロー

```typescript
try {
  institution = await createInstitution({ name: 'テスト銀行E2E', ... });
} catch (error) {
  try {
    const existingInstitutions = await getInstitutions();
    const existing = existingInstitutions.data.find((i) => i.name === 'テスト銀行E2E');
    if (existing) {
      institution = existing;
    } else {
      throw error; // ❌ 元のエラーのみ
    }
  } catch (fetchError) {
    throw error; // ❌ 元のエラーのみ、fetchErrorの情報が失われる
  }
}
```

**問題点**:

- `getInstitutions()`の失敗がテスト失敗の根本原因である可能性を隠蔽
- デバッグ時に混乱を招く
- エラーの原因特定が困難

✅ **良い例**: 両方のエラー情報を含む新しいエラーをスロー

```typescript
try {
  institution = await createInstitution({ name: 'テスト銀行E2E', ... });
} catch (error) {
  try {
    const existingInstitutions = await getInstitutions();
    const existing = existingInstitutions.data.find((i) => i.name === 'テスト銀行E2E');
    if (existing) {
      institution = existing;
    } else {
      throw error;
    }
  } catch (fetchError) {
    // ✅ 両方のエラー情報を含む新しいエラーをスロー
    console.error('  ❌ Failed to fetch existing institutions:', fetchError, 'Original error:', error);
    throw new Error(
      `Failed to fetch existing institutions after creation failed. Original: ${error instanceof Error ? error.message : String(error)}, Fetch: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
    );
  }
}
```

**利点**:

- すべてのエラー情報が保持される
- デバッグ時の原因特定が容易
- エラーメッセージが明確になる

#### ✅ 実装パターン

```typescript
// パターン1: エラーメッセージを結合
catch (fetchError) {
  const originalMessage = error instanceof Error ? error.message : String(error);
  const fetchMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
  throw new Error(`Failed to fetch after creation failed. Original: ${originalMessage}, Fetch: ${fetchMessage}`);
}

// パターン2: エラーオブジェクトに複数のエラーを保持
catch (fetchError) {
  const combinedError = new Error('Multiple errors occurred');
  (combinedError as any).originalError = error;
  (combinedError as any).fetchError = fetchError;
  throw combinedError;
}

// パターン3: ログに詳細を出力してから新しいエラーをスロー
catch (fetchError) {
  console.error('Original error:', error);
  console.error('Fetch error:', fetchError);
  throw new Error('Failed to fetch existing data after creation failed. See logs for details.');
}
```

#### ✅ 適用箇所

- **フォールバック処理**: 作成失敗後に既存データ取得を試みる場合
- **リトライ処理**: 複数回の試行が失敗した場合
- **エラーチェーン**: エラーが連鎖的に発生する場合

#### 参考

- **PR #340**: Geminiレビュー指摘（Issue #337）
- **修正箇所**: `apps/frontend/e2e/helpers/test-data.ts`
- **学習元**: テスト失敗時の原因特定を容易にする

---

### 4-16. エラー発生時にも状態更新を実行する

#### 🔴 重要: エラー発生時でもサーバー側の状態変更をUIに反映する

同期処理や更新処理が失敗した場合でも、サーバー側で状態が変更されている可能性があります（例: 金融機関の接続状態が「接続エラー」に変更される）。エラー発生時にも状態更新を実行することで、UIが最新の状態を反映し、ユーザーが正しい情報を即座に確認できるようになります。

❌ **悪い例**: エラー発生時に状態更新をスキップ

```typescript
const handleSync = async (): Promise<void> => {
  setIsSyncing(true);
  try {
    await startSync({
      institutionIds: [institution.id],
      forceFullSync: false,
    });
    // 同期完了後、一覧を更新
    onUpdate();
  } catch (error) {
    const errorMessage = getErrorMessage(error, "同期処理に失敗しました");
    showErrorToast("error", errorMessage);
    console.error("同期処理中にエラーが発生しました:", error);
    // ❌ エラー発生時に状態更新をスキップしている
    // サーバー側で金融機関のステータスが更新されている可能性がある
  } finally {
    setIsSyncing(false);
  }
};
```

**問題点**:

- サーバー側で金融機関のステータスが「接続エラー」などに変更されても、UIに反映されない
- ユーザーがエラー発生後に正しい接続状態を確認できない
- UIに表示される情報が不正確になる可能性がある

✅ **良い例**: エラー発生時にも状態更新を実行

```typescript
const handleSync = async (): Promise<void> => {
  setIsSyncing(true);
  try {
    await startSync({
      institutionIds: [institution.id],
      forceFullSync: false,
    });
    // 同期完了後、一覧を更新
    onUpdate();
  } catch (error) {
    const errorMessage = getErrorMessage(error, "同期処理に失敗しました");
    showErrorToast("error", errorMessage);
    console.error("同期処理中にエラーが発生しました:", error);
    // ✅ エラー発生時でも、サーバー側で状態が更新されている可能性があるため、
    // UIを最新の状態に更新する
    onUpdate();
  } finally {
    setIsSyncing(false);
  }
};
```

**利点**:

- サーバー側で状態が変更されても、UIに即座に反映される
- ユーザーがエラー発生後に正しい接続状態を確認できる
- UIに表示される情報が常に最新の状態になる

#### ✅ 実装パターン

```typescript
// パターン1: catchブロック内で状態更新
try {
  await someOperation();
  onUpdate();
} catch (error) {
  handleError(error);
  onUpdate(); // エラー発生時にも状態更新
}

// パターン2: finallyブロックで状態更新（エラー有無に関わらず）
try {
  await someOperation();
} catch (error) {
  handleError(error);
} finally {
  onUpdate(); // 常に状態更新
}
```

#### ✅ 適用箇所

- **同期処理**: 同期失敗時でも金融機関のステータスが更新される可能性がある
- **更新処理**: 更新失敗時でも一部の状態が変更される可能性がある
- **削除処理**: 削除失敗時でも関連データの状態が変更される可能性がある

#### 参考

- **PR #357**: Geminiレビュー指摘（Issue #352）
- **修正箇所**: `apps/frontend/src/components/institutions/InstitutionCard.tsx`
- **学習元**: エラー発生時でもUIの状態を最新に保つ重要性

---

### 4-17. 不要な依存関係の削除

#### 🟡 推奨: 使用していない依存関係は削除する

コンストラクタで注入されているが実際には使用されていない依存関係は、コードの複雑性を増し、メンテナンスコストを高めます。

❌ **悪い例**: 未使用の依存関係を保持

```typescript
@Injectable()
export class SyncAllTransactionsUseCase {
  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    // ❌ 以下は使用していないが注入されている
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly securitiesAccountRepository: ISecuritiesAccountRepository,
    // 実際に使用するのはこれら
    private readonly fetchCreditCardTransactionsUseCase: FetchCreditCardTransactionsUseCase,
    private readonly fetchSecurityTransactionsUseCase: FetchSecurityTransactionsUseCase,
  ) {}
}
```

**問題点**:

- 不要な依存関係がコードを複雑にする
- テスト時に不要なモックを作成する必要がある
- 意図が不明確（なぜ注入されているのか）

✅ **良い例**: 使用する依存関係のみを注入

```typescript
@Injectable()
export class SyncAllTransactionsUseCase {
  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    private readonly configService: ConfigService,
    // ✅ 実際に使用する依存関係のみ
    private readonly fetchCreditCardTransactionsUseCase: FetchCreditCardTransactionsUseCase,
    private readonly fetchSecurityTransactionsUseCase: FetchSecurityTransactionsUseCase,
  ) {}
}
```

**改善点**:

- **シンプル**: 必要な依存関係のみ
- **テスト容易性**: モック作成が簡単
- **明確性**: 意図が明確

#### ✅ 依存関係の見直しチェックリスト

1. **使用状況の確認**
   - `this.xxxRepository` で検索
   - 実際に使用されているか確認

2. **委譲の確認**
   - 子UseCaseに機能が委譲されていないか
   - 直接アクセスが必要か

3. **テストの簡素化**
   - 不要なモックを削除
   - テストが簡潔になるか

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **削除した依存関係**: ICreditCardRepository, ISecuritiesAccountRepository
- **理由**: FetchXxxUseCaseに機能を委譲済み

---

### 4-18. Enum値とリテラル型の一貫性

#### 🟡 推奨: Enum値と使用箇所の型を統一する

Enum値と実際の使用箇所で異なる文字列リテラルを使用すると、変換関数が必要になり、コードが複雑になります。

❌ **悪い例**: Enum値と使用箇所の不一致

```typescript
// libs/types/src/institution.types.ts
export enum InstitutionType {
  BANK = "bank",
  CREDIT_CARD = "credit_card", // ❌ アンダースコア
  SECURITIES = "securities",
}

// 実際の使用箇所
interface SyncTarget {
  institutionType: "bank" | "credit-card" | "securities"; // ❌ ハイフン
}

// ❌ 変換関数が必要になる
function convertInstitutionType(
  type: InstitutionType,
): "bank" | "credit-card" | "securities" {
  if (type === InstitutionType.CREDIT_CARD) {
    return "credit-card";
  }
  return type as "bank" | "credit-card" | "securities";
}
```

**問題点**:

- 変換関数が必要で複雑
- 型の不一致がバグの原因
- 保守性が低い

✅ **良い例**: Enum値と使用箇所を統一

```typescript
// libs/types/src/institution.types.ts
export enum InstitutionType {
  BANK = "bank",
  CREDIT_CARD = "credit-card", // ✅ ハイフンで統一
  SECURITIES = "securities",
}

// 実際の使用箇所
interface SyncTarget {
  institutionType: InstitutionType; // ✅ 直接使用可能
}

// ✅ 変換関数は不要
const target: SyncTarget = {
  institutionType: institution.type, // そのまま使用
};
```

**改善点**:

- **シンプル**: 変換関数が不要
- **型安全**: 型の一貫性が保たれる
- **保守性**: 変更箇所が1箇所のみ

#### ✅ 統一のガイドライン

1. **命名規則の統一**
   - ケバブケース（`credit-card`）
   - スネークケース（`credit_card`）
   - キャメルケース（`creditCard`）

2. **プロジェクト全体で統一**
   - API仕様書
   - データベーススキーマ
   - フロントエンド・バックエンド

3. **既存コードとの整合性**
   - 既存の命名規則に従う
   - 一括変更が可能な場合は統一

#### 参考

- **PR #285**: Geminiレビュー指摘（Issue #279）
- **変更内容**: `'credit_card'` → `'credit-card'`
- **削除**: convertInstitutionType() 変換関数

---
