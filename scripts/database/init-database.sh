#!/bin/bash

# データベース初期化スクリプト（ラッパー）
# 
# このスクリプトは、統合スクリプト `migrate.sh init` のラッパーです。
# 後方互換性のため残していますが、今後は `./scripts/database/migrate.sh init` を直接使用することを推奨します。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 統合スクリプトを実行
exec "${SCRIPT_DIR}/migrate.sh" init "$@"
