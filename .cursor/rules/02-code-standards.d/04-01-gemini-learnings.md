
### 13-9. RBAC設計とセキュリティ（PR #35）

**学習元**: PR #35 - Task 3.3: RBAC実装（Geminiレビュー指摘）

#### デフォルト拒否 (Deny by Default) とフェイルセーフ

**問題**: ガードを個別のエンドポイントに適用する方式では、適用漏れが発生した場合に、意図せずエンドポイントが公開されてしまうリスクがある。

**解決策**:
1. **グローバルガードの適用**: `APP_GUARD` を使用して、認可ガード（`RolesGuard`）をアプリケーション全体に適用する。
2. **パブリックデコレータ**: 公開エンドポイントには明示的に `@Public()` デコレータを付与してバイパスする。
3. **フェイルセーフ**: `@Roles` も `@Public` も指定されていないエンドポイントは、デフォルトでアクセスを**拒否**する。

```typescript
// RolesGuardのロジックイメージ
const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
if (isPublic) return true;

const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
if (!requiredRoles) return false; // Fail Safe: ロール指定がなければ拒否

// ... ロールチェック ...
```

**理由**:
- セキュリティホールの防止（適用漏れ対策）
- 安全なデフォルト設定の徹底

#### ドメインエンティティの一貫性

**問題**: エンティティのファクトリメソッド（`create`）などで、ドメインの文脈に合わない引数名（例: ハッシュ化済みパスワードなのに単に `password`）を使用すると混乱を招く。

**解決策**: 引数名やメソッドシグネチャは、その値の実態（`hashedPassword`）を正確に表すようにする。

**理由**:
- コードの可読性と保守性の向上
- ドメインロジックの意図の明確化
