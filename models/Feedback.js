const { query } = require('../utils/database');

class Feedback {
  /**
   * 創建反饋
   */
  static async create(userId, type, content, contact = null) {
    const sql = `
      INSERT INTO feedback (user_id, type, content, contact)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sql, [userId, type, content, contact]);
    return result.insertId;
  }

  /**
   * 根據ID獲取反饋
   */
  static async getById(id) {
    const sql = `
      SELECT f.*, u.nickname as user_nickname
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `;

    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 獲取用戶反饋列表
   */
  static async getByUserId(userId, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    
    const sql = `
      SELECT id, type, content, contact, status, created_at, updated_at
      FROM feedback
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const feedbacks = await query(sql, [userId, pageSize, offset]);

    // 獲取總數
    const countSql = 'SELECT COUNT(*) as total FROM feedback WHERE user_id = ?';
    const countResult = await query(countSql, [userId]);
    const total = countResult[0].total;

    return {
      list: feedbacks,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total
    };
  }

  /**
   * 更新反饋狀態
   */
  static async updateStatus(id, status) {
    const sql = 'UPDATE feedback SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await query(sql, [status, id]);
    return await this.getById(id);
  }
}

module.exports = Feedback;