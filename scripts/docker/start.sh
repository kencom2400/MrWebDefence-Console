#!/bin/bash

# Docker Composeサービス起動スクリプト
# 
# 使用方法:
#   ./scripts/docker/start.sh [オプション]
#
# オプション:
#   -d, --detach    バックグラウンドで起動（デフォルト）
#   -f, --foreground フォアグラウンドで起動（ログを表示）
#   -b, --build     イメージを再ビルドしてから起動
#   -h, --help      このヘルプを表示

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
DETACH=true
BUILD=false

# ヘルプ表示
show_help() {
  cat << EOF
Docker Composeサービス起動スクリプト

使用方法:
  $0 [オプション]

オプション:
  -d, --detach      バックグラウンドで起動（デフォルト）
  -f, --foreground  フォアグラウンドで起動（ログを表示）
  -b, --build       イメージを再ビルドしてから起動
  -h, --help        このヘルプを表示

例:
  $0                 # バックグラウンドで起動
  $0 -f              # フォアグラウンドで起動（ログ表示）
  $0 -b              # イメージを再ビルドしてから起動
  $0 -f -b           # 再ビルドしてフォアグラウンドで起動
EOF
}

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--detach)
      DETACH=true
      shift
      ;;
    -f|--foreground)
      DETACH=false
      shift
      ;;
    -b|--build)
      BUILD=true
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
echo "Docker Composeサービス起動"
echo "=================================================================================="
echo ""

# イメージを再ビルドする場合
if [ "$BUILD" = true ]; then
  echo "🔨 イメージを再ビルド中..."
  docker-compose build --no-cache
  echo ""
fi

# サービスを起動
if [ "$DETACH" = true ]; then
  echo "🚀 サービスをバックグラウンドで起動中..."
  docker-compose up -d
  
  echo ""
  echo "✅ サービスを起動しました"
  echo ""
  echo "📋 実行中のサービス:"
  docker-compose ps
  echo ""
  echo "📝 ログを確認するには:"
  echo "   docker-compose logs -f backend"
  echo ""
  echo "🛑 サービスを停止するには:"
  echo "   ./scripts/docker/stop.sh"
else
  echo "🚀 サービスをフォアグラウンドで起動中..."
  echo "   （Ctrl+Cで停止）"
  echo ""
  docker-compose up
fi

echo "=================================================================================="

