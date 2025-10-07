const Feedback = require('../models/Feedback');

class SystemController {
  /**
   * 提交意見反饋
   */
  static async submitFeedback(ctx) {
    const userId = ctx.state.user.id;
    const { type, content, contact } = ctx.request.body;

    // 參數驗證
    if (!type || !content) {
      const error = new Error('反饋類型和內容不能為空');
      error.code = 3001;
      error.status = 400;
      throw error;
    }

    // 驗證反饋類型
    const validTypes = ['bug', 'suggestion'];
    if (!validTypes.includes(type)) {
      const error = new Error('反饋類型無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    // 內容長度驗證
    if (content.length > 1000) {
      const error = new Error('反饋內容過長');
      error.code = 3003;
      error.status = 400;
      throw error;
    }

    const feedbackId = await Feedback.create(userId, type, content, contact);

    ctx.body = {
      code: 200,
      message: '反饋提交成功',
      data: {
        feedbackId
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 獲取用戶反饋列表
   */
  static async getFeedbackList(ctx) {
    const userId = ctx.state.user.id;
    const { page = 1, pageSize = 10 } = ctx.query;

    const pageNum = parseInt(page);
    const sizeNum = parseInt(pageSize);

    if (pageNum < 1 || sizeNum < 1 || sizeNum > 50) {
      const error = new Error('頁碼或每頁數量參數無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const result = await Feedback.getByUserId(userId, pageNum, sizeNum);

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        list: result.list.map(feedback => ({
          id: feedback.id,
          type: feedback.type,
          content: feedback.content,
          contact: feedback.contact,
          status: feedback.status,
          createdAt: feedback.created_at,
          updatedAt: feedback.updated_at
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 健康檢查接口
   */
  static async healthCheck(ctx) {
    ctx.body = {
      code: 200,
      message: '服務正常運行',
      data: {
        timestamp: Math.floor(Date.now() / 1000),
        version: '1.0.0',
        uptime: process.uptime()
      },
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = SystemController;