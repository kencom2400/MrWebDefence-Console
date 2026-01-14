#!/bin/bash

# ビルド実行スクリプト (Docker版)
# 
# Docker Composeを使用してNestJSバックエンドをビルドします。
# TypeScriptのコンパイルと最適化を行います。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# プロジェクトルートに移動
cd "${PROJECT_ROOT}"

echo "🔨 ビルドを実行します (Docker)..."
echo ""

# docker-composeコマンドの決定
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

# ビルド実行関数
run_build_in_docker() {
  local cmd=$1
  
  echo "🏃 ビルドを実行中..."
  # --no-deps: backendの依存サービス（redis-dev）を起動しない
  # --rm: 実行後にコンテナを削除
  # CI環境変数があればそれを使用、なければデフォルト値を使用
  $DOCKER_COMPOSE run --rm --no-deps \
    -e NODE_ENV="${NODE_ENV:-production}" \
    --volume="${PROJECT_ROOT}/apps/backend:/app/apps/backend:ro" \
    --volume="${PROJECT_ROOT}/package.json:/app/package.json:ro" \
    --volume="${PROJECT_ROOT}/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
    --volume="${PROJECT_ROOT}/pnpm-workspace.yaml:/app/pnpm-workspace.yaml:ro" \
    backend ${cmd}
}

# ビルド実行
run_build_in_docker "pnpm run build"

echo ""
echo "✅ ビルドが完了しました"
echo "   出力ディレクトリ: /app/apps/backend/dist (コンテナ内)"



