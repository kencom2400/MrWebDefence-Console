# VoltaによるNode.jsバージョン・ライブラリ管理設計書

## 概要

本設計書は、Voltaを使用したNode.jsバージョン管理とパッケージマネージャー（pnpm）のバージョン管理の設計を定義します。

### 目的

- プロジェクト全体でNode.jsバージョンを統一
- パッケージマネージャー（pnpm）のバージョンを統一
- チーム開発での環境差異を排除
- CI/CD環境での再現性を確保

### Voltaとは

Voltaは、Node.jsのバージョン管理ツールです。プロジェクトごとにNode.js、npm、yarn、pnpmのバージョンを固定し、自動的に切り替えます。

**主な特徴:**
- プロジェクトごとにバージョンを固定（`package.json`に記述）
- 自動的なバージョン切り替え（プロジェクトディレクトリに入ると自動適用）
- グローバル環境への影響が少ない
- 高速なバージョン切り替え

## アーキテクチャ

### バージョン管理の階層

```
┌─────────────────────────────────────┐
│  Volta（グローバルインストール）      │
│  - Node.jsバージョン管理              │
│  - pnpmバージョン管理                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  package.json（プロジェクト設定）     │
│  - volta.node: "20.x.x"             │
│  - volta.pnpm: "9.x.x"               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  開発環境（自動適用）                 │
│  - nodeコマンド: 指定バージョン       │
│  - pnpmコマンド: 指定バージョン       │
└─────────────────────────────────────┘
```

## 設定方法

### 1. Voltaのインストール

#### macOS / Linux

```bash
curl https://get.volta.sh | bash
```

#### Windows

```powershell
# PowerShellで実行
irm get.volta.sh | iex
```

インストール後、シェルを再起動するか、以下を実行：

```bash
source ~/.zshrc  # zshの場合
# または
source ~/.bashrc  # bashの場合
```

### 2. package.jsonへの設定追加

プロジェクトルートの`package.json`に`volta`フィールドを追加します。

```json
{
  "name": "mrwebdefence-console",
  "version": "1.0.0",
  "volta": {
    "node": "20.18.0",
    "pnpm": "9.15.0"
  }
}
```

### 3. バージョンの固定

#### Node.jsバージョンの固定

```bash
# 現在のNode.jsバージョンを確認
node --version

# 特定のバージョンを固定
volta pin node@20.18.0

# または、package.jsonに直接記述
```

#### pnpmバージョンの固定

```bash
# 現在のpnpmバージョンを確認
pnpm --version

# 特定のバージョンを固定
volta pin pnpm@9.15.0

# または、package.jsonに直接記述
```

## バージョン管理戦略

### Node.jsバージョン選択基準

1. **LTS（Long Term Support）バージョンを優先**
   - 安定性と長期サポートを重視
   - 現在の推奨: Node.js 20.x LTS

2. **セキュリティアップデート**
   - セキュリティパッチは速やかに適用
   - マイナーバージョンアップは慎重に検討

3. **プロジェクト要件との整合性**
   - 使用するライブラリの互換性を確認
   - 新機能が必要な場合のみメジャーバージョンアップ

### pnpmバージョン選択基準

1. **最新の安定版を使用**
   - モノレポ構成のサポートが充実
   - パフォーマンスの向上

2. **チーム全体での統一**
   - 全員が同じバージョンを使用
   - `package-lock.yaml`の互換性を確保

### バージョン更新フロー

```
1. バージョン更新の検討
   ↓
2. 互換性確認（依存ライブラリ、CI/CD）
   ↓
3. ローカル環境でテスト
   ↓
4. package.jsonの更新
   ↓
5. チーム全体に通知
   ↓
6. CI/CD設定の更新
```

## プロジェクト構造

### package.jsonの配置

```
MrWebDefence-Console/
├── package.json          # ルートのpackage.json（Volta設定）
├── apps/
│   ├── backend/
│   │   └── package.json  # バックエンドの依存関係
│   └── frontend/
│       └── package.json   # フロントエンドの依存関係
└── libs/
    └── types/
        └── package.json  # 共通型定義の依存関係
```

### Volta設定の記述場所

**ルートの`package.json`に記述**（モノレポ全体で統一）

```json
{
  "name": "mrwebdefence-console",
  "private": true,
  "volta": {
    "node": "20.18.0",
    "pnpm": "9.15.0"
  }
}
```

## 使用方法

### 開発環境での自動適用

Voltaがインストールされている場合、プロジェクトディレクトリに入ると自動的に指定されたバージョンが適用されます。

```bash
# プロジェクトディレクトリに移動
cd /path/to/MrWebDefence-Console

# 自動的にNode.js 20.18.0とpnpm 9.15.0が適用される
node --version  # v20.18.0
pnpm --version  # 9.15.0
```

### バージョンの確認

```bash
# Node.jsバージョンの確認
node --version

# pnpmバージョンの確認
pnpm --version

# Voltaで管理されているツールの確認
volta list
```

