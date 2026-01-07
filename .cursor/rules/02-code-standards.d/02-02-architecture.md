## 3. アーキテクチャとモジュール設計

**優先度レベル**: `02-XX` - **優先（SHOULD）** - できる限り守るべきルール

### 3-1. データベーストランザクション管理

#### ❌ 避けるべきパターン: 複数操作の非アトミック実行

```typescript
// ❌ 悪い例: 変更履歴と取引更新が別々の操作
async execute(dto: UpdateDto): Promise<Result> {
  await this.historyRepository.create(history);  // 1つ目の操作
  return await this.transactionRepository.update(transaction);  // 2つ目の操作
}
```

**問題**:

- 1つ目の操作が成功しても、2つ目が失敗するとデータ不整合が発生
- 履歴だけ記録されて、実際の更新が失敗する可能性
- ロールバックが困難

#### ✅ 正しいパターン: トランザクションでアトミックに実行

```typescript
// ✅ 良い例: データベーストランザクションで複数操作を1つに
@Injectable()
export class UpdateTransactionSubcategoryUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  async execute(dto: UpdateDto): Promise<Result> {
    // トランザクション外でエンティティの存在確認を並列実行
    const [transaction, subcategory] = await Promise.all([
      this.transactionRepository.findById(dto.transactionId),
      this.subcategoryRepository.findById(dto.subcategoryId),
    ]);

    // 存在確認
    if (!transaction) {
      throw new NotFoundException(
        `Transaction not found with ID: ${dto.transactionId}`,
      );
    }
    if (!subcategory) {
      throw new NotFoundException(
        `Subcategory not found with ID: ${dto.subcategoryId}`,
      );
    }

    // データ整合性の検証（カテゴリタイプの一致）
    if (transaction.category.type !== subcategory.categoryType) {
      throw new BadRequestException(
        `Subcategory with type ${subcategory.categoryType} cannot be assigned to a transaction with type ${transaction.category.type}.`,
      );
    }

    // データベーストランザクションで複数操作をアトミックに実行
    return await this.dataSource.transaction(async (entityManager) => {
      // トランザクション内で取引を再取得（競合状態の防止）
      const transactionRepo = entityManager.getRepository(TransactionOrmEntity);
      const transactionOrm = await transactionRepo.findOne({
        where: { id: dto.transactionId },
      });

      if (!transactionOrm) {
        throw new NotFoundException(
          `Transaction not found with ID: ${dto.transactionId} within transaction`,
        );
      }

      // 変更履歴を記録
      const historyRepo = entityManager.getRepository(HistoryOrmEntity);
      await historyRepo.save({ ... });

      // 取引を更新
      await transactionRepo.save({ ... });

      return result;
    });
  }
}
```

**重要なポイント**:

1. **複数のデータベース操作が関連する場合は必ずトランザクションを使用**
2. **トランザクション外で可能な検証は先に実行**（パフォーマンス向上）
3. **エンティティマネージャー経由でリポジトリにアクセス**
4. **すべての操作が成功するか、すべて失敗するかのどちらか**（原子性）
5. **トランザクション内でのデータ取得は必ずentityManagerを使用**
   - トランザクションに紐付いていないリポジトリを使用すると、ダーティリードなどの競合状態が発生する可能性
   - トランザクションの一貫性を保証するため、トランザクション内でのデータ取得は`entityManager.getRepository()`を使用
6. **トランザクション外での並列取得を活用**
   - 複数のエンティティを取得する場合は`Promise.all`を使用して並列化することでパフォーマンスを改善
   - ただし、トランザクション内での更新対象エンティティは必ず再取得する
7. **データ整合性の検証**
   - エンティティ間の関連性（例：カテゴリタイプの一致）を検証し、不整合の場合は`BadRequestException`をスロー
   - 検証はトランザクション外で実行し、早期にエラーを返すことでパフォーマンスを向上
8. **トランザクション内でのタイムスタンプ管理**
   - トランザクション内で複数のタイムスタンプが必要な場合、トランザクション開始時に一度だけ`Date`オブジェクトを生成し、それを使い回す
   - これにより、`changedAt`、`confirmedAt`、`updatedAt`などの間に意図しない時間のずれが生じるのを防ぐ

