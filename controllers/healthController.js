const { query } = require('../utils/database');
const { getDaysDifference } = require('../utils/date');
const Achievement = require('../models/Achievement');

class HealthController {
  /**
   * 基本健康檢查
   */
  static async check(ctx) {
    ctx.body = {
      code: 200,
      message: '服務運行正常',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'NoSmokeback API'
      }
    };
  }

  /**
   * 獲取健康提示
   */
  static async getTips(ctx) {
    const userId = ctx.state.user.id;

    // 獲取用戶戒煙開始日期
    const userSql = 'SELECT quit_start_date FROM users WHERE id = ?';
    const userResult = await query(userSql, [userId]);
    
    if (userResult.length === 0 || !userResult[0].quit_start_date) {
      const error = new Error('用戶數據不完整');
      error.code = 1004;
      error.status = 404;
      throw error;
    }

    const quitStartDate = userResult[0].quit_start_date;
    const quitDays = getDaysDifference(quitStartDate);

    // 定義健康提示階段
    const healthTips = [
      { days: 0, tip: '恭喜開始戒煙！20分鐘內，心率和血壓開始下降' },
      { days: 1, tip: '12小時內，血液中的一氧化碳水平降至正常' },
      { days: 2, tip: '2天內，尼古丁完全排出體外，味覺和嗅覺開始改善' },
      { days: 7, tip: '1週內，血液循環改善' },
      { days: 14, tip: '2週內，肺功能增強，行走更輕鬆' },
      { days: 30, tip: '1個月內，咳嗽和氣短減少' },
      { days: 90, tip: '3個月內，肺功能提高30%' },
      { days: 180, tip: '6個月內，感染風險顯著降低' },
      { days: 365, tip: '1年內，心臟病風險降低一半' },
      { days: 1825, tip: '5年內，中風風險降低至不吸煙者水平' },
      { days: 3650, tip: '10年內，肺癌風險降低一半' }
    ];

    // 找到當前階段的提示
    let currentTip = healthTips[0];
    let nextMilestone = null;

    for (let i = 0; i < healthTips.length; i++) {
      if (quitDays >= healthTips[i].days) {
        currentTip = healthTips[i];
      } else {
        nextMilestone = {
          days: healthTips[i].days - quitDays,
          tip: healthTips[i].tip
        };
        break;
      }
    }

    // 計算健康恢復進度（簡化版，最大到10年）
    const maxDays = 3650; // 10年
    const progress = Math.min(100, Math.floor((quitDays / maxDays) * 100));

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        currentTip: currentTip.tip,
        progress,
        nextMilestone
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 獲取成就列表
   */
  static async getAchievements(ctx) {
    const userId = ctx.state.user.id;
    const achievements = await Achievement.getUserAchievements(userId);

    ctx.body = {
      code: 200,
      message: 'success',
      data: achievements.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlocked: !!achievement.unlocked,
        unlockTime: achievement.unlock_time
      })),
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = HealthController;