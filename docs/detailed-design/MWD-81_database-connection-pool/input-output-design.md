# 入出力設計 (Input/Output Design)

## 接続プール設定

### ConnectionPoolConfig

接続プールの設定を表す値オブジェクトです。

#### 入力（環境変数）

| 環境変数 | 型 | デフォルト値 | 説明 |
|---------|-----|------------|------|
| `DB_POOL_MAX_CONNECTIONS` | number | 5 | 最大接続数 |
| `DB_POOL_MIN_CONNECTIONS` | number | 1 | 最小接続数 |
| `DB_POOL_CONNECTION_TIMEOUT` | number | 30000 | 接続取得タイムアウト（ミリ秒） |
| `DB_POOL_IDLE_TIMEOUT` | number | 600000 | アイドル接続のタイムアウト（ミリ秒、10分） |
| `DB_POOL_MAX_LIFETIME` | number | 3600000 | 接続の最大生存時間（ミリ秒、1時間） |
| `DB_POOL_RETRY_ATTEMPTS` | number | 3 | 接続失敗時のリトライ回数 |
| `DB_POOL_RETRY_DELAY` | number | 1000 | リトライ間隔（ミリ秒） |

#### 出力（ConnectionPoolConfig）

```typescript
interface ConnectionPoolConfig {
  maxConnections: number;        // 最大接続数（1以上、必須）
  minConnections: number;        // 最小接続数（0以上、maxConnections以下、必須）
  connectionTimeout: number;     // 接続取得タイムアウト（ミリ秒、1以上、必須）
  idleTimeout: number;           // アイドル接続のタイムアウト（ミリ秒、1以上、必須）
  maxLifetime: number;           // 接続の最大生存時間（ミリ秒、1以上、必須）
  retryAttempts: number;         // リトライ回数（0以上、必須）
  retryDelay: number;            // リトライ間隔（ミリ秒、1以上、必須）
}
```

#### バリデーションルール

- `maxConnections`: 1以上であること
- `minConnections`: 0以上、かつ`maxConnections`以下であること
- `connectionTimeout`: 1以上であること
- `idleTimeout`: 1以上であること
- `maxLifetime`: 1以上であること
- `retryAttempts`: 0以上であること
- `retryDelay`: 1以上であること

## 接続プール状態

### ConnectionPoolStatus

接続プールの現在の状態を表す値オブジェクトです。

#### 出力（ConnectionPoolStatus）

```typescript
interface ConnectionPoolStatus {
  activeConnections: number;     // アクティブな接続数
  idleConnections: number;       // アイドルな接続数
  totalConnections: number;      // 総接続数（active + idle）
  waitingRequests: number;       // 接続待ちのリクエスト数
  isHealthy: boolean;            // プールが正常かどうか
}
```

#### 計算ロジック

- `totalConnections = activeConnections + idleConnections`
- `isHealthy = totalConnections >= minConnections && totalConnections <= maxConnections`

## 接続取得

### getConnection()

データベース接続を取得します。

#### 入力

なし（メソッド呼び出しのみ）

#### 出力

**成功時:**
- `Promise<IConnection>`: データベース接続オブジェクト

**失敗時:**
- `ConnectionTimeoutError`: 接続取得タイムアウト（最大接続数に達している場合、タイムアウトまで待機したが接続が利用可能にならなかった場合に発生）
- `ConnectionError`: 接続作成失敗（リトライ後も失敗）

#### エラー詳細

```typescript
class ConnectionTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Connection acquisition timeout after ${timeout}ms`);
    this.name = 'ConnectionTimeoutError';
  }
}

class ConnectionError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ConnectionError';
    this.cause = cause;
  }
}
```

## 接続解放

### releaseConnection(connection: Connection)

データベース接続をプールに返却します。

#### 入力

- `connection: IConnection`: 返却する接続オブジェクト

#### 出力

**成功時:**
- `Promise<void>`

**失敗時:**
- `InvalidConnectionError`: 無効な接続オブジェクト

#### エラー詳細

```typescript
class InvalidConnectionError extends Error {
  constructor() {
    super('Invalid connection object');
    this.name = 'InvalidConnectionError';
  }
}
```

## 接続プール状態取得

### getStatus()

接続プールの現在の状態を取得します。

#### 入力

なし（メソッド呼び出しのみ）

#### 出力

- `ConnectionPoolStatus`: 接続プールの状態

## 接続プール初期化

### initialize()

接続プールを初期化します。

#### 入力

なし（メソッド呼び出しのみ）

#### 出力

**成功時:**
- `Promise<void>`

**失敗時:**
- `InitializationError`: 初期化失敗

#### エラー詳細

```typescript
class InitializationError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Failed to initialize connection pool: ${message}`);
    this.name = 'InitializationError';
    this.cause = cause;
  }
}
```

## 接続プール終了

### destroy()

接続プールを終了し、すべての接続を閉じます。

#### 入力

なし（メソッド呼び出しのみ）

#### 出力

**成功時:**
- `Promise<void>`

**失敗時:**
- `DestructionError`: 終了処理失敗

#### エラー詳細

```typescript
class DestructionError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Failed to destroy connection pool: ${message}`);
    this.name = 'DestructionError';
    this.cause = cause;
  }
}
```

## 接続オブジェクト

### IConnection

データベース接続を表すインターフェースです。

#### プロパティ

```typescript
interface IConnection {
  id: string;                    // 接続の一意なID
  createdAt: Date;               // 接続作成日時
  lastUsedAt: Date;              // 最終使用日時
}
```

**注意**: 接続が使用中（Active）か待機中（Idle）かという状態は、接続オブジェクト自身が持つ情報ではなく、接続プール（`DatabaseConnectionPool`）が管理します。これにより、プールとオブジェクトの間で状態の不整合が起きるリスクを回避します。

#### メソッド

- `isValid(): Promise<boolean>`: 接続が有効かどうかを確認
- `close(): Promise<void>`: 接続を閉じる

## NestJSモジュール設定

### DatabaseModule.forRoot(config)

接続プールを設定してNestJSモジュールを初期化します。

#### 入力

```typescript
interface DatabaseModuleOptions {
  config?: Partial<ConnectionPoolConfig>;  // 接続プール設定（オプション）
}
```

#### 出力

- `DynamicModule`: NestJSの動的モジュール

#### 使用例

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot({
      config: {
        maxConnections: 10,
        minConnections: 2,
        connectionTimeout: 30000,
      },
    }),
  ],
})
export class AppModule {}
```