#### リポジトリパターンの活用とトランザクション管理

**注意点**: トランザクション内でentityManagerを直接使用すると、リポジトリ層に集約すべきマッピングロジックがユースケース層に漏れ出してしまいます。

**✅ 推奨アプローチ**:

1. リポジトリメソッドがオプションで`EntityManager`を受け取れるようにする
2. トランザクション内では、その`EntityManager`をリポジトリメソッドに渡す
3. 永続化ロジックをリポジトリ層にカプセル化しつつ、アトミックな操作を保証

```typescript
// ✅ より良い設計
export interface IRepository {
  create(entity: Entity, entityManager?: EntityManager): Promise<Entity>;
  update(entity: Entity, entityManager?: EntityManager): Promise<Entity>;
  findById(id: string, entityManager?: EntityManager): Promise<Entity | null>;
}

// リポジトリ実装
@Injectable()
export class TypeOrmRepository implements IRepository {
  constructor(
    @InjectRepository(OrmEntity)
    private readonly repository: Repository<OrmEntity>,
  ) {}

  async create(entity: Entity, manager?: EntityManager): Promise<Entity> {
    const repository = manager ? manager.getRepository(OrmEntity) : this.repository;
    const ormEntity = this.toOrm(entity);
    await repository.save(ormEntity);
    return entity;
  }

  async findById(id: string, manager?: EntityManager): Promise<Entity | null> {
    const repository = manager ? manager.getRepository(OrmEntity) : this.repository;
    const ormEntity = await repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  // ドメインエンティティとORMエンティティのマッピングはリポジトリ内に集約
  private toOrm(domain: Entity): OrmEntity { /* ... */ }
  private toDomain(orm: OrmEntity): Entity { /* ... */ }
}

// ユースケースでの使用
async execute(dto: UpdateDto): Promise<Result> {
  // トランザクション外で検証
  const entity = await this.repository.findById(dto.id);
  if (!entity) {
    throw new NotFoundException(`Entity not found`);
  }

  // トランザクション内でリポジトリを使用
  return await this.dataSource.transaction(async (entityManager) => {
    // ⚠️ 重要: トランザクション内でエンティティを再取得
    // トランザクション外で取得したデータは古い可能性があるため、
    // 更新対象のエンティティは必ずトランザクション内で再取得する
    const entityToUpdate = await this.repository.findById(dto.id, entityManager);
    if (!entityToUpdate) {
      throw new NotFoundException(`Entity not found within transaction`);
    }

    await this.historyRepository.create(history, entityManager);
    return await this.repository.update(entityToUpdate, entityManager);
  });
}
```

**重要な注意点**:

1. **競合状態（レースコンディション）の防止**
   - トランザクション外で取得したエンティティをそのまま更新すると、古いデータで上書きしてしまう危険性がある
   - **必ずトランザクション内でエンティティを再取得**してから更新する
   - これにより、他のトランザクションによる変更を正しく反映できる

2. **パフォーマンス最適化**
   - 大量のデータを処理する場合は`Promise.all`で並列化
   - トランザクション外での検証で早期リターンを活用

```typescript
// ✅ 並列処理でパフォーマンス最適化
await this.dataSource.transaction(async (entityManager) => {
  // 並列で複数のデータを処理
  await Promise.all(
    dataArray.map(async (data) => {
      const existing = await this.repository.findById(data.id, entityManager);
      if (!existing) {
        await this.repository.create(data, entityManager);
      }
    }),
  );
});
```

**メリット**:

- ✅ UseCase層がインフラストラクチャ層の実装詳細から切り離される
- ✅ ドメインエンティティとORMエンティティのマッピングがリポジトリに集約
- ✅ コードの重複を削減
- ✅ クリーンアーキテクチャの依存関係ルールを遵守
- ✅ テストの容易性が向上（リポジトリをモックしやすい）

**リポジトリ実装のベストプラクティス**:

3. **ヘルパーメソッドでコード重複を削減**

#### ❌ 避けるべきパターン: コードの重複

