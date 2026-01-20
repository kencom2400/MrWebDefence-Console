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
  local mysql_service=$1
  local db_user=$2
  local db_password=$3
  local max_retries=30
  local retry=0

  echo "⏳ MySQLの起動を待機中 (${mysql_service})..."
  while [ $retry -lt $max_retries ]; do
    # Dockerコンテナ内でmysqlコマンドを実行して接続確認
    if $DOCKER_COMPOSE exec -T "${mysql_service}" sh -c "MYSQL_PWD='${db_password}' mysql -h localhost -u '${db_user}' -e 'SELECT 1;'" > /dev/null 2>&1; then
      echo "✅ MySQLが起動しました"
      return 0
    fi
    retry=$((retry + 1))
    sleep 2
  done

  echo "❌ エラー: MySQLが起動しませんでした (${mysql_service})"
  return 1
}

# マイグレーション実行関数
run_migration() {
  local mysql_service=$1
  local db_user=$2
  local db_password=$3
  local db_name=$4

  echo "🔄 データベースマイグレーションを実行中..."
  # Dockerコンテナ内でマイグレーションを実行
  # MySQLイメージから一時コンテナを作成してマイグレーションを実行（MySQL公式クライアントが利用可能）
  # プロジェクトルートを/appにマウント
  # migrate.shはbash構文を使用しているため、bashを明示的に指定
  # Flyway CLIをインストールしてからマイグレーションを実行
  # 既存のMySQLコンテナと同じネットワークに接続
  local network_name
  network_name=$($DOCKER_COMPOSE ps -q "${mysql_service}" 2>/dev/null | xargs -I {} docker inspect --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' {} 2>/dev/null | head -1)
  if [ -z "${network_name}" ]; then
    # フォールバック: デフォルトのネットワーク名を使用
    network_name="mrwebdefence-console_mrwebdefence-network"
  fi
  # MySQL 8.4イメージはOracle Linuxベースなので、yumまたはmicrodnfを使用
  # ARMアーキテクチャ（Apple Silicon）ではx86_64プラットフォームを指定
  local platform_flag=""
  if [ "$(uname -m)" = "arm64" ]; then
    platform_flag="--platform linux/amd64"
  fi
  if ! docker run --rm ${platform_flag} \
    --name="migration-${mysql_service}-$$" \
    -e DB_HOST="${mysql_service}" \
    -e DB_PORT=3306 \
    -e DB_USER="${db_user}" \
    -e DB_PASSWORD="${db_password}" \
    -e DB_NAME="${db_name}" \
    --volume="${PROJECT_ROOT}:/app:ro" \
    --workdir="/app/scripts/database" \
    --network="${network_name}" \
    mysql:8.4 bash -c "microdnf install -y curl java-17-openjdk-headless tar gzip || \
      (yum install -y curl java-17-openjdk-headless tar gzip || \
       apt-get update && apt-get install -y curl openjdk-17-jre-headless) && \
      (curl -L https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/10.10.0/flyway-commandline-10.10.0-linux-x64.tar.gz | tar xz -C /tmp || true) && \
      export PATH=\"/tmp/flyway-10.10.0:\$PATH\" && \
      bash migrate.sh init --seed"; then
    echo "❌ エラー: マイグレーションの実行に失敗しました"
    return 1
  fi
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
  
  # MySQLの起動待機（Dockerコンテナ内で接続確認）
  local db_password="${DB_PASSWORD:-password}"
  wait_for_mysql "${mysql_service}" "root" "${db_password}"
  
  # マイグレーション実行（Dockerコンテナ内で実行）
  run_migration "${mysql_service}" "root" "${db_password}" "${db_name}"
  
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
    # ユニットテストではマイグレーションをスキップ（データベースに依存しないため）
    echo "🔄 redis-test と mysql-test を起動中..."
    $DOCKER_COMPOSE up -d "redis-test" "mysql-test"
    sleep 2
    echo "🏃 テストを実行中..."
    db_password="${DB_PASSWORD:-password}"
    $DOCKER_COMPOSE run --rm --no-deps \
      -e REDIS_HOST="redis-test" \
      -e REDIS_PORT=6379 \
      -e DB_HOST="mysql-test" \
      -e DB_PORT=3306 \
      -e DB_USER="root" \
      -e DB_PASSWORD="${db_password}" \
      -e DB_NAME="mrwebdefence_test" \
      -e NODE_ENV="${NODE_ENV:-test}" \
      -e JWT_SECRET="${JWT_SECRET:-test-jwt-secret-for-ci}" \
      -e JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-1800}" \
      -e BCRYPT_SALT_ROUNDS="${BCRYPT_SALT_ROUNDS:-10}" \
      --volume="${PROJECT_ROOT}/apps/backend:/app/apps/backend:ro" \
      --volume="${PROJECT_ROOT}/package.json:/app/package.json:ro" \
      --volume="${PROJECT_ROOT}/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
      --volume="${PROJECT_ROOT}/pnpm-workspace.yaml:/app/pnpm-workspace.yaml:ro" \
      backend pnpm run test
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
