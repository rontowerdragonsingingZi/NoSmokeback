const { query } = require('../utils/database');
const { generateVerifyCode } = require('../utils/crypto');

class VerificationCode {
  /**
   * 創建驗證碼
   */
  static async create(phoneNumber, type = 'register') {
    const code = generateVerifyCode(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分鐘後過期

    const sql = `
      INSERT INTO verification_codes (phone_number, code, type, expires_at)
      VALUES (?, ?, ?, ?)
    `;

    await query(sql, [phoneNumber, code, type, expiresAt]);
    return code;
  }

  /**
   * 驗證驗證碼
   */
  static async verify(phoneNumber, code, type = 'register') {
    const sql = `
      SELECT * FROM verification_codes 
      WHERE phone_number = ? AND code = ? AND type = ? AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await query(sql, [phoneNumber, code, type]);
    
    if (result.length === 0) {
      return false;
    }

    // 標記驗證碼為已使用
    const updateSql = 'UPDATE verification_codes SET used = TRUE WHERE id = ?';
    await query(updateSql, [result[0].id]);

    return true;
  }

  /**
   * 清理過期驗證碼
   */
  static async cleanExpired() {
    const sql = 'DELETE FROM verification_codes WHERE expires_at < NOW()';
    return await query(sql);
  }

  /**
   * 檢查發送頻率限制（1分鐘內只能發送一次）
   */
  static async checkRateLimit(phoneNumber, type = 'register') {
    const sql = `
      SELECT COUNT(*) as count FROM verification_codes 
      WHERE phone_number = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
    `;
    
    const result = await query(sql, [phoneNumber, type]);
    return result[0].count === 0;
  }
}

module.exports = VerificationCode;