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
PROJECT_NAME="$(basename "${PROJECT_ROOT}")"

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

# Docker Composeのプロジェクト名を取得（ネットワーク名の構築に使用）
# docker-compose configでプロジェクト名を取得（configファイルから直接取得）
# Dockerイメージ名は小文字のみ許可されるため、小文字に変換
COMPOSE_PROJECT_NAME="$($DOCKER_COMPOSE config 2>/dev/null | grep "^name:" | awk '{print $2}' || echo "${PROJECT_NAME}" | tr '[:upper:]' '[:lower:]')"
COMPOSE_PROJECT_NAME="$(echo "${COMPOSE_PROJECT_NAME}" | tr '[:upper:]' '[:lower:]')"

# クリーンアップ関数
cleanup() {
  echo ""
  echo "🧹 クリーンアップ中..."
  # 起動した可能性のあるRedisとMySQLコンテナを停止
  $DOCKER_COMPOSE stop redis-test redis-e2e mysql-test mysql-e2e > /dev/null 2>&1 || true
}
trap cleanup EXIT

# Dockerコンテナの起動待機関数
wait_for_container() {
  local service=$1
  local max_retries=10
  local retry=0

  echo "⏳ コンテナの起動を待機中 (${service})..."
  while [ $retry -lt $max_retries ]; do
    # docker-compose psでコンテナが起動していることを確認
    # コンテナIDを取得
    local container_id
    container_id=$($DOCKER_COMPOSE ps -q "${service}" 2>/dev/null || echo "")
    if [ -n "${container_id}" ]; then
      # docker psでコンテナの状態を確認（コンテナIDが存在し、STATUSに"Up"が含まれているか）
      if docker ps --no-trunc --format "{{.ID}} {{.Status}}" 2>/dev/null | grep -q "^${container_id}.*Up"; then
        echo "✅ コンテナが起動しました (${service})"
        return 0
      fi
    fi
    retry=$((retry + 1))
    sleep 1
  done

  echo "❌ エラー: コンテナが起動しませんでした (${service})"
  return 1
}

