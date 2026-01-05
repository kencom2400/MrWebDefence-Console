#!/bin/bash

# ビルド実行スクリプト
# 
# NestJSバックエンドをビルドします。
# TypeScriptのコンパイルと最適化を行います。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
  echo "📦 依存関係をインストール中..."
  pnpm install
fi

echo "🔨 ビルドを実行します..."
echo ""

# ビルド実行
pnpm run build

echo ""
echo "✅ ビルドが完了しました"
echo "   出力ディレクトリ: ${BACKEND_DIR}/dist"


