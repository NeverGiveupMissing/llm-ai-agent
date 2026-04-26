// 说明：会话业务逻辑 - 处理会话的创建、更新、标题生成

const sessionModel = require('./model')
const ChatMessageService = require('../chat/message-service')

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
    console.log('🟢 [Service] 收到更新请求:', { sessionId, updates })

    try {
      const session = await sessionModel.update(sessionId, updates)
      console.log('🟢 [Service] Model 返回:', session)

      // ✅ 如果会话不存在，静默跳过而不是报错
      if (!session) {
        console.warn(`⚠️ 会话 ${sessionId} 不存在，跳过更新`)
        return {
          success: true,
          data: null,
          message: '会话不存在，已跳过更新',
        }
      }

      return {
        success: true,
        data: session,
        message: '会话更新成功',
      }
    } catch (error) {
      console.error('❌ [Service] 更新失败:', error)
      throw error
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId) {
    // 先删除该会话的所有消息
    try {
      await ChatMessageService.deleteSessionMessages(sessionId)
      console.log(`✅ 已删除会话 ${sessionId} 的所有消息`)
    } catch (error) {
      console.error(`⚠️ 删除会话消息失败:`, error.message)
    }

    // 再删除会话
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
   * 从消息中智能生成会话标题
   * 策略:基于所有消息内容提取关键主题
   */
  extractTitleFromMessages(messages) {
    if (!messages || messages.length === 0) return '新对话'

    // 提取所有用户消息
    const userMessages = messages.filter((m) => m.role === 'user')
    if (userMessages.length === 0) return '新对话'

    // 策略1:如果只有一条消息,直接返回完整内容
    if (userMessages.length === 1) {
      const content = userMessages[0].content.trim()
      return content // 返回完整内容,不截断
    }

    // 策略2:多条消息时,尝试提取关键词
    // 合并所有用户消息
    const allContent = userMessages.map((m) => m.content.trim()).join(' ')
    
    // 去除常见停用词
    const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那']
    const words = allContent.split(/[\s,，。！？、；：""''（）【】《》]+/)
      .filter(w => w.length > 1 && !stopWords.includes(w))
    
    // 取前3个关键词组合作为标题
    if (words.length >= 3) {
      const title = words.slice(0, 3).join(' ')
      return title // 返回完整关键词组合,不截断
    }
    
    // 策略3:如果关键词不足,返回第一条消息的完整内容
    const firstContent = userMessages[0].content.trim()
    return firstContent // 返回完整内容,不截断
  }
}

module.exports = new SessionService()
