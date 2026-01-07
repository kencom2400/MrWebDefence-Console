#!/bin/bash
# Jira Issueにコメントを追加するスクリプト

set -e

ISSUE_KEY="$1"
COMMENT="$2"

if [ -z "$ISSUE_KEY" ] || [ -z "$COMMENT" ]; then
  echo "使用方法: $0 <ISSUE_KEY> <COMMENT>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

# コメント用のJSONデータ（Atlassian Document Format）
COMMENT_DATA=$(jq -n \
  --arg body "$COMMENT" \
  '{
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: $body
            }
          ]
        }
      ]
    }
  }')

echo "📝 コメントを追加中..."
RESPONSE=$(jira_api_call "POST" "issue/${ISSUE_KEY}/comment" "$COMMENT_DATA")

if [ $? -eq 0 ]; then
  echo "✅ コメント追加成功"
else
  echo "❌ エラー: コメント追加に失敗しました" >&2
  handle_jira_error "$RESPONSE"
  exit 1
fi
