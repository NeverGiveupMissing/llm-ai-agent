// 说明：聊天消息服务层 - 处理消息的业务逻辑

const ChatMessageModel = require('./message-model')
const SessionModel = require('../session/model')

class ChatMessageService {
  /**
   * 保存用户消息
   */
  async saveUserMessage(sessionId, content) {
    const message = await ChatMessageModel.create(sessionId, 'user', content)
    // 更新会话的消息计数
    await this.updateMessageCount(sessionId)
    return message
  }

  /**
   * 保存AI回复消息
   */
  async saveAssistantMessage(sessionId, content) {
    const message = await ChatMessageModel.create(sessionId, 'assistant', content)
    // 更新会话的消息计数
    await this.updateMessageCount(sessionId)
    return message
  }

  /**
   * 获取会话的消息历史
   * @param {string} sessionId - 会话ID
   * @param {number} limit - 限制数量（默认100）
   * @param {number} offset - 偏移量
   */
  async getSessionMessages(sessionId, limit = 100, offset = 0) {
    return await ChatMessageModel.getBySessionId(sessionId, limit, offset)
  }

  /**
   * 获取会话的最新消息
   */
  async getLatestMessages(sessionId, limit = 10) {
    return await ChatMessageModel.getLatest(sessionId, limit)
  }

  /**
   * 删除会话的所有消息
   */
  async deleteSessionMessages(sessionId) {
    await ChatMessageModel.deleteBySessionId(sessionId)
  }

  /**
   * 批量保存消息
   */
  async saveBatchMessages(sessionId, messages) {
    const savedMessages = await ChatMessageModel.batchCreate(sessionId, messages)
    await this.updateMessageCount(sessionId)
    return savedMessages
  }

  /**
   * 更新会话的消息计数
   */
  async updateMessageCount(sessionId) {
    try {
      const { pool } = require('../../config/db')
      const countQuery = `
        SELECT COUNT(*) as count FROM chat_messages WHERE session_id = $1
      `
      const result = await pool.query(countQuery, [sessionId])
      const count = parseInt(result.rows[0].count)
      await SessionModel.update(sessionId, { message_count: count })
    } catch (error) {
      console.error('⚠️ 更新消息计数失败:', error.message)
    }
  }
}

module.exports = new ChatMessageService()
