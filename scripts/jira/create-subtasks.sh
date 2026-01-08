#!/bin/bash
# 親Issueのサブタスクを作成するスクリプト

set -e

PARENT_ISSUE_KEY="$1"
REPOSITORIES="$2"

if [ -z "$PARENT_ISSUE_KEY" ]; then
  echo "使用方法: $0 <PARENT_ISSUE_KEY> [REPOSITORIES...]" >&2
  echo "例: $0 MWD-72 \"MrWebDefence-Console\" \"MrWebDefence-Design\"" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JIRA_SCRIPT_DIR="$SCRIPT_DIR"

# 共通関数の読み込み
if [ -f "${JIRA_SCRIPT_DIR}/common.sh" ]; then
  source "${JIRA_SCRIPT_DIR}/common.sh"
else
  echo "❌ エラー: ${JIRA_SCRIPT_DIR}/common.sh が見つかりません" >&2
  exit 1
fi

# リポジトリ一覧（引数がない場合はデフォルト）
if [ -z "$REPOSITORIES" ] || [ "$REPOSITORIES" = "" ]; then
  REPOSITORIES=(
    "MrWebDefence-Console"
    "MrWebDefence-Design"
    "MrWebDefence-Backend"
    "MrWebDefence-Frontend"
  )
else
  # 引数から配列を作成
  REPOSITORIES=("$@")
  shift
fi

echo "=================================================================================="
echo "サブタスク作成: ${PARENT_ISSUE_KEY}"
echo "=================================================================================="
echo ""

# 親Issueの情報を取得
echo "📋 親Issueの情報を取得中..."
PARENT_ISSUE_INFO=$(jira_api_call "GET" "issue/${PARENT_ISSUE_KEY}")
if [ $? -ne 0 ]; then
  echo "❌ エラー: 親Issue ${PARENT_ISSUE_KEY} が見つかりません" >&2
  exit 1
fi

PARENT_TITLE=$(echo "$PARENT_ISSUE_INFO" | jq -r '.fields.summary')
PARENT_ID=$(echo "$PARENT_ISSUE_INFO" | jq -r '.id')

echo "親Issue: ${PARENT_ISSUE_KEY}"
echo "タイトル: ${PARENT_TITLE}"
echo ""

# 各リポジトリ用のサブタスクを作成
CREATED_SUBTASKS=()

for REPO in "${REPOSITORIES[@]}"; do
  SUBTASK_TITLE="Local環境構築（Docker Compose）: ${REPO}"
  SUBTASK_BODY="親Issue: ${PARENT_ISSUE_KEY}\n\n${REPO}リポジトリ用のLocal環境構築（Docker Compose）を実装します。"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 サブタスク作成中: ${SUBTASK_TITLE}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Issue種別IDを取得
  ISSUE_TYPE_ID=$(get_issue_type_id_from_api "MWD" "Sub-task" 2>&1)
  if [ -z "$ISSUE_TYPE_ID" ]; then
    echo "⚠️  警告: Sub-task種別が見つかりません。Task種別で作成を試みます..."
    ISSUE_TYPE_ID=$(get_issue_type_id_from_api "MWD" "Task" 2>&1)
  fi
  
  if [ -z "$ISSUE_TYPE_ID" ]; then
    echo "❌ エラー: Issue種別IDの取得に失敗しました" >&2
    continue
  fi
  
  # サブタスク作成用のJSONデータ
  SUBTASK_DATA=$(jq -n \
    --arg project_key "MWD" \
    --arg issue_type_id "$ISSUE_TYPE_ID" \
    --arg title "$SUBTASK_TITLE" \
    --arg body "$SUBTASK_BODY" \
    --arg parent_id "$PARENT_ID" \
    '{
      fields: {
        project: {
          key: $project_key
        },
        issuetype: {
          id: $issue_type_id
        },
        summary: $title,
        description: {
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
        },
        parent: {
          id: $parent_id
        }
      }
    }')
  
  echo "🔄 サブタスクを作成中..."
  RESPONSE=$(jira_api_call "POST" "issue" "$SUBTASK_DATA")
  
  if [ $? -eq 0 ] && echo "$RESPONSE" | jq -e . >/dev/null 2>&1; then
    SUBTASK_KEY=$(echo "$RESPONSE" | jq -r '.key')
    SUBTASK_URL="${JIRA_BASE_URL}/browse/${SUBTASK_KEY}"
    
    echo "✅ サブタスク作成成功"
    echo "   Issueキー: ${SUBTASK_KEY}"
    echo "   URL: ${SUBTASK_URL}"
    echo ""
    
    CREATED_SUBTASKS+=("${SUBTASK_KEY}")
  else
    echo "❌ エラー: サブタスク作成に失敗しました" >&2
    handle_jira_error "$RESPONSE"
    echo ""
  fi
done

echo "=================================================================================="
echo "✅ サブタスク作成完了"
echo "=================================================================================="
echo ""
echo "作成されたサブタスク:"
for SUBTASK_KEY in "${CREATED_SUBTASKS[@]}"; do
  echo "  - ${SUBTASK_KEY}: ${JIRA_BASE_URL}/browse/${SUBTASK_KEY}"
done
echo ""
