#!/bin/bash

# テスト実行スクリプト (Docker版)
# 
# Docker Composeを使用してテストを実行します。
# テストの種類に応じて適切なRedisコンテナ (redis-test, redis-e2e) を起動します。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 引数の解析
TEST_TYPE="${1:-all}"

# プロジェクトルートに移動
cd "${PROJECT_ROOT}"

echo "🧪 テストを実行します (Docker)..."
echo "   テストタイプ: ${TEST_TYPE}"
echo ""

# docker-composeコマンドの決定
if command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE="docker compose"
fi

# クリーンアップ関数
cleanup() {
  echo ""
  echo "🧹 クリーンアップ中..."
  # 起動した可能性のあるRedisコンテナを停止
  $DOCKER_COMPOSE stop redis-test redis-e2e > /dev/null 2>&1 || true
}
trap cleanup EXIT

# テスト実行関数
run_test_in_docker() {
  local cmd=$1
  local redis_service=$2
  
  echo "🔄 ${redis_service} を起動中..."
  $DOCKER_COMPOSE up -d "${redis_service}"
  
  # Redisの起動待機（簡易的なウェイト）
  sleep 2
  
  echo "🏃 テストを実行中..."
  # --no-deps: backendの依存サービス（redis-dev）を起動しない
  # --rm: 実行後にコンテナを削除
  # -e REDIS_HOST: 接続先のRedisホストを指定
  $DOCKER_COMPOSE run --rm --no-deps \
    -e REDIS_HOST="${redis_service}" \
    -e REDIS_PORT=6379 \
    backend ${cmd}
}

case "${TEST_TYPE}" in
  "unit"|"test")
    # ユニットテストは通常Redis不要だが、サービス内で接続確認がある場合はredis-testを使用
    echo "📝 ユニットテストを実行中..."
    run_test_in_docker "pnpm run test" "redis-test"
    ;;
  "watch")
    echo "👀 ウォッチモードでテストを実行中..."
    run_test_in_docker "pnpm run test:watch" "redis-test"
    ;;
  "cov"|"coverage")
    echo "📊 カバレッジレポートを生成中..."
    run_test_in_docker "pnpm run test:cov" "redis-test"
    ;;
  "e2e")
    echo "🔗 E2Eテストを実行中..."
    run_test_in_docker "pnpm run test:e2e" "redis-e2e"
    ;;
  "all")
    echo "📝 ユニットテストを実行中..."
    run_test_in_docker "pnpm run test" "redis-test"
    
    echo ""
    echo "🔗 E2Eテストを実行中..."
    # redis-testを停止してredis-e2eを起動（ポート衝突はしないがリソース節約）
    $DOCKER_COMPOSE stop redis-test
    run_test_in_docker "pnpm run test:e2e" "redis-e2e"
    
    echo ""
    echo "📊 カバレッジレポートを生成中..."
    run_test_in_docker "pnpm run test:cov" "redis-test"
    ;;
  *)
    echo "❌ エラー: 不明なテストタイプ '${TEST_TYPE}'"
    echo ""
    echo "使用方法: $0 [test|watch|cov|e2e|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ テストが完了しました"
