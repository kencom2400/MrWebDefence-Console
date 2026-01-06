#!/bin/bash

# Lint実行スクリプト
# 
# NestJSバックエンドのLintを実行します。
# ESLintとPrettierによるコード品質チェックを行います。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# 引数の解析
LINT_MODE="${1:-check}"

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
  echo "📦 依存関係をインストール中..."
  pnpm install
fi

echo "🔍 Lintを実行します..."
echo "   モード: ${LINT_MODE}"
echo ""

case "${LINT_MODE}" in
  "check"|"lint")
    echo "📝 ESLintチェックを実行中..."
    pnpm run lint
    echo ""
    echo "✅ Lintチェックが完了しました"
    ;;
  "fix")
    echo "🔧 ESLint自動修正を実行中..."
    pnpm run lint
    echo ""
    echo "✅ Lint自動修正が完了しました"
    ;;
  "format")
    echo "💅 Prettierフォーマットを実行中..."
    pnpm run format
    echo ""
    echo "✅ フォーマットが完了しました"
    ;;
  *)
    echo "❌ エラー: 不明なモード '${LINT_MODE}'"
    echo ""
    echo "使用方法: $0 [check|fix|format]"
    echo ""
    echo "オプション:"
    echo "  check, lint - Lintチェックを実行（デフォルト）"
    echo "  fix        - Lint自動修正を実行"
    echo "  format     - Prettierフォーマットを実行"
    exit 1
    ;;
esac