### バージョンの更新

```bash
# Node.jsバージョンを更新
volta pin node@20.19.0

# pnpmバージョンを更新
volta pin pnpm@9.16.0
```

## CI/CDでの使用

### GitHub Actionsでの設定

#### 方法1: Voltaアクションを使用（推奨）

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      # Voltaのインストール（package.jsonから自動的にバージョンを読み込む）
      - name: Install Volta
        uses: volta-cli/action@v4
      
      # package.jsonから自動的にNode.jsとpnpmのバージョンが適用される
      - name: Verify versions
        run: |
          node --version
          pnpm --version
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Run lint
        run: pnpm lint
```

#### 方法2: 手動でバージョン指定（Volta未使用環境）

Voltaが使用できない環境（例: 一部のCI/CD環境）では、package.jsonからバージョンを読み取って手動で設定します。

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      # package.jsonからNode.jsバージョンを読み取る（jqを使用）
      - name: Get Node.js version from package.json
        id: node-version
        run: |
          NODE_VERSION=$(cat package.json | jq -r '.volta.node')
          echo "version=$NODE_VERSION" >> $GITHUB_OUTPUT
      
      # package.jsonからpnpmバージョンを読み取る
      - name: Get pnpm version from package.json
        id: pnpm-version
        run: |
          PNPM_VERSION=$(cat package.json | jq -r '.volta.pnpm')
          echo "version=$PNPM_VERSION" >> $GITHUB_OUTPUT
      
      # Node.jsのセットアップ
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ steps.node-version.outputs.version }}
      
      # pnpmのインストール
      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ steps.pnpm-version.outputs.version }}
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
```

### 手動でのバージョン指定（Volta未使用環境）

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20.18.0'
  
  - name: Install pnpm
    uses: pnpm/action-setup@v4
    with:
      version: 9.15.0
  
  - name: Install dependencies
    run: pnpm install
```

## 移行手順（nodeenvからVoltaへ）

### 現在の環境（nodeenv）

- `.nodeenv`ディレクトリにNode.jsとpnpmがインストール
- `source scripts/setup/activate.sh`で環境をアクティベート

### 移行手順

1. **Voltaのインストール**
   ```bash
   curl https://get.volta.sh | bash
   ```

2. **package.jsonにVolta設定を追加**
   ```json
   {
     "volta": {
       "node": "20.18.0",
       "pnpm": "9.15.0"
     }
   }
   ```

3. **バージョンの確認と調整**
   ```bash
   # 現在のバージョンを確認
   node --version
   pnpm --version
   
   # 必要に応じてVoltaで固定
   volta pin node@20.18.0
   volta pin pnpm@9.15.0
   ```

4. **nodeenv関連ファイルの削除（オプション）**
   - `.nodeenv`ディレクトリ
   - `scripts/setup/activate.sh`（不要になった場合）

5. **ドキュメントの更新**
   - `.cursor/rules/01-project.d/02-tech-stack.md`を更新
   - README.mdを更新

## トラブルシューティング

### 問題: Voltaがバージョンを適用しない

**原因**: Voltaがインストールされていない、またはシェル設定が不適切

**解決方法**:
```bash
# Voltaのインストール確認
volta --version

# シェル設定の確認
cat ~/.zshrc | grep volta
# または
cat ~/.bashrc | grep volta

# シェルを再起動
exec $SHELL
```

### 問題: バージョンが異なる

**原因**: package.jsonのvolta設定が正しくない

**解決方法**:
```bash
# package.jsonのvolta設定を確認
cat package.json | grep -A 3 volta

# バージョンを再固定
volta pin node@20.18.0
volta pin pnpm@9.15.0
```

### 問題: CI/CDでVoltaが動作しない

**原因**: GitHub ActionsでVoltaアクションが正しく設定されていない

**解決方法**:
```yaml
# volta-cli/action@v4を使用
- name: Install Volta
  uses: volta-cli/action@v4
```

## ベストプラクティス

### 1. バージョンの固定

- **必ずバージョンを固定する**（`20.x.x`ではなく`20.18.0`のように）
- セマンティックバージョニングに従う

### 2. チーム開発

- **package.jsonをGitにコミット**（Volta設定を含む）
- バージョン更新時はチーム全体に通知
- 変更履歴を明確に記録

### 3. セキュリティ

- **定期的なセキュリティアップデートの確認**
- セキュリティパッチは速やかに適用
- 依存関係の脆弱性スキャン

### 4. ドキュメント

- **README.mdにVoltaのインストール手順を記載**
- バージョン更新時の手順を明確化
- トラブルシューティング情報を共有

## 参照資料

- [Volta公式ドキュメント](https://docs.volta.sh/)
- [Node.js LTSスケジュール](https://nodejs.org/en/about/releases/)
- [pnpm公式ドキュメント](https://pnpm.io/)

