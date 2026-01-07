#!/bin/bash
# Jira Issueのタイトルを更新するスクリプト

set -e

ISSUE_KEY="$1"
NEW_TITLE="$2"

if [ -z "$ISSUE_KEY" ] || [ -z "$NEW_TITLE" ]; then
  echo "使用方法: $0 <ISSUE_KEY> <NEW_TITLE>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

UPDATE_DATA=$(jq -n \
  --arg title "$NEW_TITLE" \
  '{
    fields: {
      summary: $title
    }
  }')

echo "📝 タイトルを更新中: ${ISSUE_KEY}"
RESPONSE=$(jira_api_call "PUT" "issue/${ISSUE_KEY}" "$UPDATE_DATA")

if [ $? -eq 0 ]; then
  echo "✅ タイトルを更新しました"
else
  echo "❌ エラー: タイトル更新に失敗しました" >&2
  handle_jira_error "$RESPONSE"
  exit 1
fi