```typescript
// ❌ 悪い例: 同じロジックが複数のUseCaseに重複
export class GetSubcategoriesUseCase {
  private buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 階層構造構築ロジック（50行以上）
  }
}

export class GetSubcategoriesByCategoryUseCase {
  private buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 同じ階層構造構築ロジック（50行以上）← 重複！
  }
}
```

**問題**:

- 同じロジックが複数箇所に存在すると、メンテナンス性が低下
- バグ修正や機能追加時に複数箇所を修正する必要がある
- 将来のバグの原因となり得る

#### ✅ 正しいパターン: 共通サービスに抽出

```typescript
// ✅ 良い例: 共通のDomain Serviceに抽出
@Injectable()
export class SubcategoryTreeBuilderService {
  buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 階層構造構築ロジック（1箇所に集約）
  }
}

export class GetSubcategoriesUseCase {
  constructor(
    private readonly treeBuilderService: SubcategoryTreeBuilderService,
  ) {}

  async execute(): Promise<Result> {
    const subcategories = await this.repository.findAll();
    const tree = this.treeBuilderService.buildTree(subcategories);
    return { subcategories: tree };
  }
}

export class GetSubcategoriesByCategoryUseCase {
  constructor(
    private readonly treeBuilderService: SubcategoryTreeBuilderService,
  ) {}

  async execute(categoryType: CategoryType): Promise<Result> {
    const subcategories = await this.repository.findByCategory(categoryType);
    const tree = this.treeBuilderService.buildTree(subcategories);
    return { subcategories: tree };
  }
}
```

**重要なポイント**:

- **同じロジックが2箇所以上に存在する場合は、共通サービスに抽出する**
- **Domain Service層に共通ロジックを配置**（Onion Architectureの原則に従う）
- **コードの重複はメンテナンス性の低下に繋がるため、積極的にリファクタリングする**
- **APIレスポンスの最適化**
  - 空の配列やオプショナルなプロパティは、値が存在する場合にのみレスポンスに含める
  - これにより、レスポンスのペイロードサイズを削減し、クリーンなAPIレスポンスになる
  - 例：子要素を持たないノード（葉ノード）に対して空の`children`配列を含めない

#### 4. **Controllerの責務とクリーンアーキテクチャ原則**

#### ⚠️ 今後の改善課題: Controllerからリポジトリを直接呼び出さない

Issue #296 / PR #312のGeminiレビューで指摘された、クリーンアーキテクチャの原則に関する今後の改善課題です。

**現状の問題**:

```typescript
// ⚠️ 改善が必要: Controllerでリポジトリを直接呼び出している
@Post('classify')
async classify(@Body() dto: ClassificationRequestDto): Promise<ClassificationResponseDto> {
  // ユースケースで分類を実行
  const classificationResult = await this.classifyUseCase.execute(dto);

  // ⚠️ 問題: Controllerでリポジトリを直接呼び出して追加のエンティティを取得
  const subcategory = await this.subcategoryRepository.findById(
    classificationResult.subcategoryId
  );

  if (!subcategory) {
    throw new NotFoundException(`Subcategory not found`);
  }

  // merchantName等の追加情報も同様に取得
  const merchant = await this.merchantRepository.findById(
    classificationResult.merchantId
  );

  return {
    success: true,
    data: {
      subcategory,
      confidence: classificationResult.confidence,
      merchantName: merchant?.name,
    },
  };
}
```

**問題点**:

1. **クリーンアーキテクチャの原則違反**: Presentation層（Controller）がInfrastructure層（Repository）に直接依存
2. **UseCaseの責務が不明確**: 必要なデータをすべて返すべきなのはUseCaseの責務
3. **保守性の低下**: データ取得ロジックがControllerに漏れ、変更時の影響範囲が広い

**理想的な設計**:

