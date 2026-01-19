-- Create ip_allowlists table
-- IP AllowListテーブルを作成します

CREATE TABLE ip_allowlists (
  id CHAR(36) PRIMARY KEY COMMENT 'IP AllowList ID (UUID)',
  user_id CHAR(36) NOT NULL COMMENT 'ユーザーID (UUID)',
  ip_address VARCHAR(45) NOT NULL COMMENT 'IPアドレス (IPv4/IPv6、CIDR記法も可)',
  description VARCHAR(255) NULL COMMENT '説明',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  UNIQUE KEY uk_ip_allowlists_user_ip (user_id, ip_address),
  CONSTRAINT fk_ip_allowlists_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP AllowListテーブル';
