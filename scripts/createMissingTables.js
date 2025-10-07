const mysql = require('mysql2/promise');
const config = require('../config');

async function createMissingTables() {
  let connection;

  try {
    console.log('開始創建缺失的數據表...');

    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: config.database.charset,
      timezone: config.database.timezone
    });

    // 檢查並創建 verification_codes 表
    console.log('1. 創建驗證碼表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL COMMENT '手機號',
        code VARCHAR(10) NOT NULL COMMENT '驗證碼',
        type ENUM('register', 'login') NOT NULL COMMENT '類型',
        used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
        expires_at TIMESTAMP NOT NULL COMMENT '過期時間',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
        INDEX idx_phone_type (phone_number, type),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='驗證碼表'
    `);

    // 檢查並創建 article_likes 表
    console.log('2. 創建文章點讚表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS article_likes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL COMMENT '用戶ID',
        article_id BIGINT NOT NULL COMMENT '文章ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        UNIQUE KEY uk_user_article (user_id, article_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章點讚表'
    `);

    // 檢查並創建 achievements 表
    console.log('3. 創建成就表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '成就名稱',
        description VARCHAR(500) NOT NULL COMMENT '成就描述',
        icon VARCHAR(500) COMMENT '成就圖標',
        condition_type ENUM('days', 'checkins', 'special') NOT NULL COMMENT '條件類型',
        condition_value INT DEFAULT 0 COMMENT '條件值',
        sort_order INT DEFAULT 0 COMMENT '排序',
        status TINYINT(1) DEFAULT 1 COMMENT '狀態',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就表'
    `);

    // 檢查並創建 user_achievements 表
    console.log('4. 創建用戶成就關聯表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL COMMENT '用戶ID',
        achievement_id BIGINT NOT NULL COMMENT '成就ID',
        unlock_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '解鎖時間',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE KEY uk_user_achievement (user_id, achievement_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶成就關聯表'
    `);

    // 檢查並創建 feedback 表
    console.log('5. 創建反饋表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL COMMENT '用戶ID',
        type ENUM('bug', 'suggestion') NOT NULL COMMENT '反饋類型',
        content TEXT NOT NULL COMMENT '反饋內容',
        contact VARCHAR(100) COMMENT '聯繫方式',
        status ENUM('pending', 'processing', 'resolved', 'closed') DEFAULT 'pending' COMMENT '處理狀態',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '創建時間',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_type (type),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反饋表'
    `);

    // 插入成就初始數據
    console.log('6. 插入成就初始數據...');
    await connection.execute(`
      INSERT IGNORE INTO achievements (name, description, icon, condition_type, condition_value, sort_order) VALUES
      ('戒煙新手', '成功戒煙1天', 'icon-newbie.png', 'days', 1, 1),
      ('堅持一周', '成功戒煙7天', 'icon-week.png', 'days', 7, 2),
      ('月度挑戰者', '成功戒煙30天', 'icon-month.png', 'days', 30, 3),
      ('季度戰士', '成功戒煙90天', 'icon-season.png', 'days', 90, 4),
      ('半年英雄', '成功戒煙180天', 'icon-halfyear.png', 'days', 180, 5),
      ('年度冠軍', '成功戒煙365天', 'icon-year.png', 'days', 365, 6),
      ('打卡達人', '累計打卡50次', 'icon-checkin.png', 'checkins', 50, 7)
    `);

    console.log('所有缺失的數據表創建完成！');

    // 顯示統計信息
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n數據庫現在包含 ${tables.length} 個表：`);
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });

  } catch (error) {
    console.error('創建數據表失敗:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 執行創建
createMissingTables();