```typescript
// ✅ 理想: UseCaseがすべての必要なデータを返す
export interface ClassificationResult {
  subcategoryId: string;
  subcategoryName: string;  // 👈 UseCaseで取得
  categoryType: CategoryType;
  confidence: number;
  reason: ClassificationReason;
  merchantId: string | null;
  merchantName: string | null;  // 👈 UseCaseで取得
}

@Post('classify')
async classify(@Body() dto: ClassificationRequestDto): Promise<ClassificationResponseDto> {
  // ✅ UseCaseがすべてのデータを返す
  const result = await this.classifyUseCase.execute(dto);

  // ✅ Controllerはデータの整形のみ
  return {
    success: true,
    data: result,
  };
}
```

**対応方針**:

- **現時点**: Phase 5（Presentation層実装）では、動作する実装を優先し、アーキテクチャ改善は保留
- **今後**: FR-009のリファクタリングフェーズ（Phase 6以降）、または別途「技術的負債解消」Issueで対応
- **優先度**: Medium（機能は正常に動作しているが、保守性向上のため改善推奨）

**参考**: Issue #296 / PR #312 - Gemini指摘：クリーンアーキテクチャ原則の遵守

```typescript
// ✅ リポジトリ実装でDRY原則を徹底
@Injectable()
export class TypeOrmRepository implements IRepository {
  constructor(
    @InjectRepository(OrmEntity)
    private readonly repository: Repository<OrmEntity>,
  ) {}

  // ヘルパーメソッドでEntityManagerの処理を一元化
  private getRepo(manager?: EntityManager): Repository<OrmEntity> {
    return manager ? manager.getRepository(OrmEntity) : this.repository;
  }

  async create(entity: Entity, manager?: EntityManager): Promise<Entity> {
    const repository = this.getRepo(manager);
    const ormEntity = this.toOrm(entity);
    await repository.save(ormEntity);
    return entity;
  }

  async findById(id: string, manager?: EntityManager): Promise<Entity | null> {
    const repository = this.getRepo(manager);
    const ormEntity = await repository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async update(entity: Entity, manager?: EntityManager): Promise<Entity> {
    const repository = this.getRepo(manager);
    const ormEntity = this.toOrm(entity);
    await repository.save(ormEntity);
    return entity;
  }

  // 他のメソッドも同様にgetRepo()を使用
}
```

**メリット**:

- EntityManager取得ロジックが一箇所に集約される
- 各メソッドがシンプルになり可読性が向上
- 変更が必要な場合、一箇所を修正するだけで済む

**トレードオフ**:

- 現状の実装（entityManager直接使用）でも原子性は保証される
- リポジトリパターンの完全性を優先する場合は、上記の設計を採用
- プロジェクトの段階や優先度に応じて判断する

**参考**: PR #283 Geminiレビュー指摘

#### TypeORMのデコレータの適切な使用

```typescript
// ❌ 避けるべきパターン
export class HistoryOrmEntity {
  @CreateDateColumn() // データベースが自動設定するはず
  changedAt!: Date;
}

// アプリケーション層で日時を設定
const history = new History(
  id,
  transactionId,
  oldCategory,
  newCategory,
  new Date(), // ← アプリで設定している！
);
```

**問題**: `@CreateDateColumn`はデータベースが自動的に日時を設定するためのもの。アプリケーション側で日時を設定する場合は矛盾が生じる。

```typescript
// ✅ 正しいパターン
export class HistoryOrmEntity {
  @Column() // 通常のカラムとして定義
  changedAt!: Date;
}

// アプリケーション層で明示的に日時を設定
const history = new History(
  id,
  transactionId,
  oldCategory,
  newCategory,
  new Date(), // アプリで制御
);
```

**原則**:

- **`@CreateDateColumn` / `@UpdateDateColumn`**: データベースに日時管理を任せる場合
- **`@Column()`**: アプリケーションで日時を制御する場合

### ❌ 避けるべきパターン

#### 3-2. コントローラーから他モジュールのリポジトリへの直接依存

```typescript
// ❌ コントローラーが複数モジュールのリポジトリに依存
@Controller("health")
class HealthController {
  constructor(
    private institutionRepo: IInstitutionRepository,
    private creditCardRepo: ICreditCardRepository,
    private securitiesRepo: ISecuritiesAccountRepository,
  ) {}
}
```

**✅ 正しい対応**:

