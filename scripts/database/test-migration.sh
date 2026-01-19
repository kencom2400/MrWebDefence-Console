#!/bin/bash

# マイグレーション動作確認用テストスクリプト
# 
# このスクリプトは、Flywayの動作確認を行うためのテストです。
# 実際のマイグレーションファイルが存在しない場合でも、設定ファイルやスクリプトの動作を確認できます。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# カラー出力用の定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
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

log_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# プロジェクトルートに移動
cd "${PROJECT_ROOT}"

log_section "マイグレーション動作確認テスト"

# 1. Flyway CLIの確認
log_section "1. Flyway CLIの確認"
if command -v flyway > /dev/null 2>&1; then
    FLYWAY_VERSION=$(flyway --version 2>&1 | head -1)
    log_info "Flyway CLIが見つかりました: ${FLYWAY_VERSION}"
else
    log_error "Flyway CLIが見つかりません"
    log_info "インストール方法（macOS）:"
    log_info "  brew install flyway"
    exit 1
fi

# 2. ディレクトリ構造の確認
log_section "2. ディレクトリ構造の確認"
MIGRATION_DIR="${PROJECT_ROOT}/apps/backend/src/db/migration"
SEED_DIR="${PROJECT_ROOT}/apps/backend/src/db/seed"

if [ -d "${MIGRATION_DIR}" ]; then
    log_info "✓ migrationディレクトリが存在します: ${MIGRATION_DIR}"
    MIGRATION_COUNT=$(find "${MIGRATION_DIR}" -name "V*.sql" 2>/dev/null | wc -l | tr -d ' ')
    log_info "  マイグレーションファイル数: ${MIGRATION_COUNT}"
else
    log_error "✗ migrationディレクトリが見つかりません: ${MIGRATION_DIR}"
    exit 1
fi

if [ -d "${SEED_DIR}" ]; then
    log_info "✓ seedディレクトリが存在します: ${SEED_DIR}"
    SEED_COUNT=$(find "${SEED_DIR}" -name "R*.sql" 2>/dev/null | wc -l | tr -d ' ')
    log_info "  シードファイル数: ${SEED_COUNT}"
else
    log_error "✗ seedディレクトリが見つかりません: ${SEED_DIR}"
    exit 1
fi

# 3. Flyway設定ファイルの確認
log_section "3. Flyway設定ファイルの確認"
FLYWAY_CONF="${PROJECT_ROOT}/apps/backend/flyway.conf"
if [ -f "${FLYWAY_CONF}" ]; then
    log_info "✓ Flyway設定ファイルが存在します: ${FLYWAY_CONF}"
    
    # 設定ファイルの内容を確認（環境変数は展開されない）
    if grep -q "flyway.locations" "${FLYWAY_CONF}"; then
        log_info "  ✓ locations設定が確認されました"
    else
        log_warn "  ⚠ locations設定が見つかりません"
    fi
else
    log_error "✗ Flyway設定ファイルが見つかりません: ${FLYWAY_CONF}"
    exit 1
fi

# 4. スクリプトの確認
log_section "4. スクリプトの確認"
MIGRATE_SCRIPT="${PROJECT_ROOT}/scripts/database/migrate.sh"
INIT_SCRIPT="${PROJECT_ROOT}/scripts/database/init-database.sh"

if [ -f "${MIGRATE_SCRIPT}" ] && [ -x "${MIGRATE_SCRIPT}" ]; then
    log_info "✓ migrate.shが存在し、実行可能です"
else
    log_error "✗ migrate.shが見つからないか、実行権限がありません"
    exit 1
fi

if [ -f "${INIT_SCRIPT}" ] && [ -x "${INIT_SCRIPT}" ]; then
    log_info "✓ init-database.shが存在し、実行可能です"
else
    log_error "✗ init-database.shが見つからないか、実行権限がありません"
    exit 1
fi

# 5. package.jsonの確認
log_section "5. package.jsonの確認"
PACKAGE_JSON="${PROJECT_ROOT}/apps/backend/package.json"
if [ -f "${PACKAGE_JSON}" ]; then
    if grep -q '"migrate"' "${PACKAGE_JSON}"; then
        log_info "✓ package.jsonにmigrateスクリプトが定義されています"
    else
        log_warn "  ⚠ package.jsonにmigrateスクリプトが見つかりません"
    fi
    
    if grep -q '"db:init"' "${PACKAGE_JSON}"; then
        log_info "✓ package.jsonにdb:initスクリプトが定義されています"
    else
        log_warn "  ⚠ package.jsonにdb:initスクリプトが見つかりません"
    fi
else
    log_error "✗ package.jsonが見つかりません"
    exit 1
fi

# 6. 環境変数の確認（オプション）
log_section "6. 環境変数の確認"
if [ -f "${PROJECT_ROOT}/.env" ]; then
    log_info "✓ .envファイルが存在します"
    if grep -q "DB_" "${PROJECT_ROOT}/.env"; then
        log_info "  ✓ データベース関連の環境変数が設定されています"
    else
        log_warn "  ⚠ データベース関連の環境変数が見つかりません"
    fi
else
    log_warn "  ⚠ .envファイルが存在しません（オプション）"
    log_info "  データベース接続情報は環境変数またはコマンドライン引数で指定できます"
fi

# 7. マイグレーションファイルの確認
log_section "7. マイグレーションファイルの確認"
if [ "${MIGRATION_COUNT}" -eq 0 ]; then
    log_warn "  ⚠ マイグレーションファイルがまだ存在しません"
    log_info "  MrWebDefence-Designリポジトリからマイグレーションファイルを移設してください"
    log_info "  移設コマンド:"
    log_info "    cp ../MrWebDefence-Design/db-resources/migration/* apps/backend/src/db/migration/"
else
    log_info "✓ ${MIGRATION_COUNT}個のマイグレーションファイルが見つかりました"
fi

if [ "${SEED_COUNT}" -eq 0 ]; then
    log_warn "  ⚠ シードファイルがまだ存在しません（オプション）"
else
    log_info "✓ ${SEED_COUNT}個のシードファイルが見つかりました"
fi

# 完了メッセージ
log_section "テスト完了"
log_info "✓ すべての基本チェックが完了しました"
log_info ""
log_info "次のステップ:"
log_info "  1. Flyway CLIがインストールされていることを確認"
log_info "  2. データベース接続情報を設定（.envファイルまたは環境変数）"
log_info "  3. MrWebDefence-Designからマイグレーションファイルを移設"
log_info "  4. マイグレーション実行: pnpm backend:migrate"
log_info ""
log_info "詳細は docs/development/schema-management.md を参照してください"
