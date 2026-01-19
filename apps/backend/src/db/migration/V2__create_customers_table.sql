-- Create customers table
-- 顧客テーブルを作成します

CREATE TABLE customers (
  id CHAR(36) PRIMARY KEY COMMENT '顧客ID (UUID)',
  name VARCHAR(255) NOT NULL COMMENT '顧客名',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'メールアドレス',
  phone VARCHAR(50) NULL COMMENT '電話番号',
  company VARCHAR(255) NULL COMMENT '会社名',
  address VARCHAR(500) NULL COMMENT '住所',
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'ステータス',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  INDEX idx_customers_email (email),
  INDEX idx_customers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='顧客テーブル';
