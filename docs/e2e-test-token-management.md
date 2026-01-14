# E2Eテストでのトークン管理方針

## 現状の問題

### 1. トークン管理パターンの不統一

- **`fqdn.e2e-spec.ts`**: `beforeAll`で1回だけトークンを取得し、全テストで共有
- **`auth.e2e-spec.ts`**: 各テスト内で個別にトークンを取得
- **`password.e2e-spec.ts`**: `beforeEach`でRedisをクリアしてトークンを再取得
- **`mfa.e2e-spec.ts`**: `beforeAll`でRedisをクリアしてトークンを取得

### 2. 問題点

1. **Redisの`flushdb`による副作用**
   - `beforeEach`でRedisを`flushdb`すると、他のテストで使用中のトークンも無効化される
   - テスト間でトークンが共有されている場合、予期しない無効化が発生

2. **テストの独立性の欠如**
   - `beforeAll`で取得したトークンを全テストで共有している
   - 1つのテストでトークンが無効化されると、他のテストも影響を受ける

3. **トークンの有効期限**
   - JWTトークンは有効期限がある（デフォルト30分）
   - 長時間実行されるテストスイートでは、トークンが期限切れになる可能性

## 方針

### 原則

1. **テストの独立性**: 各テストは独立しており、必要なトークンはテスト内で取得する
2. **Redisのクリア**: `beforeAll`で1回だけクリアし、`beforeEach`ではクリアしない
3. **トークンの共有**: 同じ`describe`ブロック内の複数のテストで同じトークンを使用する場合は、`beforeEach`で取得（ただし、Redisをクリアしない）

### 推奨パターン

#### パターン1: 各テストで個別にトークンを取得（推奨）

```typescript
describe('Some Feature', () => {
  it('テスト1', async () => {
    // テスト内でトークンを取得
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200);
    
    const token = loginRes.body.accessToken;
    
    // テスト実行
    await request(app.getHttpServer())
      .get('/api/v1/some-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

#### パターン2: `beforeEach`でトークンを取得（同じ`describe`ブロック内で共有する場合）

```typescript
describe('Some Feature', () => {
  let accessToken: string;

  beforeEach(async () => {
    // Redisはクリアしない（beforeAllで既にクリア済み）
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200);
    
    accessToken = loginRes.body.accessToken;
  });

  it('テスト1', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/some-endpoint')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
```

#### パターン3: `beforeAll`でトークンを取得（非推奨、特別な場合のみ）

```typescript
describe('Some Feature', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Redisをクリア（1回だけ）
    if (testClient) {
      await testClient.flushdb();
    }

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200);
    
    accessToken = loginRes.body.accessToken;
  });

  // 注意: このパターンは、テスト間でトークンが無効化されないことを前提とする
  // ログアウトテストなど、トークンを無効化するテストがある場合は使用不可
});
```

### 禁止事項

1. ❌ `beforeEach`でRedisを`flushdb`する
   - 他のテストで使用中のトークンが無効化される
2. ❌ `beforeAll`で取得したトークンを、ログアウトテストなどで無効化する
   - 他のテストが影響を受ける
3. ❌ トークンのブラックリストチェックを`beforeEach`で行う
   - `beforeAll`でRedisをクリアしているため不要

## 実装例

### 修正前（問題あり）

```typescript
describe('PATCH /api/v1/fqdns/:id/status', () => {
  beforeEach(async () => {
    // ❌ Redisをクリアすると、他のテストのトークンも無効化される
    await testClient.flushdb();
    
    // ❌ トークンを再取得する必要がある
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200);
    
    accessToken = loginRes.body.accessToken;
  });
});
```

### 修正後（推奨）

```typescript
describe('PATCH /api/v1/fqdns/:id/status', () => {
  beforeEach(async () => {
    // ✅ Redisはクリアしない（beforeAllで既にクリア済み）
    // ✅ トークンを再取得（テストの独立性を保つため）
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(200);
    
    accessToken = loginRes.body.accessToken;
  });
});
```

## まとめ

- **原則**: 各テストは独立しており、必要なトークンはテスト内で取得
- **Redisのクリア**: `beforeAll`で1回だけ
- **トークンの取得**: 各テスト内、または`beforeEach`で（Redisをクリアしない）
- **禁止**: `beforeEach`でRedisを`flushdb`、`beforeAll`で取得したトークンを無効化