# MySQLの起動待機関数
# migrate, test実行と同じ接続方法（Dockerコンテナ内からサービス名で接続）でチェック
wait_for_mysql() {
  local mysql_service=$1
  local db_user=$2
  local db_password=$3
  local network_name=$4  # Dockerネットワーク名
  local max_retries=60
  local retry=0

  echo "⏳ MySQLの接続を待機中 (${mysql_service}:3306 via Docker network)..."
  # MySQLが接続可能になるまで待機
  # migrate, test実行と同じ接続方法でチェックするため、Dockerコンテナ内からサービス名で接続
  while [ $retry -lt $max_retries ]; do
    # docker runで一時的なMySQLクライアントコンテナを作成し、
    # 同じDockerネットワークに接続してサービス名でMySQLに接続
    # これにより、migrate, test実行と同じ接続経路でチェック可能
    if docker run --rm --network "${network_name}" mysql:8.4 sh -c "MYSQL_PWD='${db_password}' mysqladmin ping -h ${mysql_service} -P 3306 -u '${db_user}'" > /dev/null 2>&1; then
      echo "✅ MySQLが接続可能になりました (${mysql_service}:3306)"
      return 0
    fi
    retry=$((retry + 1))
    sleep 1
  done

  echo "❌ エラー: MySQLに接続できませんでした (${mysql_service}:3306)"
  echo "   試行回数: ${max_retries}回"
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
    network_name="${COMPOSE_PROJECT_NAME}_mrwebdefence-network"
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

# コンテナ起動関数
start_containers() {
  local redis_service=$1
  local mysql_service=$2
  
  echo "🔄 ${redis_service} と ${mysql_service} を起動中..."
  $DOCKER_COMPOSE up -d "${redis_service}" "${mysql_service}"
  
  # コンテナの起動確認
  if ! wait_for_container "${redis_service}"; then
    echo "❌ エラー: ${redis_service}コンテナの起動に失敗しました"
    return 1
  fi
  
  if ! wait_for_container "${mysql_service}"; then
    echo "❌ エラー: ${mysql_service}コンテナの起動に失敗しました"
    return 1
  fi
}

# Dockerネットワーク名取得関数
get_docker_network_name() {
  local mysql_service=$1
  
  # ネットワーク名を取得（mysql_serviceコンテナから取得）
  # このネットワーク名は、wait_for_mysql, run_migration, テスト実行のすべてで使用
  local network_name
  network_name=$($DOCKER_COMPOSE ps -q "${mysql_service}" 2>/dev/null | xargs -I {} docker inspect --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' {} 2>/dev/null | head -1)
  if [ -z "${network_name}" ]; then
    # フォールバック: デフォルトのネットワーク名を使用
    network_name="${COMPOSE_PROJECT_NAME}_mrwebdefence-network"
  fi
  echo "${network_name}"
}

# バックエンドイメージ取得/構築関数
ensure_backend_image() {
  # backendサービスのイメージ名を取得
  # docker-compose runでは--networkオプションがサポートされていないため、
  # docker runを使用してネットワークを明示的に指定する
  local backend_image
  backend_image="$($DOCKER_COMPOSE config 2>/dev/null | grep -A 30 "^  backend:" | grep -E "^    image:" | awk '{print $2}' || echo "")"
  if [ -z "${backend_image}" ]; then
    # イメージ名が取得できない場合は、docker-compose buildでイメージを構築
    # docker-compose buildで構築されるイメージ名は ${COMPOSE_PROJECT_NAME}-${SERVICE_NAME} の形式（ハイフン区切り）
    echo "🔨 backendイメージを構築中..." >&2
    if ! $DOCKER_COMPOSE build backend >&2; then
      echo "❌ エラー: backendイメージの構築に失敗しました" >&2
      return 1
    fi
    # 構築されたイメージ名を取得（docker-compose buildで構築されるイメージ名）
    backend_image="${COMPOSE_PROJECT_NAME}-backend"
  fi
  # 標準出力にのみイメージ名を出力（標準エラー出力には出力しない）
  echo "${backend_image}"
}

# バックエンドテスト実行関数
run_backend_test() {
  local cmd=$1
  local redis_service=$2
  local mysql_service=$3
  local db_name=$4
  local network_name=$5
  local backend_image=$6
  local db_password=$7
  
  echo "🏃 テストを実行中..."
  
  # docker runを使用してネットワークを明示的に指定
  # -e REDIS_HOST: 接続先のRedisホストを指定（Dockerコンテナ内からはサービス名を使用）
  # -e DB_HOST: 接続先のMySQLホストを指定（Dockerコンテナ内からはサービス名を使用）
  # CI環境変数があればそれを使用、なければデフォルト値を使用
  # 注意: CI環境ではソースコードをマウントしない（イメージ内のソースコードを使用）
  # ローカル環境ではソースコードをマウントして、変更を即座に反映
  # node_modulesは常にイメージ内のものを使用（マウントしない）
  # CI環境では、Dockerイメージをビルドする際に最新のソースコードが含まれているため、マウント不要
  local volume_args=""
  local setup_cmd="${cmd}"
  if [ "${CI:-false}" != "true" ]; then
    # ローカル環境: ソースコードをマウント（node_modulesは除外）
    # node_modulesをtmpfsでマウントして、イメージ内のnode_modulesをコピーして使用
    volume_args="--tmpfs=/app/apps/backend/node_modules --tmpfs=/app/node_modules --volume=${PROJECT_ROOT}/apps/backend:/app/apps/backend:ro --volume=${PROJECT_ROOT}/package.json:/app/package.json:ro --volume=${PROJECT_ROOT}/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro --volume=${PROJECT_ROOT}/pnpm-workspace.yaml:/app/pnpm-workspace.yaml:ro"
    # イメージ内のnode_modulesをコピー（マウント後に実行）
    # /app/node_modulesから必要なものをコピー
    setup_cmd="if [ -d /app/node_modules/.bin ]; then mkdir -p /app/apps/backend/node_modules/.bin && cp -r /app/node_modules/.bin/* /app/apps/backend/node_modules/.bin/ 2>/dev/null || true; fi; if [ -d /app/apps/backend/node_modules ]; then cp -r /app/apps/backend/node_modules/* /app/apps/backend/node_modules/ 2>/dev/null || true; fi; ${cmd}"
  fi
  # CI環境ではvolume_argsは空（イメージ内のソースコードとnode_modulesを使用）
  
  docker run --rm \
    --network="${network_name}" \
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
    ${volume_args} \
    --workdir="/app/apps/backend" \
    "${backend_image}" sh -c "${setup_cmd}"
}

# テスト実行関数（メイン）
# 注意: すべての接続はDockerネットワーク内でサービス名とポート3306を使用
# db_port引数は削除（コンテナ間通信ではホストマシンのポートマッピングは使用しない）
run_test_in_docker() {
  local cmd=$1
  local redis_service=$2
  local mysql_service=$3
  local db_name=$4
  local skip_migration="${5:-false}"  # マイグレーションをスキップするか（デフォルト: false）
  
  # 1. コンテナ起動
  if ! start_containers "${redis_service}" "${mysql_service}"; then
    return 1
  fi
  
  # 2. ネットワーク名取得
  local network_name
  network_name="$(get_docker_network_name "${mysql_service}")"
  
  # 3. MySQL接続確認（migrate, test実行と同じ接続方法でチェック）
  local db_password="${DB_PASSWORD:-password}"
  if ! wait_for_mysql "${mysql_service}" "root" "${db_password}" "${network_name}"; then
    echo "❌ エラー: ${mysql_service}への接続に失敗しました"
    return 1
  fi
  
  # 4. マイグレーション実行（スキップオプションが指定されていない場合のみ）
  if [ "${skip_migration}" != "true" ]; then
    # マイグレーションが失敗しても続行（既にマイグレーション済みの可能性があるため）
    if ! run_migration "${mysql_service}" "root" "${db_password}" "${db_name}"; then
      echo "⚠️  警告: マイグレーションの実行に失敗しましたが、続行します（既にマイグレーション済みの可能性があります）"
    fi
  fi
  
  # 5. バックエンドイメージ取得/構築
  local backend_image
  backend_image="$(ensure_backend_image)"
  if [ $? -ne 0 ]; then
    return 1
  fi
  
  # 6. テスト実行
  run_backend_test "${cmd}" "${redis_service}" "${mysql_service}" "${db_name}" "${network_name}" "${backend_image}" "${db_password}"
}

# ユニットテスト実行関数
run_unit_test() {
  echo "📝 ユニットテストを実行中..."
  # 現在のRepository実装はインメモリだが、将来的にデータベース接続に移行する予定のため
  # マイグレーションも実行しておく（テストの一貫性と将来の変更への備え）
  run_test_in_docker "pnpm run test" "redis-test" "mysql-test" "mrwebdefence_test" "false"
}

# ウォッチモードテスト実行関数
run_watch_test() {
  echo "👀 ウォッチモードでテストを実行中..."
  run_test_in_docker "pnpm run test:watch" "redis-test" "mysql-test" "mrwebdefence_test"
}

# カバレッジレポート生成関数
run_coverage_test() {
  echo "📊 カバレッジレポートを生成中..."
  run_test_in_docker "pnpm run test:cov" "redis-test" "mysql-test" "mrwebdefence_test"
}

# E2Eテスト実行関数
run_e2e_test() {
  echo "🔗 E2Eテストを実行中..."
  run_test_in_docker "pnpm run test:e2e" "redis-e2e" "mysql-e2e" "mrwebdefence_e2e"
}

# 全テスト実行関数
run_all_tests() {
  # ユニットテストはカバレッジレポート生成時に実行されるため重複を避ける
  echo "📊 カバレッジレポートを生成中 (ユニットテスト含む)..."
  run_test_in_docker "pnpm run test:cov" "redis-test" "mysql-test" "mrwebdefence_test"
  
  echo ""
  echo "🔗 E2Eテストを実行中..."
  # redis-testとmysql-testを停止してredis-e2eとmysql-e2eを起動（リソース節約）
  $DOCKER_COMPOSE stop redis-test mysql-test
  run_test_in_docker "pnpm run test:e2e" "redis-e2e" "mysql-e2e" "mrwebdefence_e2e"
}

case "${TEST_TYPE}" in
  "unit"|"test")
    run_unit_test
    ;;
  "watch")
    run_watch_test
    ;;
  "cov"|"coverage")
    run_coverage_test
    ;;
  "e2e")
    run_e2e_test
    ;;
  "all")
    run_all_tests
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
