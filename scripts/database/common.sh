#!/bin/bash

# データベーススクリプト共通関数
# 
# このファイルには、データベース関連スクリプトで共通に使用される関数を定義します。
# 各スクリプトから `source` コマンドで読み込んで使用します。

# カラー出力用の定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# MySQL接続確認
check_mysql_connection() {
    local db_host="${1:-${DB_HOST:-localhost}}"
    local db_port="${2:-${DB_PORT:-3306}}"
    local db_user="${3:-${DB_USER:-root}}"
    
    log_info "MySQL接続を確認中..."
    # MYSQL_PWD環境変数を使用してパスワードを渡す
    if [ -n "${DB_PASSWORD:-}" ]; then
        export MYSQL_PWD="${DB_PASSWORD}"
    fi
    if ! mysql -h"${db_host}" -P"${db_port}" -u"${db_user}" -e "SELECT 1;" > /dev/null 2>&1; then
        log_error "MySQLへの接続に失敗しました"
        return 1
    fi
    log_info "MySQL接続確認完了"
    return 0
}

# データベース作成
create_database() {
    local db_host="${1:-${DB_HOST:-localhost}}"
    local db_port="${2:-${DB_PORT:-3306}}"
    local db_user="${3:-${DB_USER:-root}}"
    local db_name="${4:-${DB_NAME:-mrwebdefence}}"
    
    log_info "データベース '${db_name}' を作成中..."
    mysql -h"${db_host}" -P"${db_port}" -u"${db_user}" <<EOF
CREATE DATABASE IF NOT EXISTS \`${db_name}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
EOF
    log_info "データベース '${db_name}' 作成完了"
}

# utf8mb4文字コード設定確認
check_utf8mb4_config() {
    local db_host="${1:-${DB_HOST:-localhost}}"
    local db_port="${2:-${DB_PORT:-3306}}"
    local db_user="${3:-${DB_USER:-root}}"
    local db_name="${4:-${DB_NAME:-mrwebdefence}}"
    
    log_info "utf8mb4文字コード設定を確認中..."
    # MYSQL_PWD環境変数を使用してパスワードを渡す
    if [ -n "${DB_PASSWORD:-}" ]; then
        export MYSQL_PWD="${DB_PASSWORD}"
    fi
    local charset
    local collation
    read -r charset collation <<< "$(mysql -h"${db_host}" -P"${db_port}" -u"${db_user}" "${db_name}" -N -e "SELECT @@character_set_database, @@collation_database;")"
    
    if [ "${charset}" != "utf8mb4" ]; then
        log_error "データベースの文字セットがutf8mb4ではありません: ${charset}"
        return 1
    fi
    
    if [ "${collation}" != "utf8mb4_unicode_ci" ]; then
        log_warn "データベースの照合順序がutf8mb4_unicode_ciではありません: ${collation}"
    fi
    
    log_info "utf8mb4文字コード設定確認完了 (charset: ${charset}, collation: ${collation})"
    return 0
}

# パスワードの必須チェック
check_password() {
    if [ -z "${DB_PASSWORD}" ]; then
        log_error "データベースパスワードが設定されていません。"
        log_info "環境変数 DB_PASSWORD を設定してください。"
        exit 1
    fi
    export FLYWAY_PASSWORD="${DB_PASSWORD}"
}
