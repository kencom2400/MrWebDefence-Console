#!/bin/bash

# 開発サーバー起動スクリプト
# 
# NestJSバックエンドの開発サーバーを起動します。
# ホットリロードが有効で、ファイル変更時に自動的に再起動されます。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# 環境変数の設定（デフォルト値）
PORT="${PORT:-3001}"
NODE_ENV="${NODE_ENV:-development}"
JWT_SECRET="${JWT_SECRET:-default-secret-key-change-in-production}"
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-86400}"

echo "🚀 開発サーバーを起動します..."
echo ""
echo "📋 設定:"
echo "   PORT: ${PORT}"
echo "   NODE_ENV: ${NODE_ENV}"
echo "   Backend Directory: ${BACKEND_DIR}"
echo ""

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
  echo "📦 依存関係をインストール中..."
  pnpm install
fi

# 開発サーバーを起動
echo "🔄 開発サーバーを起動中..."
echo "   URL: http://localhost:${PORT}"
echo ""

exec pnpm run start:dev


