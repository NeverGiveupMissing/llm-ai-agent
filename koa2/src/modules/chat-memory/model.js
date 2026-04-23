const { pool } = require('../../config/db')

/**
 * 对话记忆关联模型
 */
class ChatMemoryModel {
  /**
   * 为会话添加记忆关联
   * @param {string} sessionId - 会话ID
   * @param {number} memoryId - 记忆ID
   */
  async addMemory(sessionId, memoryId) {
    const query = `
      INSERT INTO chat_memories (session_id, memory_id)
      VALUES ($1, $2)
      ON CONFLICT (session_id, memory_id) DO NOTHING
      RETURNING *
    `
    const result = await pool.query(query, [sessionId, memoryId])
    return result.rows[0]
  }

  /**
   * 获取会话关联的所有记忆
   * @param {string} sessionId - 会话ID
   */
  async getSessionMemories(sessionId) {
    const query = `
      SELECT m.*, cm.created_at as linked_at
      FROM memories m
      INNER JOIN chat_memories cm ON m.id = cm.memory_id
      WHERE cm.session_id = $1
      ORDER BY cm.created_at DESC
    `
    const result = await pool.query(query, [sessionId])
    return result.rows
  }

  /**
   * 移除会话的记忆关联
   * @param {string} sessionId - 会话ID
   * @param {number} memoryId - 记忆ID
   */
  async removeMemory(sessionId, memoryId) {
    const query = `
      DELETE FROM chat_memories
      WHERE session_id = $1 AND memory_id = $2
      RETURNING *
    `
    const result = await pool.query(query, [sessionId, memoryId])
    return result.rows[0]
  }

  /**
   * 清空会话的所有记忆关联
   * @param {string} sessionId - 会话ID
   */
  async clearSessionMemories(sessionId) {
    const query = `
      DELETE FROM chat_memories
      WHERE session_id = $1
      RETURNING *
    `
    const result = await pool.query(query, [sessionId])
    return result.rows
  }
}

module.exports = new ChatMemoryModel()
