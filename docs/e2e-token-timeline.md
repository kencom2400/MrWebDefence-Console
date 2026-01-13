# E2Eテストにおけるトークンの取得・参照タイムライン

## 現在の実装（`password.e2e-spec.ts`）

### 1. `beforeAll` フェーズ
```
時間軸: T0
├─ Redis接続
├─ Redis flushdb (ブラックリストクリア)
├─ アプリ初期化
└─ ログイン → accessToken取得
   └─ このトークンは `GET /api/v1/auth/password/policy` などで使用
```

### 2. `POST /api/v1/auth/password/change` の `beforeEach` フェーズ
```
時間軸: T1 (各テストの前)
├─ Redis flushdb (ブラックリストクリア)
├─ ユーザーのパスワードを password123 にリセット
└─ パスワード履歴をクリア
```

### 3. 各テスト内（例：`正常系: パスワード変更に成功する`）
```
時間軸: T2
├─ ログイン → testToken取得
│  └─ この時点でRedisはクリア済み（beforeEachでflushdb実行済み）
├─ testTokenを使用してパスワード変更リクエスト
│  └─ ❌ 401 Unauthorized: "Token is invalidated"
└─ 期待: 200 OK
```

## 問題点の分析

### 問題1: 401エラー "Token is invalidated"
- **タイムライン**: `beforeEach`で`flushdb`実行 → ログインでトークン取得 → パスワード変更リクエスト
- **期待**: トークンは有効（ブラックリストはクリア済み）
- **実際**: トークンがブラックリストに登録されている

### 考えられる原因
1. **ログイン処理でトークンがブラックリストに登録される？**
   - `LoginUseCase`を確認したが、ブラックリストへの登録はない
   - ログイン処理はトークンを生成するだけ

2. **`beforeEach`の`flushdb`が正しく実行されていない？**
   - `testClient.flushdb()`は実行されているが、非同期処理のタイミング問題？

3. **トークンの検証タイミングの問題？**
   - ログイン直後に取得したトークンが、すぐにブラックリストに登録される？

4. **他のテストからの影響？**
   - `beforeAll`で取得した`accessToken`が何らかの理由でブラックリストに登録されている？

## デバッグのための確認ポイント

1. **ログイン処理の確認**
   - `LoginUseCase.execute()`はトークンを生成するだけ
   - ブラックリストへの登録は行わない

2. **`beforeEach`の実行順序**
   - `flushdb` → パスワードリセット → テスト実行
   - この順序は正しい

3. **トークンの検証**
   - `JwtAuthGuard`でトークンを検証
   - ブラックリストチェック → トークン検証

## 修正案

### 案1: `beforeEach`で`flushdb`の後に少し待機
```typescript
beforeEach(async () => {
  if (testClient) {
    await testClient.flushdb();
    await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機
  }
  // ...
});
```

### 案2: ログイン後に少し待機
```typescript
it('正常系: パスワード変更に成功する', async () => {
  const loginRes = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: 'user@example.com', password: 'password123' })
    .expect(200);
  
  const testToken = loginRes.body.accessToken;
  await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機
  
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/password/change')
    .set('Authorization', `Bearer ${testToken}`)
    // ...
});
```

### 案3: `beforeEach`でログインしてトークンを取得（推奨）
```typescript
describe('POST /api/v1/auth/password/change', () => {
  let testToken: string;
  
  beforeEach(async () => {
    // Redisクリア
    if (testClient) {
      await testClient.flushdb();
    }
    
    // パスワードリセット
    // ...
    
    // ログインしてトークンを取得
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200);
    testToken = loginRes.body.accessToken;
  });
  
  it('正常系: パスワード変更に成功する', async () => {
    // testTokenを使用
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/password/change')
      .set('Authorization', `Bearer ${testToken}`)
      // ...
  });
});
```

## 推奨される修正

**案3を推奨**: `beforeEach`でログインしてトークンを取得することで、各テストで確実に有効なトークンを使用できます。

