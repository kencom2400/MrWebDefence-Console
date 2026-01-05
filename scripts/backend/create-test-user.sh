#!/bin/bash

# テスト用ユーザー作成スクリプト
# 
# テスト用のユーザーを作成します。
# パスワードはbcryptでハッシュ化して保存されます。

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# バックエンドディレクトリに移動
cd "${BACKEND_DIR}"

# 依存関係の確認
if [ ! -d "node_modules" ]; then
  echo "📦 依存関係をインストール中..."
  pnpm install
fi

# Node.jsスクリプトでユーザーを作成
cat > /tmp/create-user.mjs << 'EOF'
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'users.json');

async function createUser(email, password) {
  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // ユーザーIDを生成
  const userId = `user-${Date.now()}`;
  const now = new Date().toISOString();
  
  const user = {
    id: userId,
    email: email,
    hashedPassword: hashedPassword,
    createdAt: now,
    updatedAt: now,
  };
  
  // データディレクトリが存在しない場合は作成
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // 既に存在する場合は無視
  }
  
  // 既存のユーザーを読み込む
  let users = [];
  try {
    const data = await fs.readFile(dataFile, 'utf-8');
    users = JSON.parse(data);
  } catch (error) {
    // ファイルが存在しない場合は空配列
  }
  
  // 既に同じメールアドレスのユーザーが存在するか確認
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    console.error(`❌ エラー: メールアドレス '${email}' のユーザーは既に存在します`);
    process.exit(1);
  }
  
  // ユーザーを追加
  users.push(user);
  
  // ファイルに保存
  await fs.writeFile(dataFile, JSON.stringify(users, null, 2), 'utf-8');
  
  console.log('✅ ユーザーを作成しました');
  console.log(`   ID: ${userId}`);
  console.log(`   Email: ${email}`);
  console.log(`   データファイル: ${dataFile}`);
}

// コマンドライン引数から取得
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('使用方法: node create-user.mjs <email> <password>');
  console.error('例: node create-user.mjs test@example.com password123');
  process.exit(1);
}

createUser(email, password).catch((error) => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
EOF

# 引数の確認
if [ $# -lt 2 ]; then
  echo "使用方法: $0 <email> <password>"
  echo ""
  echo "例:"
  echo "  $0 test@example.com password123"
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"

echo "👤 テスト用ユーザーを作成します..."
echo "   Email: ${EMAIL}"
echo ""

# Node.jsスクリプトを実行
node /tmp/create-user.mjs "${EMAIL}" "${PASSWORD}"

# 一時ファイルを削除
rm -f /tmp/create-user.mjs

