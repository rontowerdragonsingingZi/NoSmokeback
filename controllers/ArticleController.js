const Article = require('../models/Article');

class ArticleController {
  /**
   * 獲取文章列表
   */
  static async getList(ctx) {
    const { page = 1, pageSize = 10, categoryId, keyword } = ctx.query;

    // 參數驗證
    const pageNum = parseInt(page);
    const sizeNum = parseInt(pageSize);

    if (pageNum < 1 || sizeNum < 1 || sizeNum > 50) {
      const error = new Error('頁碼或每頁數量參數無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const result = await Article.getList(pageNum, sizeNum, categoryId, keyword);

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        list: result.list.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          coverImage: article.cover_image,
          categoryId: article.category_id,
          author: article.author,
          viewCount: article.view_count,
          likeCount: article.like_count,
          publishTime: article.publish_time
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
   * 獲取文章詳情
   */
  static async getDetail(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user?.id || null;

    const articleId = parseInt(id);
    if (!articleId) {
      const error = new Error('文章ID無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const article = await Article.getById(articleId, userId);

    if (!article) {
      const error = new Error('文章不存在');
      error.code = 2003;
      error.status = 404;
      throw error;
    }

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        id: article.id,
        title: article.title,
        content: article.content,
        coverImage: article.cover_image,
        categoryId: article.category_id,
        author: article.author,
        viewCount: article.view_count,
        likeCount: article.like_count,
        shareCount: article.share_count,
        publishTime: article.publish_time,
        isLiked: article.isLiked
      },
      timestamp: Math.floor(Date.now() / 1000)
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
      data: categories.map(category => ({
        id: category.id,
        name: category.name,
        articleCount: category.article_count
      })),
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * 點讚文章
   */
  static async likeArticle(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;

    const articleId = parseInt(id);
    if (!articleId) {
      const error = new Error('文章ID無效');
      error.code = 3002;
      error.status = 400;
      throw error;
    }

    const result = await Article.toggleLike(articleId, userId);

    ctx.body = {
      code: 200,
      message: '操作成功',
      data: result,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = ArticleController;
