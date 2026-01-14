#!/bin/bash

# Jira設定ファイル
# このファイルはJira操作スクリプト全般から参照されます

# Issueトラッカー設定
# 既に設定されている場合は上書きしない
if [ -z "$ISSUE_TRACKER" ]; then
  readonly ISSUE_TRACKER="jira"
  export ISSUE_TRACKER
fi

# Jiraプロジェクトキー
# 環境変数から取得、またはデフォルト値を設定
# 各プロジェクトで適切な値を設定してください
# 既に設定されている場合は上書きしない
if [ -z "$JIRA_PROJECT_KEY" ]; then
  readonly JIRA_PROJECT_KEY="MWD"
  export JIRA_PROJECT_KEY
fi

# JiraベースURL（オプション、デフォルト値はcommon.shで設定）
# readonly JIRA_BASE_URL="${JIRA_BASE_URL:-https://kencom2400.atlassian.net}"
# export JIRA_BASE_URL