```typescript
// ✅ 専用サービスを作成してデータ集約
@Injectable()
class InstitutionAggregationService {
  constructor(
    private institutionRepo: IInstitutionRepository,
    private creditCardRepo: ICreditCardRepository,
    private securitiesRepo: ISecuritiesAccountRepository,
  ) {}

  async getAllInstitutions(): Promise<IInstitutionInfo[]> {
    // 複数モジュールからデータを集約
  }
}

@Controller("health")
class HealthController {
  constructor(
    private aggregationService: InstitutionAggregationService, // 1つのサービスに依存
  ) {}
}
```

---

### 3-3. NestJSモジュール定義のベストプラクティス

#### ❌ 避けるべきパターン: プロバイダーの重複登録

```typescript
// ❌ 悪い例: 同じプロバイダーが2回登録されている
@Module({
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionTypeOrmRepository,
    },
    TransactionTypeOrmRepository, // ← 重複！
    {
      provide: HISTORY_REPOSITORY,
      useClass: HistoryRepository,
    },
    HistoryRepository, // ← 重複！
    // ...
  ],
})
export class TransactionModule {}
```

**問題**:

- 同じクラスが2つのインスタンスとして登録される
- DIコンテナが混乱し、予期しない動作を引き起こす可能性
- 保守性が低下

#### ✅ 正しいパターン: トークンベースの登録のみ

```typescript
// ✅ 良い例: トークンベースの登録のみ
@Module({
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionTypeOrmRepository,
    },
    {
      provide: HISTORY_REPOSITORY,
      useClass: HistoryRepository,
    },
    // Domain Services
    TransactionDomainService,
    // Use Cases
    UpdateTransactionCategoryUseCase,
  ],
})
export class TransactionModule {}
```

**重要なポイント**:

- **トークンで提供されるクラスは、クラス名で再登録しない**
- **依存性注入はトークン経由で行う**
- **モジュール定義をシンプルに保つ**
- **未使用の依存関係は削除する**
  - インジェクトされているが使用されていない依存関係は、コードの理解を妨げる可能性があるため削除する
  - 特に、`entityManager`から直接リポジトリを取得している場合は、不要なインジェクションを削除する
- **DIトークンはSymbolを使用する**
  - 将来的な名前の衝突を避け、一貫性を保つために、すべてのDIトークンは`Symbol`を使用する
  - 文字列リテラルではなく、`Symbol('InterfaceName')`の形式で定義する
  - 例：`export const REPOSITORY_TOKEN = Symbol('IRepository');`

### 3-4. Domain層の設計原則とパフォーマンス考慮

#### ❌ 避けるべきパターン1: Domain ServiceでfindAll()してメモリフィルタリング

```typescript
// ❌ 悪い例: 全件取得してメモリ上でフィルタリング
@Injectable()
export class MerchantMatcherService {
  async match(description: string): Promise<Merchant | null> {
    const merchants = await this.merchantRepository.findAll();

    for (const merchant of merchants) {
      if (merchant.matchesDescription(description)) {
        return merchant;
      }
    }
    return null;
  }
}
```

**問題**:

- データ量の増加に伴いパフォーマンスが著しく低下
- 不要なデータをメモリに読み込む
- データベースの検索機能を活用できていない

**✅ 正しいパターン: リポジトリに検索責務を委譲**

```typescript
// ✅ 良い例: リポジトリ層で効率的な検索を実施
export interface IMerchantRepository {
  searchByDescription(description: string): Promise<Merchant | null>;
}

@Injectable()
export class MerchantMatcherService {
  async match(description: string): Promise<Merchant | null> {
    // リポジトリ層でDB検索を実施（パフォーマンス最適化）
    return await this.merchantRepository.searchByDescription(description);
  }
}

// Infrastructure層での実装例
@Injectable()
export class MerchantTypeOrmRepository implements IMerchantRepository {
  async searchByDescription(description: string): Promise<Merchant | null> {
    // DBレベルでLIKE検索やJSON検索を実施
    const result = await this.repository
      .createQueryBuilder("merchant")
      .where("merchant.name LIKE :desc", { desc: `%${description}%` })
      .orWhere('JSON_SEARCH(merchant.aliases, "one", :desc) IS NOT NULL', {
        desc: `%${description}%`,
      })
      .getOne();

    return result ? this.toDomain(result) : null;
  }
}
```

