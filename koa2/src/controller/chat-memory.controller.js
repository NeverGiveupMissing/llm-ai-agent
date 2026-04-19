// 说明：对话记忆控制器 - 处理会话记忆的上下文获取和自动提取

const chatMemoryService = require('../services/chat-memory.service')
const ResponseUtil = require('../utils/response')

/**
 * 对话记忆控制器 - 类似 ChatGPT 的自动记忆管理
 */
class ChatMemoryController {
  /**
   * 获取会话的记忆上下文（对话前调用）
   * 自动检索与当前会话相关的记忆，用于注入到 AI 上下文
   */
  async getSessionMemoryContext(ctx) {
    try {
      const { sessionId, userId, query } = ctx.query

      if (!sessionId || !userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 sessionId 或 userId 参数')
        return
      }

      const context = await chatMemoryService.buildMemoryContext(sessionId, userId, query)

      ctx.status = 200
      ctx.body = ResponseUtil.success(context)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取记忆上下文失败')
    }
  }

  /**
   * 自动提取对话记忆（对话后调用）
   * 从对话中自动提取有价值的长期记忆
   */
  async autoExtractMemories(ctx) {
    try {
      const { sessionId, userId, messages } = ctx.request.body

      if (!sessionId || !userId || !messages) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少必要参数')
        return
      }

      const extractedMemories = await chatMemoryService.autoExtractFromConversation(
        sessionId,
        userId,
        messages,
      )

      ctx.status = 200
      ctx.body = ResponseUtil.success(
        extractedMemories,
        `成功提取 ${extractedMemories.length} 条记忆`,
      )
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '提取记忆失败')
    }
  }

  /**
   * 获取会话记忆列表
   */
  async getSessionMemories(ctx) {
    try {
      const { sessionId } = ctx.query

      if (!sessionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 sessionId 参数')
        return
      }

      const result = await chatMemoryService.getSessionMemories(sessionId)
      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取记忆列表失败')
    }
  }

  /**
   * 清空会话记忆
   */
  async clearMemories(ctx) {
    try {
      const { sessionId } = ctx.params

      if (!sessionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 sessionId 参数')
        return
      }

      const result = await chatMemoryService.clearSessionMemories(sessionId)
      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '清空记忆失败')
    }
  }
}

module.exports = new ChatMemoryController()
