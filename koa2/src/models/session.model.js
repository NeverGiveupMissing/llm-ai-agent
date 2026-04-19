// 说明：会话数据模型 - 管理聊天会话的创建、查询、删除

const { pool } = require('../config/db')

class SessionModel {
  /**
   * 创建新会话
   */
  async create(userId, title = '新对话') {
    const query = `
      INSERT INTO chat_sessions (user_id, title, message_count)
      VALUES ($1, $2, 0)
      RETURNING *
    `
    const result = await pool.query(query, [userId, title])
    return result.rows[0]
  }

  /**
   * 获取用户的会话列表（按时间倒序）
   */
  async list(userId, limit = 20) {
    const query = `
      SELECT id, user_id, title, message_count, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2
    `
    const result = await pool.query(query, [userId, limit])
    return result.rows
  }

  /**
   * 根据 ID 获取会话
   */
  async getById(sessionId) {
    const query = `
      SELECT * FROM chat_sessions WHERE id = $1
    `
    const result = await pool.query(query, [sessionId])
    return result.rows[0] || null
  }

  /**
   * 更新会话标题和消息计数
   */
  async update(sessionId, updates) {
    const fields = []
    const values = []
    let idx = 1

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`)
      values.push(updates.title)
    }
    if (updates.message_count !== undefined) {
      fields.push(`message_count = $${idx++}`)
      values.push(updates.message_count)
    }

    fields.push(`updated_at = NOW()`)
    values.push(sessionId)

    const query = `
      UPDATE chat_sessions
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 删除会话
   */
  async delete(sessionId) {
    const query = `
      DELETE FROM chat_sessions WHERE id = $1 RETURNING id
    `
    const result = await pool.query(query, [sessionId])
    return result.rows.length > 0
  }

  /**
   * 获取会话的第一条用户消息（用于生成标题）
   */
  async getFirstUserMessage(sessionId) {
    // 从日志文件中查询（简化版：直接返回 null，由前端或控制器处理）
    return null
  }
}

module.exports = new SessionModel()
