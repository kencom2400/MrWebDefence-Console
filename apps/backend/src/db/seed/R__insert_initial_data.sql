-- Insert initial data
-- 初期データを投入します
-- 注意: このファイルはRepeatable Migrationのため、内容が変更されると再実行されます

-- テスト用ユーザー（パスワード: password123）
-- ハッシュ値は bcrypt で生成（salt rounds: 10）
INSERT IGNORE INTO users (id, email, hashed_password, role, mfa_enabled, mfa_secret, created_at, updated_at)
VALUES
  (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'user@example.com',
    '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O',
    'SERVICE_MEMBER',
    FALSE,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
    'admin@example.com',
    '$2b$10$he31Fy7fUPv9rO2E2coIA.z/3/AStVeVgDSlJMCwNDqLOaw0R/67O',
    'SERVICE_ADMIN',
    FALSE,
    NULL,
    NOW(),
    NOW()
  );
