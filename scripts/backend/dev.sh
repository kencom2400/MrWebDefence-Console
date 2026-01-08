#!/bin/bash

# 開発サーバー起動スクリプト (Docker版)
# 
# Docker Composeを使用してバックエンド開発サーバーとRedisを起動します。
# 開発用Redis (redis-dev) も自動的に起動します。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🚀 開発サーバーを起動します (Docker)..."
echo "   構成: Backend + Redis (dev)"
echo ""

# プロジェクトルートに移動
cd "${PROJECT_ROOT}"

# Docker Composeの確認
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "❌ エラー: docker-compose または docker compose が見つかりません"
  exit 1
fi

# サービスを起動
# backendはdepends_onでredis-devに依存しているため、自動的にredis-devも起動します
echo "🔄 Docker Composeでサービスを起動中..."
echo "   URL: http://localhost:3001"
echo "   (Ctrl+C で停止)"
echo ""

# docker-compose コマンドの互換性チェック
if command -v docker-compose &> /dev/null; then
  docker-compose up backend
else
  docker compose up backend
fi
