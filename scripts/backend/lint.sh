#!/bin/bash

# Lint実行スクリプト (Docker版)
# 
# Docker Composeを使用してLintを実行します。
# ESLintとPrettierによるコード品質チェックを行います。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 引数の解析
LINT_MODE="${1:-check}"

# プロジェクトルートに移動
cd "${PROJECT_ROOT}"

echo "🔍 Lintを実行します (Docker)..."
echo "   モード: ${LINT_MODE}"
echo ""

# docker-composeコマンドの決定
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

# Lint実行関数
run_lint_in_docker() {
  local cmd=$1
  local readonly="${2:-true}"  # デフォルトはread-only
  
  echo "🏃 Lintを実行中..."
  # --no-deps: backendの依存サービス（redis-dev）を起動しない
  # --rm: 実行後にコンテナを削除
  # CI環境変数があればそれを使用、なければデフォルト値を使用
  if [ "${readonly}" = "true" ]; then
    $DOCKER_COMPOSE run --rm --no-deps \
      -e NODE_ENV="${NODE_ENV:-test}" \
      --volume="${PROJECT_ROOT}/apps/backend:/app/apps/backend:ro" \
      --volume="${PROJECT_ROOT}/package.json:/app/package.json:ro" \
      --volume="${PROJECT_ROOT}/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
      --volume="${PROJECT_ROOT}/pnpm-workspace.yaml:/app/pnpm-workspace.yaml:ro" \
      backend ${cmd}
  else
    # fix/formatモードでは書き込み可能にする
    $DOCKER_COMPOSE run --rm --no-deps \
      -e NODE_ENV="${NODE_ENV:-test}" \
      --volume="${PROJECT_ROOT}/apps/backend:/app/apps/backend:rw" \
      --volume="${PROJECT_ROOT}/package.json:/app/package.json:ro" \
      --volume="${PROJECT_ROOT}/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
      --volume="${PROJECT_ROOT}/pnpm-workspace.yaml:/app/pnpm-workspace.yaml:ro" \
      backend ${cmd}
  fi
}

case "${LINT_MODE}" in
  "check"|"lint")
    echo "📝 ESLintチェックを実行中..."
    run_lint_in_docker "pnpm run lint" "true"
    echo ""
    echo "✅ Lintチェックが完了しました"
    ;;
  "fix")
    echo "🔧 ESLint自動修正を実行中..."
    run_lint_in_docker "pnpm run lint" "false"
    echo ""
    echo "✅ Lint自動修正が完了しました"
    ;;
  "format")
    echo "💅 Prettierフォーマットを実行中..."
    run_lint_in_docker "pnpm run format" "false"
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



