const { query } = require('../utils/database');
const { getDaysDifference } = require('../utils/date');

class Achievement {
  /**
   * 獲取用戶成就列表
   */
  static async getUserAchievements(userId) {
    const sql = `
      SELECT a.id, a.name, a.description, a.icon, a.condition_type, a.condition_value,
             ua.unlock_time,
             CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY a.sort_order ASC, a.id ASC
    `;

    return await query(sql, [userId]);
  }

  /**
   * 檢查並解鎖新成就
   */
  static async checkAndUnlockAchievements(userId) {
    // 獲取用戶數據
    const userSql = 'SELECT quit_start_date FROM users WHERE id = ?';
    const userResult = await query(userSql, [userId]);
    if (userResult.length === 0) return [];

    const user = userResult[0];
    const quitDays = user.quit_start_date ? getDaysDifference(user.quit_start_date) : 0;

    // 獲取打卡次數
    const checkinCountSql = 'SELECT COUNT(*) as count FROM check_ins WHERE user_id = ?';
    const checkinResult = await query(checkinCountSql, [userId]);
    const checkinCount = checkinResult[0].count;

    // 獲取未解鎖的成就
    const achievementsSql = `
      SELECT a.* FROM achievements a
      WHERE a.id NOT IN (
        SELECT achievement_id FROM user_achievements WHERE user_id = ?
      )
    `;
    const achievements = await query(achievementsSql, [userId]);

    const newAchievements = [];

    for (const achievement of achievements) {
      let shouldUnlock = false;

      switch (achievement.condition_type) {
        case 'days':
          shouldUnlock = quitDays >= achievement.condition_value;
          break;
        case 'checkins':
          shouldUnlock = checkinCount >= achievement.condition_value;
          break;
        case 'special':
          // 特殊成就邏輯，這裡簡化處理
          break;
      }

      if (shouldUnlock) {
        // 解鎖成就
        await query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
          [userId, achievement.id]
        );
        
        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon
        });
      }
    }

    return newAchievements;
  }

  /**
   * 獲取所有成就
   */
  static async getAll() {
    const sql = 'SELECT * FROM achievements ORDER BY sort_order ASC, id ASC';
    return await query(sql);
  }
}

module.exports = Achievement;