#!/bin/bash

# マイグレーション動作確認用テストスクリプト（ラッパー）
# 
# このスクリプトは、統合スクリプト `migrate.sh test` のラッパーです。
# 後方互換性のため残していますが、今後は `./scripts/database/migrate.sh test` を直接使用することを推奨します。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# 統合スクリプトを実行
exec "${SCRIPT_DIR}/migrate.sh" test "$@"
