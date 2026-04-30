// 说明：对话记忆控制器 - 处理会话记忆的上下文获取和自动提取

const chatMemoryService = require('./service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

/**
 * 对话记忆控制器 - 类似 ChatGPT 的自动记忆管理
 */
class ChatMemoryController {
  /**
   * 获取会话的记忆上下文（对话前调用）
   * 自动检索与当前会话相关的记忆，用于注入到 AI 上下文
   */
  getSessionMemoryContext = asyncHandler(async (ctx) => {
    const { sessionId, userId, query } = ctx.query
  
    if (!sessionId || !userId) {
      throw new BadRequestError('缺少 sessionId 或 userId 参数')
    }
  
    const context = await chatMemoryService.buildMemoryContext(sessionId, userId, query)
  
    ctx.body = ResponseUtil.success(context)
  })

  /**
   * 自动提取对话记忆（对话后调用）
   * 从对话中自动提取有价值的长期记忆
   */
  autoExtractMemories = asyncHandler(async (ctx) => {
    const { sessionId, userId, messages } = ctx.request.body
  
    if (!sessionId || !userId || !messages) {
      throw new BadRequestError('缺少必要参数')
    }
  
    const result = await chatMemoryService.autoExtractFromConversation(
      sessionId,
      userId,
      messages,
    )
  
    ctx.body = ResponseUtil.success(
      {
        created: result.created || [],
        statistics: {
          totalCount: result.totalCount || 0,
          skippedCount: result.skippedCount || 0,
          filteredCount: result.filteredCount || 0,
          duplicateCount: result.duplicateCount || 0,
        },
      },
      `成功提取 ${result.created?.length || 0} 条记忆`,
    )
  })

  /**
   * 获取会话记忆列表
   */
  getSessionMemories = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.query
  
    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }
  
    const result = await chatMemoryService.getSessionMemories(sessionId)
    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 清空会话记忆
   */
  clearMemories = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
  
    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }
  
    const result = await chatMemoryService.clearSessionMemories(sessionId)
    ctx.body = ResponseUtil.success(null, result.message)
  })
}

module.exports = new ChatMemoryController()
