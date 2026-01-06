#!/bin/bash

# Docker Composeサービス停止スクリプト
# 
# 使用方法:
#   ./scripts/docker/stop.sh [オプション]
#
# オプション:
#   -v, --volumes    ボリュームも削除
#   -h, --help       このヘルプを表示

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
REMOVE_VOLUMES=false

# ヘルプ表示
show_help() {
  cat << EOF
Docker Composeサービス停止スクリプト

使用方法:
  $0 [オプション]

オプション:
  -v, --volumes  ボリュームも削除（データが失われます）
  -h, --help     このヘルプを表示

例:
  $0              # サービスを停止（ボリュームは保持）
  $0 -v           # サービスを停止し、ボリュームも削除
EOF
}

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--volumes)
      REMOVE_VOLUMES=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "❌ エラー: 不明なオプション: $1" >&2
      show_help
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

# Docker Composeファイルの存在確認
if [ ! -f "docker-compose.yml" ]; then
  echo "❌ エラー: docker-compose.yml が見つかりません" >&2
  exit 1
fi

echo "=================================================================================="
echo "Docker Composeサービス停止"
echo "=================================================================================="
echo ""

# 実行中のサービスを確認
RUNNING_SERVICES=$(docker-compose ps -q 2>/dev/null || true)

if [ -z "$RUNNING_SERVICES" ]; then
  echo "ℹ️  実行中のサービスはありません"
  echo ""
  exit 0
fi

echo "📋 実行中のサービス:"
docker-compose ps
echo ""

# サービスを停止
if [ "$REMOVE_VOLUMES" = true ]; then
  echo "🛑 サービスを停止し、ボリュームも削除中..."
  echo "   ⚠️  警告: ボリューム内のデータが削除されます"
  docker-compose down -v
  echo ""
  echo "✅ サービスを停止し、ボリュームを削除しました"
else
  echo "🛑 サービスを停止中..."
  docker-compose down
  echo ""
  echo "✅ サービスを停止しました"
  echo ""
  echo "💡 ボリュームも削除するには:"
  echo "   ./scripts/docker/stop.sh -v"
fi

echo ""
echo "=================================================================================="

