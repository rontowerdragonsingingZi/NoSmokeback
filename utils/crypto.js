const bcrypt = require('bcryptjs');

/**
 * 密碼加密
 * @param {String} password 原始密碼
 * @returns {String} 加密後的密碼哈希
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 密碼驗證
 * @param {String} password 原始密碼
 * @param {String} hashedPassword 加密後的密碼
 * @returns {Boolean} 驗證結果
 */
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 生成隨機驗證碼
 * @param {Number} length 驗證碼長度
 * @returns {String} 驗證碼
 */
function generateVerifyCode(length = 6) {
  return Math.random().toString().slice(-length);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateVerifyCode
};