**重要なポイント**:

1. **Domain Serviceはビジネスロジックの調整に専念**
2. **データアクセスの最適化はリポジトリに委譲**
3. **パフォーマンス要件を考慮したリポジトリメソッド設計**

#### ❌ 避けるべきパターン2: コンストラクタ内でのサービスインスタンス化

```typescript
// ❌ 悪い例: コンストラクタ内で直接new
export class SubcategoryClassifierService {
  private readonly merchantMatcher: MerchantMatcherService;
  private readonly keywordMatcher: KeywordMatcherService;

  constructor(
    private readonly subcategoryRepository: ISubcategoryRepository,
    merchantRepository: IMerchantRepository,
  ) {
    this.merchantMatcher = new MerchantMatcherService(merchantRepository);
    this.keywordMatcher = new KeywordMatcherService();
  }
}
```

**問題**:

- 依存性逆転の原則(DIP)に反する
- テストが困難（モック化できない）
- クラス間の結合度が高い

**✅ 正しいパターン: コンストラクタ注入**

```typescript
// ✅ 良い例: すべての依存をコンストラクタ注入
@Injectable()
export class SubcategoryClassifierService {
  constructor(
    private readonly subcategoryRepository: ISubcategoryRepository,
    private readonly merchantMatcher: MerchantMatcherService,
    private readonly keywordMatcher: KeywordMatcherService,
  ) {}
}
```

**重要なポイント**:

1. **すべての依存はコンストラクタ経由で注入**
2. **@Injectable()デコレータでNestJSのDIコンテナに登録**
3. **テストしやすい設計**

#### ❌ 避けるべきパターン3: テキスト正規化ロジックの重複

```typescript
// ❌ 悪い例: 各クラスで異なる正規化ロジック
class MerchantEntity {
  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, "");
  }
}

class KeywordMatcherService {
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      )
      .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, "")
      .trim();
  }
}
```

**問題**:

- ロジックの一貫性がない
- マッチング結果に予期せぬ差異が発生
- 保守性が低い

**✅ 正しいパターン: 共通ユーティリティの使用**

```typescript
// ✅ 良い例: 統一された正規化ユーティリティ
export class TextNormalizer {
  static normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      )
      .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, "")
      .replace(/\s+/g, "")
      .trim();
  }

  static includes(haystack: string, needle: string): boolean {
    return this.normalize(haystack).includes(this.normalize(needle));
  }
}

// 各クラスで統一使用
class MerchantEntity {
  matchesDescription(description: string): boolean {
    return TextNormalizer.includes(description, this.name);
  }
}
```

**重要なポイント**:

1. **アプリケーション全体で統一されたロジック**
2. **一貫性のある処理結果**
3. **保守性・テスト容易性の向上**

#### ✅ Repository Interfaceの安全な設計

```typescript
// ❌ 避けるべき: null安全性がない
export interface ISubcategoryRepository {
  findDefault(categoryType: CategoryType): Promise<Subcategory>;
}

// ✅ 推奨: null安全性を考慮
export interface ISubcategoryRepository {
  findDefault(categoryType: CategoryType): Promise<Subcategory | null>;
}

// 呼び出し側で安全にハンドリング
const defaultSubcategory = await this.repository.findDefault(mainCategory);
if (!defaultSubcategory) {
  throw new Error(
    `Default subcategory not found for category: ${mainCategory}`,
  );
}
```

**重要なポイント**:

1. **データが見つからない可能性を型で表現**
2. **呼び出し側で適切なエラーハンドリング**
3. **null安全性の向上**

#### ✅ スコアベースの信頼度設計

