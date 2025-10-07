const { query } = require('../utils/database');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { getDaysDifference } = require('../utils/date');

class User {
  /**
   * 創建用戶
   */
  static async create(userData) {
    const {
      nickname,
      avatarUrl,
      phoneNumber,
      password,
      gender,
      age,
      smokingAge,
      dailySmoking,
      quitReason,
      openid,
      unionid,
      sessionKey,
      country,
      province,
      city,
      language
    } = userData;

    const passwordHash = password ? await hashPassword(password) : null;
    const quitStartDate = new Date();
    
    // 轉換性別為數字：male=1, female=2, unknown=0
    let genderNum = 0;
    if (gender === 'male') genderNum = 1;
    else if (gender === 'female') genderNum = 2;

    const sql = `
      INSERT INTO users (
        openid, unionid, session_key, nickname, avatar_url, phone_number, password, 
        gender, country, province, city, language, age, smoking_age, daily_smoking, 
        quit_reason, quit_start_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    // 將所有 undefined 轉換為 null，避免 MySQL2 錯誤
    const result = await query(sql, [
      openid || `temp_${Date.now()}`, 
      unionid ?? null, 
      sessionKey ?? null, 
      nickname, 
      avatarUrl ?? null, 
      phoneNumber ?? null, 
      passwordHash,
      genderNum, 
      country ?? null, 
      province ?? null, 
      city ?? null, 
      language || 'zh_CN', 
      age ?? null,
      smokingAge ?? null, 
      dailySmoking ?? null, 
      JSON.stringify(quitReason || []), 
      quitStartDate
    ]);

    return result.insertId;
  }

  /**
   * 根據手機號查找用戶
   */
  static async findByPhone(phoneNumber) {
    const sql = 'SELECT * FROM users WHERE phone_number = ? AND status = 1';
    const result = await query(sql, [phoneNumber]);
    return result[0] || null;
  }

  /**
   * 根據openid查找用戶
   */
  static async findByOpenid(openid) {
    const sql = 'SELECT * FROM users WHERE openid = ? AND status = 1';
    const result = await query(sql, [openid]);
    return result[0] || null;
  }

  /**
   * 根據ID查找用戶
   */
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ? AND status = 1';
    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 驗證密碼
   */
  static async verifyPassword(password, hashedPassword) {
    return comparePassword(password, hashedPassword);
  }

  /**
   * 更新用戶信息
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    if (updateData.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(updateData.nickname);
    }
    if (updateData.avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updateData.avatarUrl);
    }
    if (updateData.gender !== undefined) {
      // 轉換性別為數字
      let genderNum = 0;
      if (updateData.gender === 'male') genderNum = 1;
      else if (updateData.gender === 'female') genderNum = 2;
      fields.push('gender = ?');
      values.push(genderNum);
    }
    if (updateData.age !== undefined) {
      fields.push('age = ?');
      values.push(updateData.age);
    }
    
    if (fields.length === 0) return await this.findById(id);
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, values);
    return await this.findById(id);
  }

  /**
   * 獲取用戶統計數據
   */
  static async getStats(id) {
    const user = await this.findById(id);
    if (!user) return null;

    // 計算戒煙天數
    const quitDays = user.quit_start_date ? getDaysDifference(user.quit_start_date) : 0;
    
    // 計算節省的金額和香煙數（假設每包20支，15元）
    const savedCigarettes = quitDays * (user.daily_smoking || 0);
    const savedMoney = Math.floor(savedCigarettes * 15 / 20);

    return {
      quitDays,
      savedMoney,
      savedCigarettes
    };
  }

  /**
   * 轉換gender數字為字符串
   */
  static genderToString(genderNum) {
    switch (genderNum) {
      case 1: return 'male';
      case 2: return 'female';
      default: return 'unknown';
    }
  }
}

module.exports = User;