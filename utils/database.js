const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('./logger');

// 創建連接池
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  charset: config.database.charset,
  timezone: config.database.timezone,
  connectionLimit: 10,
  queueLimit: 0
});

// 測試數據庫連接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('數據庫連接成功！', {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database
    });
    console.log('數據庫連接成功！');
    connection.release();
    return true;
  } catch (error) {
    logger.error('數據庫連接失敗', {
      error: error.message,
      host: config.database.host,
      port: config.database.port
    });
    console.error('數據庫連接失敗:', error.message);
    return false;
  }
}

// 執行查詢
async function query(sql, params = []) {
  const start = Date.now();
  try {
    const [rows, fields] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    
    // 記錄SQL查詢日誌
    logger.logDatabase('SELECT/UPDATE/INSERT/DELETE', sql, params, duration);
    
    return rows;
  } catch (error) {
    logger.error('SQL查詢錯誤', {
      error: error.message,
      sql: sql.replace(/\s+/g, ' ').trim(),
      params
    });
    console.error('SQL查詢錯誤:', error.message);
    throw error;
  }
}

// 執行事務
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};