```typescript
// ❌ 避けるべき: 信頼度をハードコード
const keywordMatch = this.keywordMatcher.match(description, category, subcategories);
if (keywordMatch) {
  const confidence = new ClassificationConfidence(0.8); // 固定値
  return new SubcategoryClassification(...);
}

// ✅ 推奨: 実際のマッチングスコアを活用
export interface KeywordMatchResult {
  subcategory: Subcategory;
  score: number;
}

const keywordMatch = this.keywordMatcher.match(description, category, subcategories);
if (keywordMatch) {
  // スコアを信頼度として利用（最低保証あり）
  const confidenceValue = Math.max(keywordMatch.score, 0.7);
  const confidence = new ClassificationConfidence(confidenceValue);
  return new SubcategoryClassification(...);
}
```

**重要なポイント**:

1. **計算されたスコアを活用**
2. **信頼度の動的な調整**
3. **より精度の高い分類**

#### 📝 日本語テキスト処理の将来対応

```typescript
/**
 * テキストからキーワードを抽出
 *
 * NOTE: 現在はスペースで分割する簡易実装
 * 日本語の取引明細（単語がスペースで区切られていない）には
 * 有効ではないため、将来的に形態素解析ライブラリ（kuromoji.js等）の
 * 導入を検討する必要がある
 */
public extractKeywords(text: string): string[] {
  const normalized = TextNormalizer.normalize(text);
  // TODO: 形態素解析の導入（kuromoji.js等）
  return normalized.split(/\s+/).filter((word) => word.length > 0);
}
```

**重要なポイント**:

1. **現在の実装の制約を明示**
2. **将来の改善方針をコメントで残す**
3. **段階的な機能向上を可能にする**

### 3-3. Value Objectとドメインモデルの一貫性

#### ❌ 避けるべきパターン: プリミティブな型をドメインエンティティで使用

```typescript
// ❌ 悪い例: プリミティブ型
export class Merchant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly confidence: number, // プリミティブ型
  ) {
    // バリデーションをエンティティで実装
    if (confidence < 0 || confidence > 1) {
      throw new Error("Invalid confidence");
    }
  }

  public getConfidence(): number {
    return this.confidence;
  }
}
```

**問題**:

- ドメインモデルの一貫性がない（他では`ClassificationConfidence` VOを使用）
- バリデーションロジックが分散
- 信頼度に関するロジックが集約されていない

**✅ 正しいパターン: Value Objectの活用**

```typescript
// ✅ 良い例: Value Objectを使用
export class Merchant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly confidence: ClassificationConfidence, // Value Object
  ) {
    // バリデーションはVOが担当
  }

  public getConfidence(): ClassificationConfidence {
    return this.confidence;
  }

  public toJSON(): MerchantJSONResponse {
    return {
      id: this.id,
      name: this.name,
      confidence: this.confidence.getValue(), // VOから値を取得
    };
  }
}
```

**重要なポイント**:

1. **ドメインモデル全体で一貫した型を使用**
2. **バリデーションロジックはVOに集約**
3. **JSONシリアライズ時はgetValue()で数値に変換**

### 3-5. マジックナンバーの排除

#### ❌ 避けるべきパターン: 閾値のハードコード

```typescript
// ❌ 悪い例: マジックナンバー
export class ClassificationConfidence {
  public isHigh(): boolean {
    return this.value >= 0.9; // 意図が不明確
  }

  public isMedium(): boolean {
    return this.value >= 0.7 && this.value < 0.9; // 変更時の影響が大きい
  }
}

// ❌ 悪い例: サービス内のマジックナンバー
export class SubcategoryClassifierService {
  async classify(description: string): Promise<SubcategoryClassification> {
    if (keywordMatch) {
      const confidenceValue = Math.max(keywordMatch.score, 0.7); // 意図不明
      // ...
    }
    const defaultConfidence = new ClassificationConfidence(0.5); // 変更困難
  }
}
```

**問題**:

- 数値の意図が不明確
- 変更時に複数箇所の修正が必要
- テストでの検証が困難

**✅ 正しいパターン: 名前付き定数の使用**

