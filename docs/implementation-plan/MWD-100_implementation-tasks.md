# MWD-100 実装タスクリスト

## 実装順序

Onion Architectureの原則に従い、内側のレイヤーから外側のレイヤーへ実装を進めます。

### Phase 1: Domain Layer
1. ✅ `IIpAllowListRepository`に`findAll()`メソッド追加
2. `IpAllowList`エンティティ作成（シンプルな構造）
3. `EngineConfig` Value Object作成

### Phase 2: Infrastructure Layer
4. `IpAllowListRepository`に`findAll()`実装追加

### Phase 3: Application Layer
5. `GetEngineConfigUseCase`作成

### Phase 4: Presentation Layer
6. DTOs作成（`EngineConfigResponseDto`, `FqdnConfig`, `IpAllowListConfig`, `CustomerConfig`）
7. `EngineConfigController`作成
8. `EngineModule`作成

### Phase 5: テスト
9. ユニットテスト作成
10. E2Eテスト作成

## 実装詳細

### 1. Domain Layer: IIpAllowListRepository拡張
- `findAll(): Promise<IpAllowList[]>`メソッドを追加

### 2. Domain Layer: IpAllowListエンティティ作成
- シンプルな構造で作成（MWD-100の設計に合わせる）
- プロパティ: `id`, `userId`, `ipAddress` (string型)

### 3. Domain Layer: EngineConfig Value Object作成
- プロパティ: `fqdns: Fqdn[]`, `ipAllowLists: IpAllowList[]`, `customers: Customer[]`, `lastUpdated: Date`
- 静的メソッド: `create(fqdns, ipAllowLists, customers): EngineConfig`

### 4. Infrastructure Layer: IpAllowListRepository拡張
- `findAll()`メソッドを実装（スタブ実装で空配列を返す）

### 5. Application Layer: GetEngineConfigUseCase作成
- 各リポジトリからデータを取得
- `EngineConfig` Value Objectを作成して返却

### 6. Presentation Layer: DTOs作成
- `EngineConfigResponseDto`
- `FqdnConfig`
- `IpAllowListConfig`
- `CustomerConfig`

### 7. Presentation Layer: EngineConfigController作成
- `GET /engine/v1/config`エンドポイント
- 認証・認可（APIキーまたはJWTトークン）
- DomainオブジェクトをDTOに変換

### 8. Presentation Layer: EngineModule作成
- コントローラー、UseCase、リポジトリの依存関係を設定

### 9. ユニットテスト
- `EngineConfig` Value Objectのテスト
- `GetEngineConfigUseCase`のテスト
- `EngineConfigController`のテスト

### 10. E2Eテスト
- `GET /engine/v1/config`エンドポイントのテスト
- 認証・認可のテスト
- エラーハンドリングのテスト
