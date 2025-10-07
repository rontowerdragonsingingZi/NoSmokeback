const { query } = require('../utils/database');
const { getTodayString, getDaysDifference } = require('../utils/date');

class Checkin {
  /**
   * 創建打卡記錄
   */
  static async create(userId, mood, note = '') {
    const checkDate = getTodayString();
    
    // 檢查今日是否已打卡
    const existsCheck = await this.findByUserAndDate(userId, checkDate);
    if (existsCheck) {
      const error = new Error('今日已打卡');
      error.code = 2001;
      error.status = 400;
      throw error;
    }

    const sql = `
      INSERT INTO check_ins (user_id, check_date, mood, note)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [userId, checkDate, mood, note]);
    
    // 獲取連續打卡天數
    const continuousDays = await this.getContinuousDays(userId);

    return {
      checkinId: result.insertId,
      checkDate,
      continuousDays
    };
  }

  /**
   * 根據用戶ID和日期查找打卡記錄
   */
  static async findByUserAndDate(userId, date) {
    const sql = 'SELECT * FROM check_ins WHERE user_id = ? AND check_date = ?';
    const result = await query(sql, [userId, date]);
    return result[0] || null;
  }

  /**
   * 獲取用戶指定月份的打卡日期
   */
  static async getMonthlyCheckins(userId, year, month) {
    const sql = `
      SELECT check_date FROM check_ins 
      WHERE user_id = ? AND YEAR(check_date) = ? AND MONTH(check_date) = ?
      ORDER BY check_date ASC
    `;

    const result = await query(sql, [userId, year, month]);
    return result.map(row => row.check_date);
  }

  /**
   * 檢查今日是否已打卡
   */
  static async isTodayChecked(userId) {
    const today = getTodayString();
    const checkin = await this.findByUserAndDate(userId, today);
    return !!checkin;
  }

  /**
   * 獲取連續打卡天數
   */
  static async getContinuousDays(userId) {
    const sql = `
      SELECT check_date FROM check_ins 
      WHERE user_id = ? 
      ORDER BY check_date DESC
    `;

    const result = await query(sql, [userId]);
    if (result.length === 0) return 0;

    let continuous = 1;
    const today = new Date();
    let currentDate = new Date(result[0].check_date);

    // 如果最近一次打卡不是今天或昨天，則連續天數為0
    const daysDiff = getDaysDifference(currentDate, today);
    if (daysDiff > 1) return 0;

    // 計算連續天數
    for (let i = 1; i < result.length; i++) {
      const prevDate = new Date(result[i].check_date);
      const dateDiff = getDaysDifference(prevDate, currentDate);
      
      if (dateDiff === 1) {
        continuous++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return continuous;
  }

  /**
   * 獲取打卡統計數據
   */
  static async getStats(userId) {
    // 總打卡天數
    const totalSql = 'SELECT COUNT(*) as count FROM check_ins WHERE user_id = ?';
    const totalResult = await query(totalSql, [userId]);
    const totalDays = totalResult[0].count;

    // 連續打卡天數
    const continuousDays = await this.getContinuousDays(userId);

    // 最長連續天數（需要複雜計算，這裡簡化為連續天數）
    const maxContinuous = continuousDays;

    // 本月打卡天數
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    const monthSql = `
      SELECT COUNT(*) as count FROM check_ins 
      WHERE user_id = ? AND YEAR(check_date) = ? AND MONTH(check_date) = ?
    `;
    const monthResult = await query(monthSql, [userId, year, month]);
    const thisMonthDays = monthResult[0].count;

    // 獲取用戶信息計算節省數據
    const userSql = 'SELECT quit_start_date, daily_smoking FROM users WHERE id = ?';
    const userResult = await query(userSql, [userId]);
    const user = userResult[0];

    let savedMoney = 0;
    let savedCigarettes = 0;
    let healthScore = 60; // 基礎分

    if (user && user.quit_start_date) {
      const quitDays = getDaysDifference(user.quit_start_date);
      savedCigarettes = quitDays * (user.daily_smoking || 0);
      savedMoney = Math.floor(savedCigarettes * 15 / 20); // 假設每包20支，15元
      
      // 健康評分計算（簡化版）
      healthScore = Math.min(100, 60 + quitDays * 0.5 + continuousDays * 2);
    }

    return {
      totalDays,
      continuousDays,
      maxContinuous,
      thisMonthDays,
      savedMoney,
      savedCigarettes,
      healthScore: Math.round(healthScore)
    };
  }

  /**
   * 獲取打卡詳情
   */
  static async getDetail(userId, date) {
    const sql = `
      SELECT id, check_date, mood, note, created_at 
      FROM check_ins 
      WHERE user_id = ? AND check_date = ?
    `;

    const result = await query(sql, [userId, date]);
    return result[0] || null;
  }
}

module.exports = Checkin;