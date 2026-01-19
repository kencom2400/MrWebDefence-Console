#!/bin/bash

# Flywayマイグレーション統合スクリプト
# 
# このスクリプトは、データベース初期化、マイグレーション実行、その他のFlyway操作を統合的に実行します。
# 環境変数またはflyway.confファイルから設定を読み込みます。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 共通関数を読み込む
source "${SCRIPT_DIR}/common.sh"

# カラー出力用の定義（log_section用）
# NCはcommon.shで既に定義されているため、ここでは定義しない
readonly BLUE='\033[0;34m'

log_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# プロジェクトルートに移動
cd "${PROJECT_ROOT}"

# 環境変数の読み込み
if [ -f .env ]; then
    log_info ".envファイルから環境変数を読み込み中..."
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# デフォルト値
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-mrwebdefence}"
INCLUDE_SEED="${INCLUDE_SEED:-false}"

# Flyway設定ファイルのパス
FLYWAY_CONF="${PROJECT_ROOT}/apps/backend/flyway.conf"

# ヘルプメッセージ
show_help() {
    cat << EOF
Flywayマイグレーション統合スクリプト

使用方法:
  $0 <コマンド> [オプション]

コマンド:
  init             データベース初期化（データベース作成 + マイグレーション実行）
  migrate          マイグレーション実行（既存データベースに対して）
  info             マイグレーション情報の表示
  clean            データベースをクリーンアップ（全データ削除）
  validate         マイグレーションファイルの検証
  baseline         ベースラインを作成
  test             動作確認テスト（設定チェック）

オプション（initコマンド用）:
  -h, --host HOST         データベースホスト (デフォルト: localhost)
  -P, --port PORT         データベースポート (デフォルト: 3306)
  -u, --user USER         データベースユーザー (デフォルト: root)
  -p, --password PASSWORD データベースパスワード
  -d, --database NAME     データベース名 (デフォルト: mrwebdefence)
  -s, --seed              初期データ投入を含める

環境変数:
  DB_HOST                 データベースホスト
  DB_PORT                 データベースポート
  DB_USER                 データベースユーザー
  DB_PASSWORD             データベースパスワード
  DB_NAME                 データベース名
  INCLUDE_SEED            初期データ投入を含める (true/false)

例:
  # データベース初期化
  $0 init -h localhost -u root -p password -d mrwebdefence

  # マイグレーション実行
  $0 migrate

  # マイグレーション情報の確認
  $0 info

  # データベースクリーンアップ
  $0 clean
EOF
}

# 共通関数は common.sh から読み込まれるため、ここでは定義しない

# Flyway CLIの確認
check_flyway_cli() {
    if ! command -v flyway > /dev/null 2>&1; then
        log_error "Flyway CLIが見つかりません。"
        log_info "インストール方法（macOS）:"
        log_info "  brew install flyway"
        log_info "または、公式サイトからダウンロード:"
        log_info "  https://flywaydb.org/documentation/usage/commandline/"
        exit 1
    fi
}

# Flyway設定ファイルの確認
check_flyway_config() {
    if [ ! -f "${FLYWAY_CONF}" ]; then
        log_error "Flyway設定ファイルが見つかりません: ${FLYWAY_CONF}"
        exit 1
    fi
}

# データベース初期化（initコマンド）
cmd_init() {
    log_section "データベース初期化"
    
    # 引数解析
    parse_init_args "$@"
    
    log_info "データベース: ${DB_NAME}"
    log_info "ホスト: ${DB_HOST}:${DB_PORT}"
    log_info "ユーザー: ${DB_USER}"
    log_info "初期データ投入: ${INCLUDE_SEED}"
    
    # 必須パラメータチェック
    if [ -z "${DB_PASSWORD}" ]; then
        log_error "データベースパスワードが指定されていません"
        log_info "環境変数 DB_PASSWORD を設定するか、-p オプションで指定してください"
        exit 1
    fi
    
    # mysqlとflywayコマンドにパスワードを安全に渡すために環境変数にエクスポート
    export MYSQL_PWD="${DB_PASSWORD}"
    export FLYWAY_PASSWORD="${DB_PASSWORD}"
    
    check_flyway_cli
    check_flyway_config
    if ! check_mysql_connection "${DB_HOST}" "${DB_PORT}" "${DB_USER}"; then
        exit 1
    fi
    create_database "${DB_HOST}" "${DB_PORT}" "${DB_USER}" "${DB_NAME}"
    if ! check_utf8mb4_config "${DB_HOST}" "${DB_PORT}" "${DB_USER}" "${DB_NAME}"; then
        exit 1
    fi
    
    # Flywayマイグレーション実行
    log_info "Flywayマイグレーションを実行中..."
    
    local locations="filesystem:apps/backend/src/db/migration"
    if [ "${INCLUDE_SEED}" = "true" ]; then
        locations="${locations},filesystem:apps/backend/src/db/seed"
        log_info "初期データ投入を含むマイグレーションを実行します"
    else
        log_info "通常のマイグレーションを実行します（初期データ投入なし）"
    fi
    
    flyway migrate \
        -configFiles="${FLYWAY_CONF}" \
        -url="jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&allowPublicKeyRetrieval=true" \
        -user="${DB_USER}" \
        -password="${DB_PASSWORD}" \
        -locations="${locations}"
    
    log_info "✅ データベース初期化が完了しました"
}

