#!/bin/bash

# データベース初期化スクリプト
# MySQL 8.4系のデータベースを初期化し、utf8mb4文字コードを設定し、Flywayマイグレーションを実行します。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 共通関数を読み込む
source "${SCRIPT_DIR}/common.sh"

# デフォルト値
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-mrwebdefence}"
INCLUDE_SEED="${INCLUDE_SEED:-false}"

# ヘルプメッセージ
show_help() {
    cat << EOF
データベース初期化スクリプト

使用方法:
  $0 [オプション]

オプション:
  -h, --host HOST         データベースホスト (デフォルト: localhost)
  -P, --port PORT         データベースポート (デフォルト: 3306)
  -u, --user USER         データベースユーザー (デフォルト: root)
  -p, --password PASSWORD データベースパスワード
  -d, --database NAME     データベース名 (デフォルト: mrwebdefence)
  -s, --seed              初期データ投入を含める
  --help                  このヘルプメッセージを表示

環境変数:
  DB_HOST                 データベースホスト
  DB_PORT                 データベースポート
  DB_USER                 データベースユーザー
  DB_PASSWORD             データベースパスワード
  DB_NAME                 データベース名
  INCLUDE_SEED            初期データ投入を含める (true/false)

例:
  # 基本的な初期化（初期データ投入なし）
  $0 -h localhost -u root -p password -d mrwebdefence

  # 初期データ投入を含む初期化
  $0 -h localhost -u root -p password -d mrwebdefence --seed

  # 環境変数を使用
  DB_HOST=localhost DB_USER=root DB_PASSWORD=password $0
EOF
}

# 引数解析
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--host)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    echo -e "${RED}エラー: オプション '$1' には引数が必要です。${NC}" >&2
                    show_help
                    exit 1
                fi
                DB_HOST="$2"
                shift 2
                ;;
            -P|--port)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    echo -e "${RED}エラー: オプション '$1' には引数が必要です。${NC}" >&2
                    show_help
                    exit 1
                fi
                DB_PORT="$2"
                shift 2
                ;;
            -u|--user)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    echo -e "${RED}エラー: オプション '$1' には引数が必要です。${NC}" >&2
                    show_help
                    exit 1
                fi
                DB_USER="$2"
                shift 2
                ;;
            -p|--password)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    echo -e "${RED}エラー: オプション '$1' には引数が必要です。${NC}" >&2
                    show_help
                    exit 1
                fi
                DB_PASSWORD="$2"
                shift 2
                ;;
            -d|--database)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    echo -e "${RED}エラー: オプション '$1' には引数が必要です。${NC}" >&2
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
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}エラー: 不明なオプション: $1${NC}" >&2
                show_help
                exit 1
                ;;
        esac
    done
}

# 共通関数は common.sh から読み込まれるため、ここでは定義しない

# Flywayマイグレーション実行
run_flyway_migration() {
    log_info "Flywayマイグレーションを実行中..."
    
    # プロジェクトルートに移動
    cd "${PROJECT_ROOT}"
    
    # マイグレーションファイルの配置場所（filesystem:を使用）
    local locations="filesystem:apps/backend/src/db/migration"
    if [ "${INCLUDE_SEED}" = "true" ]; then
        locations="${locations},filesystem:apps/backend/src/db/seed"
        log_info "初期データ投入を含むマイグレーションを実行します"
    else
        log_info "通常のマイグレーションを実行します（初期データ投入なし）"
    fi
    
    # Flywayコマンドの実行
    if command -v flyway > /dev/null 2>&1; then
        flyway migrate \
            -configFiles=apps/backend/flyway.conf \
            -url="jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&allowPublicKeyRetrieval=true" \
            -user="${DB_USER}" \
            -password="${DB_PASSWORD}" \
            -locations="${locations}"
        log_info "Flywayマイグレーション実行完了"
    else
        log_error "Flyway CLIが見つかりません。Flyway CLIをインストールしてください。"
        log_info "インストール方法（macOS）:"
        log_info "  brew install flyway"
        log_info "または、公式サイトからダウンロード:"
        log_info "  https://flywaydb.org/documentation/usage/commandline/"
        exit 1
    fi
}

# メイン処理
main() {
    parse_args "$@"
    
    log_info "データベース初期化を開始します"
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
    
    # mysqlとflywayコマンドにパスワードを安全に渡すために環境変数にエクスポートします
    export MYSQL_PWD="${DB_PASSWORD}"
    export FLYWAY_PASSWORD="${DB_PASSWORD}"
    
    if ! check_mysql_connection "${DB_HOST}" "${DB_PORT}" "${DB_USER}"; then
        exit 1
    fi
    create_database "${DB_HOST}" "${DB_PORT}" "${DB_USER}" "${DB_NAME}"
    if ! check_utf8mb4_config "${DB_HOST}" "${DB_PORT}" "${DB_USER}" "${DB_NAME}"; then
        exit 1
    fi
    run_flyway_migration
    
    log_info "データベース初期化が完了しました"
}

# スクリプト実行
main "$@"
