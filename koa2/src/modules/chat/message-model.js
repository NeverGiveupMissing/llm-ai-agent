// 说明：聊天消息数据模型 - 存储和查询消息记录

const { pool } = require('../../config/db')

class ChatMessageModel {
  /**
   * 创建消息记录
   * @param {string} sessionId - 会话ID
   * @param {string} role - 角色 (user/assistant/system)
   * @param {string} content - 消息内容
   * @param {object} metadata - 额外元数据
   * @param {number} userId - 用户ID（必填）
   */
  async create(sessionId, role, content, metadata = {}, userId) {
    // 🔥 如果没有提供 userId，尝试从 session 中查询
    if (!userId) {
      try {
        const sessionQuery = `SELECT user_id FROM chat_sessions WHERE id = $1`
        const sessionResult = await pool.query(sessionQuery, [sessionId])
        if (sessionResult.rows.length > 0) {
          userId = sessionResult.rows[0].user_id
        }
      } catch (error) {
        console.error('⚠️ 获取 session user_id 失败:', error.message)
      }
    }

    const query = `
      INSERT INTO chat_messages (session_id, user_id, role, content, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await pool.query(query, [sessionId, userId, role, content, JSON.stringify(metadata)])
    return result.rows[0]
  }

  /**
   * 获取会话的所有消息
   * @param {string} sessionId - 会话ID
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   */
  async getBySessionId(sessionId, limit = 100, offset = 0) {
    const query = `
      SELECT id, session_id, role, content, metadata, created_at
      FROM chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `
    const result = await pool.query(query, [sessionId, limit, offset])
    return result.rows
  }

  /**
   * 获取会话的最新消息
   * @param {string} sessionId - 会话ID
   * @param {number} limit - 限制数量
   */
  async getLatest(sessionId, limit = 10) {
    const query = `
      SELECT id, session_id, role, content, metadata, created_at
      FROM chat_messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `
    const result = await pool.query(query, [sessionId, limit])
    // 反转顺序，让旧消息在前
    return result.rows.reverse()
  }

  /**
   * 删除会话的所有消息
   * @param {string} sessionId - 会话ID
   */
  async deleteBySessionId(sessionId) {
    const query = `
      DELETE FROM chat_messages WHERE session_id = $1
    `
    await pool.query(query, [sessionId])
  }

  /**
   * 删除单条消息
   * @param {string} messageId - 消息ID
   */
  async deleteById(messageId) {
    const query = `
      DELETE FROM chat_messages WHERE id = $1
      RETURNING *
    `
    const result = await pool.query(query, [messageId])
    return result.rows[0]
  }

  /**
   * 更新消息内容
   * @param {string} messageId - 消息ID
   * @param {string} content - 新内容
   */
  async update(messageId, content) {
    const query = `
      UPDATE chat_messages
      SET content = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `
    const result = await pool.query(query, [content, messageId])
    return result.rows[0]
  }

  /**
   * 批量插入消息
   * @param {string} sessionId - 会话ID
   * @param {Array} messages - 消息数组 [{role, content, metadata}]
   */
  async batchCreate(sessionId, messages) {
    if (messages.length === 0) return []

    const values = []
    const placeholders = messages.map((_, i) => {
      const baseIndex = i * 4 + 1
      return `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`
    })

    messages.forEach((msg) => {
      values.push(sessionId, msg.role, msg.content, JSON.stringify(msg.metadata || {}))
    })

    const query = `
      INSERT INTO chat_messages (session_id, role, content, metadata)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows
  }
}

module.exports = new ChatMessageModel()
