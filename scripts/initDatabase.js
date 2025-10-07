const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

async function initDatabase() {
  let connection;

  try {
    console.log('開始初始化數據庫...');

    // 首先連接到MySQL服務器（不指定數據庫）
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      charset: config.database.charset,
      timezone: config.database.timezone,
      multipleStatements: true  // 允許執行多條SQL語句
    });

    // 讀取SQL初始化文件
    const sqlFile = path.join(__dirname, '../sql/init.sql');
    const sqlScript = await fs.readFile(sqlFile, 'utf8');

    console.log('執行SQL初始化腳本...');
    
    // 分割並執行SQL語句
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement + ';');
      }
    }

    console.log('數據庫初始化成功！');

    // 測試連接到新創建的數據庫
    await connection.end();
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: config.database.charset,
      timezone: config.database.timezone
    });

    console.log('數據庫連接測試成功！');

    // 顯示一些統計信息
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`創建了 ${tables.length} 個數據表：`);
    tables.forEach(table => {
      console.log(`- ${Object.values(table)[0]}`);
    });

    // 顯示示例數據統計
    const [achievements] = await connection.execute('SELECT COUNT(*) as count FROM achievements');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM article_categories');
    const [articles] = await connection.execute('SELECT COUNT(*) as count FROM articles');

    console.log('\n初始數據統計：');
    console.log(`- 成就數據：${achievements[0].count} 條`);
    console.log(`- 文章分類：${categories[0].count} 條`);
    console.log(`- 示例文章：${articles[0].count} 條`);

    console.log('\n數據庫初始化完成！現在可以啟動應用服務了。');
    console.log('運行命令：npm start');

  } catch (error) {
    console.error('數據庫初始化失敗:', error.message);
    console.error('請檢查：');
    console.error('1. MySQL服務是否已啟動');
    console.error('2. 數據庫連接配置是否正確');
    console.error('3. 用戶權限是否足夠');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 執行初始化
initDatabase();