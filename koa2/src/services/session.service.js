// 说明：会话业务逻辑 - 处理会话的创建、更新、标题生成

const sessionModel = require('../models/session.model')

class SessionService {
  /**
   * 创建新会话
   */
  async createSession(userId) {
    const session = await sessionModel.create(userId)
    return {
      success: true,
      data: session,
      message: '会话创建成功',
    }
  }

  /**
   * 获取用户会话列表
   */
  async listSessions(userId, limit = 20) {
    const sessions = await sessionModel.list(userId, limit)
    return {
      success: true,
      data: sessions,
      total: sessions.length,
    }
  }

  /**
   * 更新会话（标题、消息计数）
   */
  async updateSession(sessionId, updates) {
    const session = await sessionModel.update(sessionId, updates)
    if (!session) {
      throw new Error('会话不存在')
    }
    return {
      success: true,
      data: session,
      message: '会话更新成功',
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId) {
    const deleted = await sessionModel.delete(sessionId)
    if (!deleted) {
      throw new Error('会话不存在')
    }
    return {
      success: true,
      message: '会话删除成功',
    }
  }

  /**
   * 从消息中提取会话标题（取第一条用户消息前 20 字）
   */
  extractTitleFromMessages(messages) {
    const firstUserMsg = messages.find((m) => m.role === 'user')
    if (!firstUserMsg) return '新对话'

    const content = firstUserMsg.content.trim()
    return content.length > 20 ? content.substring(0, 20) + '...' : content
  }
}

module.exports = new SessionService()
