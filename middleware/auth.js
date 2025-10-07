const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * JWT認證中間件
 */
const authenticate = async (ctx, next) => {
  // 提取token，支持 'Bearer token' 和 'bearer token' 格式
  const authHeader = ctx.headers.authorization;
  let token = null;
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1].trim();
    }
  }
  
  if (!token) {
    const error = new Error('未提供認證Token');
    error.code = 1007;
    error.status = 401;
    throw error;
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    // 添加詳細的錯誤日誌
    logger.error('JWT verification failed', {
      errorName: error.name,
      errorMessage: error.message,
      tokenPreview: token.substring(0, 50) + '...',
      secret: config.jwt.secret.substring(0, 10) + '...'
    });
    
    if (error.name === 'TokenExpiredError') {
      const authError = new Error('Token expired');
      authError.code = 1006;
      authError.status = 401;
      throw authError;
    } else {
      const authError = new Error('Token invalid');
      authError.code = 1007;
      authError.status = 401;
      throw authError;
    }
  }
};

/**
 * 可選認證中間件（用戶可登錄可不登錄的接口）
 */
const optionalAuthenticate = async (ctx, next) => {
  // 提取token，支持 'Bearer token' 和 'bearer token' 格式
  const authHeader = ctx.headers.authorization;
  let token = null;
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1].trim();
    }
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      ctx.state.user = decoded;
    } catch (error) {
      // 可選認證，token錯誤時不拋出異常
      ctx.state.user = null;
    }
  } else {
    ctx.state.user = null;
  }
  
  await next();
};

module.exports = {
  authenticate,
  optionalAuthenticate
};

