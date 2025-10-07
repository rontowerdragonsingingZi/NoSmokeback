const Article = require('../models/Article');

class ArticlesController {
  /**
   * 獲取資訊列表
   */
  static async getList(ctx) {
    const { page, pageSize, categoryId, keyword } = ctx.query;
    
    const result = await Article.getList({
      page,
      pageSize,
      categoryId,
      keyword
    });
    
    ctx.body = {
      code: 200,
      message: 'success',
      data: result
    };
  }
  
  /**
   * 獲取資訊詳情
   */
  static async getDetail(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.id; // 可能未登錄
    
    if (!id || isNaN(parseInt(id))) {
      const error = new Error('文章ID格式錯誤');
      error.code = 3002;
      throw error;
    }
    
    const article = await Article.getById(parseInt(id), userId);
    
    if (!article) {
      const error = new Error('文章不存在');
      error.code = 2003;
      error.status = 404;
      throw error;
    }
    
    ctx.body = {
      code: 200,
      message: 'success',
      data: article
    };
  }
  
  /**
   * 獲取文章分類
   */
  static async getCategories(ctx) {
    const categories = await Article.getCategories();
    
    ctx.body = {
      code: 200,
      message: 'success',
      data: categories
    };
  }
  
  /**
   * 點讚文章
   */
  static async like(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;
    
    if (!id || isNaN(parseInt(id))) {
      const error = new Error('文章ID格式錯誤');
      error.code = 3002;
      throw error;
    }
    
    const result = await Article.toggleLike(userId, parseInt(id));
    
    ctx.body = {
      code: 200,
      message: '操作成功',
      data: result
    };
  }
}

module.exports = ArticlesController;
