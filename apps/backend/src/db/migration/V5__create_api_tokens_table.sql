-- Create api_tokens table
-- APIトークンテーブルを作成します

CREATE TABLE api_tokens (
  id CHAR(36) PRIMARY KEY COMMENT 'APIトークンID (UUID)',
  name VARCHAR(255) NOT NULL COMMENT 'トークン名',
  description TEXT NULL COMMENT '説明',
  token_hash VARCHAR(255) NOT NULL UNIQUE COMMENT 'トークンのハッシュ値 (bcrypt)',
  token_prefix VARCHAR(10) NOT NULL COMMENT 'トークンのプレフィックス (例: waf_)',
  expires_at TIMESTAMP NULL COMMENT '有効期限 (nullの場合は無期限)',
  revoked_at TIMESTAMP NULL COMMENT '無効化日時 (nullの場合は有効)',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  created_by CHAR(36) NOT NULL COMMENT '作成者ID (UUID)',
  INDEX idx_token_prefix (token_prefix),
  INDEX idx_revoked_at (revoked_at),
  INDEX idx_expires_at (expires_at),
  CONSTRAINT fk_api_tokens_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='APIトークンテーブル';
