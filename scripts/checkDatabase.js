const mysql = require('mysql2/promise');
const config = require('../config');

async function checkDatabase() {
  let connection;

  try {
    console.log('連接到現有數據庫...');

    // 連接到數據庫
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: config.database.charset,
      timezone: config.database.timezone
    });

    console.log(`成功連接到數據庫: ${config.database.database}`);
    console.log('');

    // 獲取所有表名
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`發現 ${tables.length} 個數據表：`);
    
    const tableNames = [];
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      tableNames.push(tableName);
      console.log(`- ${tableName}`);
    });
    console.log('');

    // 查看每個表的結構
    for (const tableName of tableNames) {
      console.log(`=== 表 ${tableName} 結構 ===`);
      
      // 獲取表結構
      const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      
      console.log('字段信息：');
      columns.forEach(col => {
        const nullable = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.Default !== null ? `DEFAULT ${col.Default}` : '';
        const extra = col.Extra ? col.Extra : '';
        console.log(`  ${col.Field}: ${col.Type} ${nullable} ${defaultVal} ${extra}`.trim());
      });

      // 獲取索引信息
      const [indexes] = await connection.execute(`SHOW INDEX FROM ${tableName}`);
      if (indexes.length > 0) {
        console.log('索引信息：');
        const indexMap = {};
        indexes.forEach(idx => {
          if (!indexMap[idx.Key_name]) {
            indexMap[idx.Key_name] = {
              unique: idx.Non_unique === 0,
              columns: []
            };
          }
          indexMap[idx.Key_name].columns.push(idx.Column_name);
        });

        Object.entries(indexMap).forEach(([indexName, info]) => {
          const unique = info.unique ? 'UNIQUE' : '';
          console.log(`  ${unique} INDEX ${indexName} (${info.columns.join(', ')})`);
        });
      }

      // 獲取外鍵信息
      const [foreignKeys] = await connection.execute(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME,
          CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = '${config.database.database}' 
        AND TABLE_NAME = '${tableName}'
      `);

      if (foreignKeys.length > 0) {
        console.log('外鍵信息：');
        foreignKeys.forEach(fk => {
          console.log(`  ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`);
        });
      }

      // 獲取表中數據量
      const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`數據量: ${count[0].count} 條記錄`);

      console.log('');
    }

  } catch (error) {
    console.error('數據庫檢查失敗:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`數據庫 '${config.database.database}' 不存在`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('數據庫訪問被拒絕，請檢查用戶名和密碼');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 執行檢查
checkDatabase();
