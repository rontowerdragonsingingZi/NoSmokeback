const Checkin = require('../models/Checkin');
const Achievement = require('../models/Achievement');

class CheckinController {
  /**
   * 提交打卡
   */
  static async submitCheckin(ctx) {
    const userId = ctx.state.user.id;
    const { mood, note = '' } = ctx.request.body;

    if (!mood) {
      const error = new Error('心情狀態不能為空');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    // 驗證心情狀態值
    const validMoods = ['good', 'normal', 'bad'];
    if (!validMoods.includes(mood)) {
      const error = new Error('心情狀態值無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const checkinResult = await Checkin.create(userId, mood, note);

    // 檢查並解鎖新成就
    const newAchievements = await Achievement.checkAndUnlockAchievements(userId);

    ctx.body = {
      code: 200,
      message: '打卡成功',
      data: {
        ...checkinResult,
        newAchievements
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 獲取打卡日曆
   */
  static async getCalendar(ctx) {
    const userId = ctx.state.user.id;
    const { year, month } = ctx.query;

    if (!year || !month) {
      const error = new Error('年份和月份參數不能為空');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (yearNum < 2020 || yearNum > 2030 || monthNum < 1 || monthNum > 12) {
      const error = new Error('年份或月份參數無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const checkinDates = await Checkin.getMonthlyCheckins(userId, yearNum, monthNum);
    const todayChecked = await Checkin.isTodayChecked(userId);
    const continuousDays = await Checkin.getContinuousDays(userId);

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        year: yearNum,
        month: monthNum,
        checkinDates: checkinDates.map(date => date.toISOString().split('T')[0]),
        todayChecked,
        continuousDays
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 獲取打卡統計
   */
  static async getStats(ctx) {
    const userId = ctx.state.user.id;
    const stats = await Checkin.getStats(userId);

    ctx.body = {
      code: 200,
      message: 'success',
      data: stats,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 獲取打卡詳情
   */
  static async getDetail(ctx) {
    const userId = ctx.state.user.id;
    const { date } = ctx.query;

    if (!date) {
      const error = new Error('日期參數不能為空');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    // 驗證日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      const error = new Error('日期格式錯誤，應為 YYYY-MM-DD');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const checkinDetail = await Checkin.getDetail(userId, date);

    if (!checkinDetail) {
      const error = new Error('該日期沒有打卡記錄');
      error.code = 404;
      error.status = 404;
      throw error;
    }

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        id: checkinDetail.id,
        checkDate: checkinDetail.check_date.toISOString().split('T')[0],
        mood: checkinDetail.mood,
        note: checkinDetail.note,
        createdAt: checkinDetail.created_at
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = CheckinController;