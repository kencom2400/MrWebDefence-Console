#!/bin/bash

# テスト実行スクリプト
# 
# NestJSバックエンドのテストを実行します。
# ユニットテスト、カバレッジレポート、E2Eテストを実行できます。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# 引数の解析
TEST_TYPE="${1:-all}"

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
  echo "📦 依存関係をインストール中..."
  pnpm install
fi

echo "🧪 テストを実行します..."
echo "   テストタイプ: ${TEST_TYPE}"
echo ""

case "${TEST_TYPE}" in
  "unit"|"test")
    echo "📝 ユニットテストを実行中..."
    pnpm run test
    ;;
  "watch")
    echo "👀 ウォッチモードでテストを実行中..."
    pnpm run test:watch
    ;;
  "cov"|"coverage")
    echo "📊 カバレッジレポートを生成中..."
    pnpm run test:cov
    ;;
  "e2e")
    echo "🔗 E2Eテストを実行中..."
    pnpm run test:e2e
    ;;
  "all")
    echo "📝 ユニットテストを実行中..."
    pnpm run test
    echo ""
    echo "📊 カバレッジレポートを生成中..."
    pnpm run test:cov
    ;;
  *)
    echo "❌ エラー: 不明なテストタイプ '${TEST_TYPE}'"
    echo ""
    echo "使用方法: $0 [test|watch|cov|e2e|all]"
    echo ""
    echo "オプション:"
    echo "  test, unit   - ユニットテストを実行"
    echo "  watch       - ウォッチモードでテストを実行"
    echo "  cov, coverage - カバレッジレポートを生成"
    echo "  e2e         - E2Eテストを実行"
    echo "  all         - すべてのテストを実行（デフォルト）"
    exit 1
    ;;
esac

echo ""
echo "✅ テストが完了しました"


