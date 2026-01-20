#!/bin/bash

# テスト実行スクリプト (Docker版)
# 
# Docker Composeを使用してテストを実行します。
# テストの種類に応じて適切なRedisコンテナ (redis-test, redis-e2e) と
# MySQLコンテナ (mysql-test, mysql-e2e) を起動します。

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
  # 起動した可能性のあるRedisとMySQLコンテナを停止
  $DOCKER_COMPOSE stop redis-test redis-e2e mysql-test mysql-e2e > /dev/null 2>&1 || true
}
trap cleanup EXIT

# MySQLの起動待機関数
wait_for_mysql() {
  local db_host=$1
  local db_port=$2
  local db_user=$3
  local db_password=$4
  local max_retries=30
  local retry=0

  echo "⏳ MySQLの起動を待機中 (${db_host}:${db_port})..."
  while [ $retry -lt $max_retries ]; do
    if MYSQL_PWD="${db_password}" mysql -h"${db_host}" -P"${db_port}" -u"${db_user}" --protocol=TCP -e "SELECT 1;" > /dev/null 2>&1; then
      echo "✅ MySQLが起動しました"
      return 0
    fi
    retry=$((retry + 1))
  sleep 2
  done

  echo "❌ エラー: MySQLが起動しませんでした (${db_host}:${db_port})"
  return 1
}

# マイグレーション実行関数
run_migration() {
  local db_host=$1
  local db_port=$2
  local db_user=$3
  local db_password=$4
  local db_name=$5

  echo "🔄 データベースマイグレーションを実行中..."
  DB_HOST="${db_host}" \
  DB_PORT="${db_port}" \
  DB_USER="${db_user}" \
  DB_PASSWORD="${db_password}" \
  DB_NAME="${db_name}" \
  "${PROJECT_ROOT}/scripts/database/migrate.sh" init --seed
}

# テスト実行関数
run_test_in_docker() {
  local cmd=$1
  local redis_service=$2
  local mysql_service=$3
  local db_port=$4
  local db_name=$5
  
  echo "🔄 ${redis_service} と ${mysql_service} を起動中..."
  $DOCKER_COMPOSE up -d "${redis_service}" "${mysql_service}"
  
  # Redisの起動待機（簡易的なウェイト）
  sleep 2
  
  # MySQLの起動待機（ホスト側から接続するためlocalhostを使用）
  local db_password="${DB_PASSWORD:-password}"
  wait_for_mysql "localhost" "${db_port}" "root" "${db_password}"
  
  # マイグレーション実行（ホスト側から接続するためlocalhostを使用）
  run_migration "localhost" "${db_port}" "root" "${db_password}" "${db_name}"
  
  echo "🏃 テストを実行中..."
  # --no-deps: backendの依存サービス（redis-dev, mysql-dev）を起動しない
  # --rm: 実行後にコンテナを削除
  # -e REDIS_HOST: 接続先のRedisホストを指定（Dockerコンテナ内からはサービス名を使用）
  # -e DB_HOST: 接続先のMySQLホストを指定（Dockerコンテナ内からはサービス名を使用）
  # CI環境変数があればそれを使用、なければデフォルト値を使用
  $DOCKER_COMPOSE run --rm --no-deps \
    -e REDIS_HOST="${redis_service}" \
    -e REDIS_PORT=6379 \
    -e DB_HOST="${mysql_service}" \
    -e DB_PORT=3306 \
    -e DB_USER="root" \
    -e DB_PASSWORD="${db_password}" \
    -e DB_NAME="${db_name}" \
    -e NODE_ENV="${NODE_ENV:-test}" \
    -e JWT_SECRET="${JWT_SECRET:-test-jwt-secret-for-ci}" \
    -e JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-1800}" \
    -e BCRYPT_SALT_ROUNDS="${BCRYPT_SALT_ROUNDS:-10}" \
    --volume="${PROJECT_ROOT}/apps/backend:/app/apps/backend:ro" \
    --volume="${PROJECT_ROOT}/package.json:/app/package.json:ro" \
    --volume="${PROJECT_ROOT}/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
    --volume="${PROJECT_ROOT}/pnpm-workspace.yaml:/app/pnpm-workspace.yaml:ro" \
    backend ${cmd}
}

case "${TEST_TYPE}" in
  "unit"|"test")
    # ユニットテストは通常Redis/MySQL不要だが、サービス内で接続確認がある場合は使用
    echo "📝 ユニットテストを実行中..."
    run_test_in_docker "pnpm run test" "redis-test" "mysql-test" "3307" "mrwebdefence_test"
    ;;
  "watch")
    echo "👀 ウォッチモードでテストを実行中..."
    run_test_in_docker "pnpm run test:watch" "redis-test" "mysql-test" "3307" "mrwebdefence_test"
    ;;
  "cov"|"coverage")
    echo "📊 カバレッジレポートを生成中..."
    run_test_in_docker "pnpm run test:cov" "redis-test" "mysql-test" "3307" "mrwebdefence_test"
    ;;
  "e2e")
    echo "🔗 E2Eテストを実行中..."
    run_test_in_docker "pnpm run test:e2e" "redis-e2e" "mysql-e2e" "3308" "mrwebdefence_e2e"
    ;;
  "all")
    # ユニットテストはカバレッジレポート生成時に実行されるため重複を避ける
    echo "📊 カバレッジレポートを生成中 (ユニットテスト含む)..."
    run_test_in_docker "pnpm run test:cov" "redis-test" "mysql-test" "3307" "mrwebdefence_test"
    
    echo ""
    echo "🔗 E2Eテストを実行中..."
    # redis-testとmysql-testを停止してredis-e2eとmysql-e2eを起動（リソース節約）
    $DOCKER_COMPOSE stop redis-test mysql-test
    run_test_in_docker "pnpm run test:e2e" "redis-e2e" "mysql-e2e" "3308" "mrwebdefence_e2e"
    ;;
  *)
    echo "❌ エラー: 不明なテストタイプ '${TEST_TYPE}'"
    echo ""
    echo "使用方法: $0 [unit|test|watch|cov|coverage|e2e|all]"
    echo ""
    echo "テストタイプ:"
    echo "  unit, test  - ユニットテストのみ実行"
    echo "  watch      - ウォッチモードでテスト実行"
    echo "  cov, coverage - カバレッジレポート生成（ユニットテスト含む）"
    echo "  e2e        - E2Eテストのみ実行"
    echo "  all        - カバレッジレポートとE2Eテストの両方を実行"
    exit 1
    ;;
esac

echo ""
echo "✅ テストが完了しました"