# initコマンドの引数解析
parse_init_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--host)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    log_error "オプション '$1' には引数が必要です" >&2
                    show_help
                    exit 1
                fi
                DB_HOST="$2"
                shift 2
                ;;
            -P|--port)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    log_error "オプション '$1' には引数が必要です" >&2
                    show_help
                    exit 1
                fi
                DB_PORT="$2"
                shift 2
                ;;
            -u|--user)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    log_error "オプション '$1' には引数が必要です" >&2
                    show_help
                    exit 1
                fi
                DB_USER="$2"
                shift 2
                ;;
            -p|--password)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    log_error "オプション '$1' には引数が必要です" >&2
                    show_help
                    exit 1
                fi
                DB_PASSWORD="$2"
                shift 2
                ;;
            -d|--database)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    log_error "オプション '$1' には引数が必要です" >&2
                    show_help
                    exit 1
                fi
                DB_NAME="$2"
                shift 2
                ;;
            -s|--seed)
                INCLUDE_SEED="true"
                shift
                ;;
            *)
                log_error "不明なオプション: $1" >&2
                show_help
                exit 1
                ;;
        esac
    done
}

# マイグレーション実行（migrateコマンド）
cmd_migrate() {
    log_section "マイグレーション実行"
    
    check_password
    check_flyway_cli
    check_flyway_config
    
    log_info "Flywayマイグレーションを実行します..."
    log_info "設定ファイル: ${FLYWAY_CONF}"
    
    # Flywayの実行
    flyway -configFiles="${FLYWAY_CONF}" migrate
    
    log_info "✅ マイグレーションが完了しました"
}

# マイグレーション情報表示（infoコマンド）
cmd_info() {
    log_section "マイグレーション情報"
    
    check_password
    check_flyway_cli
    check_flyway_config
    
    flyway -configFiles="${FLYWAY_CONF}" info
}

# データベースクリーンアップ（cleanコマンド）
cmd_clean() {
    log_section "データベースクリーンアップ"
    
    log_warn "⚠️  警告: この操作はデータベース内の全データを削除します"
    log_warn "続行しますか？ (yes/no)"
    read -r confirmation
    
    if [ "${confirmation}" != "yes" ]; then
        log_info "操作をキャンセルしました"
        exit 0
    fi
    
    check_password
    check_flyway_cli
    check_flyway_config
    
    flyway -configFiles="${FLYWAY_CONF}" clean
    
    log_info "✅ データベースクリーンアップが完了しました"
}

# マイグレーションファイル検証（validateコマンド）
cmd_validate() {
    log_section "マイグレーションファイル検証"
    
    check_password
    check_flyway_cli
    check_flyway_config
    
    flyway -configFiles="${FLYWAY_CONF}" validate
    
    log_info "✅ マイグレーションファイルの検証が完了しました"
}

# ベースライン作成（baselineコマンド）
cmd_baseline() {
    log_section "ベースライン作成"
    
    check_password
    check_flyway_cli
    check_flyway_config
    
    flyway -configFiles="${FLYWAY_CONF}" baseline
    
    log_info "✅ ベースラインの作成が完了しました"
}

# 動作確認テスト（testコマンド）
cmd_test() {
    log_section "動作確認テスト"
    
    # Flyway CLIの確認
    if command -v flyway > /dev/null 2>&1; then
        FLYWAY_VERSION=$(flyway --version 2>&1 | head -1)
        log_info "✓ Flyway CLIが見つかりました: ${FLYWAY_VERSION}"
    else
        log_error "✗ Flyway CLIが見つかりません"
        exit 1
    fi
    
    # ディレクトリ構造の確認
    MIGRATION_DIR="${PROJECT_ROOT}/apps/backend/src/db/migration"
    SEED_DIR="${PROJECT_ROOT}/apps/backend/src/db/seed"
    
    if [ -d "${MIGRATION_DIR}" ]; then
        log_info "✓ migrationディレクトリが存在します"
        MIGRATION_COUNT=$(find "${MIGRATION_DIR}" -name "V*.sql" 2>/dev/null | wc -l | tr -d ' ')
        log_info "  マイグレーションファイル数: ${MIGRATION_COUNT}"
    else
        log_error "✗ migrationディレクトリが見つかりません"
        exit 1
    fi
    
    if [ -d "${SEED_DIR}" ]; then
        log_info "✓ seedディレクトリが存在します"
        SEED_COUNT=$(find "${SEED_DIR}" -name "R*.sql" 2>/dev/null | wc -l | tr -d ' ')
        log_info "  シードファイル数: ${SEED_COUNT}"
    else
        log_error "✗ seedディレクトリが見つかりません"
        exit 1
    fi
    
    # Flyway設定ファイルの確認
    if [ -f "${FLYWAY_CONF}" ]; then
        log_info "✓ Flyway設定ファイルが存在します"
    else
        log_error "✗ Flyway設定ファイルが見つかりません"
        exit 1
    fi
    
    log_info "✅ すべての基本チェックが完了しました"
}

# メイン処理
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    COMMAND=$1
    shift
    
    case "${COMMAND}" in
        init)
            cmd_init "$@"
            ;;
        migrate)
            cmd_migrate
            ;;
        info)
            cmd_info
            ;;
        clean)
            cmd_clean
            ;;
        validate)
            cmd_validate
            ;;
        baseline)
            cmd_baseline
            ;;
        test)
            cmd_test
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "不明なコマンド: ${COMMAND}"
            show_help
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"
