const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成JWT token
 * @param {Object} payload 載荷數據
 * @returns {String} token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

/**
 * 驗證JWT token
 * @param {String} token 
 * @returns {Object} 解碼後的payload
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  generateToken,
  verifyToken
};

