const { query } = require('../utils/database');

class Article {
  /**
   * 獲取文章列表（分頁）
   */
  static async getList(options = {}) {
    const { 
      page = 1, 
      pageSize = 10, 
      categoryId = null, 
      keyword = null 
    } = options;
    
    // 確保 page 和 pageSize 是數字
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;
    
    let sql = `
      SELECT id, title, summary, cover_image, category_id, 
             author, view_count, like_count, publish_time
      FROM articles 
      WHERE status = 1
    `;
    const params = [];

    // 分類篩選
    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    // 關鍵詞搜索
    if (keyword) {
      sql += ' AND (title LIKE ? OR summary LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY publish_time DESC';

    // 分頁（LIMIT 和 OFFSET 不能使用占位符，需要直接拼接）
    const offset = (pageNum - 1) * pageSizeNum;
    sql += ` LIMIT ${pageSizeNum} OFFSET ${offset}`;

    const articles = await query(sql, params);

    // 獲取總數
    let countSql = `
      SELECT COUNT(*) as total FROM articles 
      WHERE status = 1
    `;
    const countParams = [];

    if (categoryId) {
      countSql += ' AND category_id = ?';
      countParams.push(categoryId);
    }

    if (keyword) {
      countSql += ' AND (title LIKE ? OR summary LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    return {
      list: articles,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      hasMore: pageNum * pageSizeNum < total
    };
  }

  /**
   * 根據ID獲取文章詳情
   */
  static async getById(id, userId = null) {
    const sql = `
      SELECT * FROM articles 
      WHERE id = ? AND status = 1
    `;

    const result = await query(sql, [id]);
    if (result.length === 0) return null;

    const article = result[0];

    // 增加查看次數
    await query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);
    article.view_count += 1;

    // 檢查用戶是否已點讚
    let isLiked = false;
    if (userId) {
      const likeSql = 'SELECT id FROM article_likes WHERE user_id = ? AND article_id = ?';
      const likeResult = await query(likeSql, [userId, id]);
      isLiked = likeResult.length > 0;
    }

    return {
      ...article,
      isLiked
    };
  }

  /**
   * 點讚或取消點讚
   */
  static async toggleLike(userId, articleId) {
    // 檢查文章是否存在
    const article = await query('SELECT id FROM articles WHERE id = ? AND status = 1', [articleId]);
    if (article.length === 0) {
      const error = new Error('文章不存在');
      error.code = 2003;
      error.status = 404;
      throw error;
    }

    // 檢查是否已點讚
    const existLike = await query('SELECT id FROM article_likes WHERE user_id = ? AND article_id = ?', [userId, articleId]);
    
    let isLiked;
    if (existLike.length > 0) {
      // 取消點讚
      await query('DELETE FROM article_likes WHERE user_id = ? AND article_id = ?', [userId, articleId]);
      await query('UPDATE articles SET like_count = like_count - 1 WHERE id = ?', [articleId]);
      isLiked = false;
    } else {
      // 點讚
      await query('INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)', [userId, articleId]);
      await query('UPDATE articles SET like_count = like_count + 1 WHERE id = ?', [articleId]);
      isLiked = true;
    }

    // 獲取最新點讚數
    const likeCountResult = await query('SELECT like_count FROM articles WHERE id = ?', [articleId]);
    const likeCount = likeCountResult[0].like_count;

    return {
      isLiked,
      likeCount
    };
  }

  /**
   * 獲取文章分類列表
   */
  static async getCategories() {
    const sql = `
      SELECT category_id as id, 
             category_id as name, 
             COUNT(*) as article_count
      FROM articles 
      WHERE status = 1
      GROUP BY category_id
      ORDER BY article_count DESC, category_id ASC
    `;

    const categories = await query(sql);
    
    // 為分類添加中文名稱映射
    const categoryMap = {
      'health': '健康知識',
      'method': '戒煙方法', 
      'psychology': '心理調節',
      'experience': '成功經驗',
      'tips': '戒煙技巧',
      'story': '戒煙故事'
    };

    return categories.map(cat => ({
      id: cat.id,
      name: categoryMap[cat.id] || cat.id,
      articleCount: cat.article_count
    }));
  }
}

module.exports = Article;