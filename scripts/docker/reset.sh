#!/bin/bash

# Docker Compose環境リセットスクリプト
# 
# 使用方法:
#   ./scripts/docker/reset.sh [オプション]
#
# オプション:
#   -f, --force    確認なしで実行
#   -h, --help     このヘルプを表示

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# デフォルト値
FORCE=false

# ヘルプ表示
show_help() {
  cat << EOF
Docker Compose環境リセットスクリプト

このスクリプトは以下を実行します:
  1. 実行中のサービスを停止
  2. ボリュームを削除（データが失われます）
  3. イメージを再ビルド
  4. サービスを起動

使用方法:
  $0 [オプション]

オプション:
  -f, --force  確認なしで実行
  -h, --help   このヘルプを表示

例:
  $0           # 確認プロンプトを表示してリセット
  $0 -f        # 確認なしでリセット
EOF
}

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--force)
      FORCE=true
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
echo "Docker Compose環境リセット"
echo "=================================================================================="
echo ""

# 確認プロンプト
if [ "$FORCE" = false ]; then
  echo "⚠️  警告: この操作により以下が実行されます:"
  echo "   1. 実行中のサービスを停止"
  echo "   2. ボリュームを削除（データが失われます）"
  echo "   3. イメージを再ビルド"
  echo "   4. サービスを起動"
  echo ""
  read -p "続行しますか？ (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ リセットをキャンセルしました"
    exit 0
  fi
  echo ""
fi

# 1. サービスを停止
echo "🛑 ステップ 1/4: サービスを停止中..."
docker-compose down -v 2>/dev/null || true
echo "✅ サービスを停止しました"
echo ""

# 2. ボリュームを削除（既にdown -vで削除済み）
echo "🗑️  ステップ 2/4: ボリュームを削除中..."
# 念のため、残っているボリュームを確認して削除
docker volume ls | grep -E "mrwebdefence|$(basename "$PROJECT_ROOT")" | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || true
echo "✅ ボリュームを削除しました"
echo ""

# 3. イメージを再ビルド
echo "🔨 ステップ 3/4: イメージを再ビルド中..."
docker-compose build --no-cache
echo "✅ イメージを再ビルドしました"
echo ""

# 4. サービスを起動
echo "🚀 ステップ 4/4: サービスを起動中..."
docker-compose up -d
echo "✅ サービスを起動しました"
echo ""

echo "📋 実行中のサービス:"
docker-compose ps
echo ""

echo "📝 ログを確認するには:"
echo "   docker-compose logs -f backend"
echo ""

echo "=================================================================================="
echo "✅ 環境リセットが完了しました"
echo "=================================================================================="

