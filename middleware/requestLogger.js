const logger = require('../utils/logger');

/**
 * 請求日誌中間件
 */
module.exports = async (ctx, next) => {
  const start = Date.now();
  
  // 記錄請求開始
  logger.debug('Request Start', {
    method: ctx.method,
    url: ctx.url,
    ip: ctx.ip,
    userAgent: ctx.headers['user-agent']
  });
  
  try {
    await next();
  } catch (error) {
    // 記錄請求錯誤
    logger.error('Request Error', {
      method: ctx.method,
      url: ctx.url,
      error: error.message,
      stack: error.stack,
      status: error.status || 500
    });
    throw error; // 重新拋出錯誤讓錯誤處理中間件處理
  } finally {
    // 計算響應時間並記錄
    const responseTime = Date.now() - start;
    logger.logRequest(ctx, responseTime);
  }
};
