-- 創建數據庫
CREATE DATABASE IF NOT EXISTS quitsmoke DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE quitsmoke;

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL COMMENT '昵稱',
  avatar_url VARCHAR(500) COMMENT '頭像URL',
  phone_number VARCHAR(20) COMMENT '手機號',
  password_hash VARCHAR(255) COMMENT '密碼哈希',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性別',
  age INT COMMENT '年齡',
  smoking_age INT COMMENT '開始吸煙年齡',
  daily_smoking INT COMMENT '每日吸煙量',
  quit_reason JSON COMMENT '戒煙原因數組',
  quit_start_date DATETIME COMMENT '開始戒煙日期',
  wechat_openid VARCHAR(50) COMMENT '微信openid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  INDEX idx_phone (phone_number),
  INDEX idx_openid (wechat_openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶表';

-- 驗證碼表
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL COMMENT '手機號',
  code VARCHAR(10) NOT NULL COMMENT '驗證碼',
  type ENUM('register', 'login') NOT NULL COMMENT '類型',
  used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
  expires_at TIMESTAMP NOT NULL COMMENT '過期時間',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  INDEX idx_phone_type (phone_number, type),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='驗證碼表';

-- 打卡記錄表
CREATE TABLE IF NOT EXISTS checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用戶ID',
  check_date DATE NOT NULL COMMENT '打卡日期',
  mood ENUM('good', 'normal', 'bad') NOT NULL COMMENT '心情狀態',
  note TEXT COMMENT '打卡備註',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_date (user_id, check_date),
  INDEX idx_user_date (user_id, check_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡記錄表';

-- 文章分類表
CREATE TABLE IF NOT EXISTS article_categories (
  id VARCHAR(50) PRIMARY KEY COMMENT '分類ID',
  name VARCHAR(50) NOT NULL COMMENT '分類名稱',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分類表';

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '文章標題',
  summary TEXT COMMENT '文章摘要',
  content LONGTEXT NOT NULL COMMENT '文章內容',
  cover_image VARCHAR(500) COMMENT '封面圖片',
  category_id VARCHAR(50) NOT NULL COMMENT '分類ID',
  author VARCHAR(100) DEFAULT '系統' COMMENT '作者',
  view_count INT DEFAULT 0 COMMENT '查看次數',
  like_count INT DEFAULT 0 COMMENT '點讚次數',
  share_count INT DEFAULT 0 COMMENT '分享次數',
  status ENUM('draft', 'published', 'archived') DEFAULT 'published' COMMENT '狀態',
  publish_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '發布時間',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  FOREIGN KEY (category_id) REFERENCES article_categories(id),
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_publish (publish_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- 文章點讚表
CREATE TABLE IF NOT EXISTS article_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用戶ID',
  article_id INT NOT NULL COMMENT '文章ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_article (user_id, article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章點讚表';

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '成就名稱',
  description VARCHAR(500) NOT NULL COMMENT '成就描述',
  icon VARCHAR(500) COMMENT '成就圖標',
  condition_type ENUM('days', 'checkins', 'special') NOT NULL COMMENT '條件類型',
  condition_value INT DEFAULT 0 COMMENT '條件值',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就表';

-- 用戶成就關聯表
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用戶ID',
  achievement_id INT NOT NULL COMMENT '成就ID',
  unlock_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '解鎖時間',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶成就關聯表';

-- 反饋表
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用戶ID',
  type ENUM('bug', 'suggestion') NOT NULL COMMENT '反饋類型',
  content TEXT NOT NULL COMMENT '反饋內容',
  contact VARCHAR(100) COMMENT '聯繫方式',
  status ENUM('pending', 'processing', 'resolved', 'closed') DEFAULT 'pending' COMMENT '處理狀態',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反饋表';

-- 插入初始數據

-- 插入文章分類
INSERT IGNORE INTO article_categories (id, name, sort_order) VALUES
('health', '健康知識', 1),
('method', '戒煙方法', 2),
('psychology', '心理調節', 3),
('experience', '成功經驗', 4);

-- 插入成就數據
INSERT IGNORE INTO achievements (name, description, icon, condition_type, condition_value, sort_order) VALUES
('戒煙新手', '成功戒煙1天', 'icon-newbie.png', 'days', 1, 1),
('堅持一周', '成功戒煙7天', 'icon-week.png', 'days', 7, 2),
('月度挑戰者', '成功戒煙30天', 'icon-month.png', 'days', 30, 3),
('季度戰士', '成功戒煙90天', 'icon-season.png', 'days', 90, 4),
('半年英雄', '成功戒煙180天', 'icon-halfyear.png', 'days', 180, 5),
('年度冠軍', '成功戒煙365天', 'icon-year.png', 'days', 365, 6),
('打卡達人', '累計打卡50次', 'icon-checkin.png', 'checkins', 50, 7);

-- 插入示例文章
INSERT IGNORE INTO articles (title, summary, content, cover_image, category_id, author, view_count, like_count) VALUES
('戒煙的健康益處', '了解戒煙後身體的變化過程', '<h2>戒煙20分鐘後</h2><p>心率和血壓開始下降到正常水平。</p><h2>戒煙12小時後</h2><p>血液中的一氧化碳水平降至正常。</p><h2>戒煙2-12週後</h2><p>血液循環改善，肺功能增強。</p>', '/images/health-benefits.jpg', 'health', '健康專家', 1258, 89),
('如何應對戒煙初期的不適', '掌握應對戒煙症狀的有效方法', '<h2>常見戒煙症狀</h2><p>煩躁、焦慮、注意力不集中等都是正常現象。</p><h2>應對方法</h2><p>1. 深呼吸練習 2. 運動轉移注意力 3. 多喝水</p>', '/images/quit-tips.jpg', 'method', '戒煙專家', 956, 76),
('戒煙成功案例分享', '真實用戶的戒煙成功經驗', '<h2>張先生的戒煙故事</h2><p>吸煙15年，通過科學方法成功戒煙。關鍵是找到替代習慣和堅持記錄。</p>', '/images/success-story.jpg', 'experience', '用戶分享', 678, 45);

