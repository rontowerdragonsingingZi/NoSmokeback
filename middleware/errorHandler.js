const logger = require('../utils/logger');

/**
 * 錯誤處理中間件
 */
module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // 記錄詳細錯誤信息
    logger.error('服務器錯誤', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status,
      method: ctx.method,
      url: ctx.url,
      ip: ctx.ip,
      userAgent: ctx.headers['user-agent']
    });
    
    // 業務邏輯錯誤（包括JWT錯誤）
    if (error.code) {
      ctx.status = error.status || 400;
      ctx.body = {
        code: error.code,
        message: error.message,
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      };
      return;
    }
    
    // JWT錯誤處理（當沒有明確的錯誤碼時）
    if (error.status === 401) {
      ctx.status = 401;
      ctx.body = {
        code: 1006,
        message: 'Token已過期或無效',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      };
      return;
    }
    
    // 參數驗證錯誤
    if (error.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = {
        code: 3002,
        message: '參數格式錯誤',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      };
      return;
    }
    
    // 數據庫錯誤
    if (error.code === 'ER_DUP_ENTRY') {
      ctx.status = 400;
      ctx.body = {
        code: 2004,
        message: '數據已存在',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      };
      return;
    }
    
    // 默認服務器錯誤
    ctx.status = error.status || 500;
    ctx.body = {
      code: 5001,
      message: '服務器內部錯誤',
      data: null,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
};

