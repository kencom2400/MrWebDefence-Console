#!/bin/bash

# API動作確認スクリプト
# 
# サーバーを起動し、ログインAPIの動作を確認します。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# 環境変数の設定
PORT="${PORT:-3001}"
BASE_URL="http://localhost:${PORT}"

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
  echo "📦 依存関係をインストール中..."
  pnpm install
fi

# テスト用ユーザーの確認
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-password123}"

echo "🧪 API動作確認を開始します..."
echo "   URL: ${BASE_URL}"
echo "   Test User: ${TEST_USER_EMAIL}"
echo ""

# サーバーをバックグラウンドで起動
echo "🚀 サーバーを起動中..."
pnpm run start:dev > /tmp/backend-server.log 2>&1 &
SERVER_PID=$!

# サーバーの起動を待機
echo "⏳ サーバーの起動を待機中..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s -f "${BASE_URL}/api/v1/auth/login" > /dev/null 2>&1; then
    echo "✅ サーバーが起動しました"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
    echo "   待機中... (${RETRY_COUNT}/${MAX_RETRIES})"
  fi
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ サーバーの起動に失敗しました（タイムアウト）"
  echo "ログを確認: tail -20 /tmp/backend-server.log"
  tail -20 /tmp/backend-server.log 2>/dev/null || echo "ログファイルが見つかりません"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# テスト用ユーザーが存在するか確認（存在しない場合は作成）
echo ""
echo "👤 テスト用ユーザーを確認中..."
if [ ! -f "data/users.json" ] || ! grep -q "${TEST_USER_EMAIL}" "data/users.json" 2>/dev/null; then
  echo "   テスト用ユーザーが存在しないため、作成します..."
  "${SCRIPT_DIR}/create-test-user.sh" "${TEST_USER_EMAIL}" "${TEST_USER_PASSWORD}"
fi

# APIテスト
echo ""
echo "📝 ログインAPIをテスト中..."

# 正常系: ログイン成功
echo "   1. 正常系: ログイン成功"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASSWORD}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ ログイン成功 (HTTP ${HTTP_CODE})"
  ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  if [ -n "$ACCESS_TOKEN" ]; then
    echo "   ✅ JWTトークンを取得しました"
    echo "   Token: ${ACCESS_TOKEN:0:50}..."
  else
    echo "   ⚠️  JWTトークンが見つかりません"
  fi
else
  echo "   ❌ ログイン失敗 (HTTP ${HTTP_CODE})"
  echo "   Response: ${BODY}"
fi

# 異常系: 間違ったパスワード
echo ""
echo "   2. 異常系: 間違ったパスワード"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"wrongpassword\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ 認証エラー (HTTP ${HTTP_CODE})"
else
  echo "   ❌ 期待したエラーが返されませんでした (HTTP ${HTTP_CODE})"
  echo "   Response: ${BODY}"
fi

# 異常系: バリデーションエラー
echo ""
echo "   3. 異常系: バリデーションエラー（無効なメールアドレス）"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email\",\"password\":\"${TEST_USER_PASSWORD}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo "   ✅ バリデーションエラー (HTTP ${HTTP_CODE})"
else
  echo "   ❌ 期待したエラーが返されませんでした (HTTP ${HTTP_CODE})"
  echo "   Response: ${BODY}"
fi

# サーバーを停止
echo ""
echo "🛑 サーバーを停止中..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "✅ API動作確認が完了しました"