```typescript
// ✅ 良い例: Value Objectで定数化
export class ClassificationConfidence {
  private static readonly HIGH_THRESHOLD = 0.9;
  private static readonly MEDIUM_THRESHOLD = 0.7;

  public isHigh(): boolean {
    return this.value >= ClassificationConfidence.HIGH_THRESHOLD;
  }

  public isMedium(): boolean {
    return (
      this.value >= ClassificationConfidence.MEDIUM_THRESHOLD &&
      this.value < ClassificationConfidence.HIGH_THRESHOLD
    );
  }

  // 閾値を外部から取得可能に
  public static getHighThreshold(): number {
    return ClassificationConfidence.HIGH_THRESHOLD;
  }
}

// ✅ 良い例: サービスで定数化
@Injectable()
export class SubcategoryClassifierService {
  private static readonly MINIMUM_KEYWORD_MATCH_CONFIDENCE = 0.7;
  private static readonly DEFAULT_CLASSIFICATION_CONFIDENCE = 0.5;

  async classify(description: string): Promise<SubcategoryClassification> {
    if (keywordMatch) {
      const confidenceValue = Math.max(
        keywordMatch.score,
        SubcategoryClassifierService.MINIMUM_KEYWORD_MATCH_CONFIDENCE,
      );
      // ...
    }
    const defaultConfidence = new ClassificationConfidence(
      SubcategoryClassifierService.DEFAULT_CLASSIFICATION_CONFIDENCE,
    );
  }
}
```

**重要なポイント**:

1. **意味のある名前で定数を定義**
2. **変更時の影響範囲を最小化**
3. **テストでの検証が容易**
4. **コードの可読性と保守性が向上**

### 3-6. 冗長なasync/awaitの回避

#### ❌ 避けるべきパターン: awaitして即return

```typescript
// ❌ 悪い例: 冗長なasync/await
export class MerchantMatcherService {
  public async match(description: string): Promise<Merchant | null> {
    return await this.merchantRepository.searchByDescription(description);
  }
}
```

**問題**:

- 不要なPromiseラッピング
- 微妙なパフォーマンスオーバーヘッド
- コードが冗長

**✅ 正しいパターン: Promiseを直接返す**

```typescript
// ✅ 良い例: Promiseを直接返す
export class MerchantMatcherService {
  public match(description: string): Promise<Merchant | null> {
    return this.merchantRepository.searchByDescription(description);
  }
}
```

**例外: エラーハンドリングや追加処理が必要な場合**

```typescript
// ✅ async/awaitが必要なケース
export class MerchantMatcherService {
  public async match(description: string): Promise<Merchant | null> {
    try {
      const merchant =
        await this.merchantRepository.searchByDescription(description);
      // 追加の処理やログ出力
      this.logger.debug(`Matched merchant: ${merchant?.name}`);
      return merchant;
    } catch (error) {
      this.logger.error("Merchant matching failed", error);
      throw new MerchantMatchingException(error);
    }
  }
}
```

**重要なポイント**:

1. **単純なPromise転送ではasync/awaitを省略**
2. **エラーハンドリングや追加処理がある場合は使用**
3. **パフォーマンスとコードのシンプルさのバランス**

### 3-7. テキスト正規化の注意点

#### ❌ 避けるべきパターン: 過度な空白削除

```typescript
// ❌ 悪い例: すべての空白を削除
static normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
    .replace(/\s+/g, '') // すべての空白を削除
    .trim();
}

// 結果: extractKeywords()が機能しない
public extractKeywords(text: string): string[] {
  const normalized = this.normalizeText(text);
  // スペースが存在しないため分割できない
  return normalized.split(/\s+/).filter((word) => word.length > 0);
}
```

**問題**:

- キーワード抽出が機能しない
- 単語の区切りが失われる

**✅ 正しいパターン: 空白を一つにまとめる**

```typescript
// ✅ 良い例: 複数の空白を一つにまとめる
static normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sぁ-んァ-ヶー一-龯]/g, '')
    .replace(/\s+/g, ' ') // 複数空白を一つにまとめる
    .trim();
}

// 結果: extractKeywords()が正常に動作
public extractKeywords(text: string): string[] {
  const normalized = this.normalizeText(text);
  // スペースで正しく分割できる
  return normalized.split(/\s+/).filter((word) => word.length > 0);
}
```

**重要なポイント**:

1. **正規化の目的を明確にする**
2. **後続の処理への影響を考慮**
3. **汎用的なユーティリティは慎重に設計**

---
