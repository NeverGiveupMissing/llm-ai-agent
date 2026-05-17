const memoryService = require('./service')
const memoryExtractorService = require('../../services/memory-extractor.service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')

class MemoryController {
  createMemory = asyncHandler(async (ctx) => {
    const { user_id, content, memoryType, importance, tags, skipDeduplication } = ctx.request.body

    if (!user_id || !content) {
      throw new BadRequestError('参数错误：user_id 和 content 不能为空')
    }

    const result = await memoryService.createMemory(
      {
        user_id,
        content,
        memoryType,
        importance,
        tags,
        source: 'manual',
      },
      {
        skipDeduplication: skipDeduplication || false,
      },
    )

    if (result.isDuplicate) {
      ctx.success(result.duplicateInfo, result.message)
      return
    }

    ctx.success(result.data, '创建成功')
  })

  retrieveMemories = asyncHandler(async (ctx) => {
    const { user_id, query, limit } = ctx.request.body

    if (!user_id || !query) {
      throw new BadRequestError('参数错误：user_id 和 query 不能为空')
    }

    const memories = await memoryService.retrieveMemories(
      user_id,
      query,
      parseInt(limit) || undefined,
    )

    ctx.success(memories, '检索成功')
  })

  extractMemories = asyncHandler(async (ctx) => {
    const { user_id, messages, skipDeduplication } = ctx.request.body

    if (!user_id || !messages || !Array.isArray(messages)) {
      throw new BadRequestError('参数错误：user_id 和 messages 不能为空')
    }

    const extractedMemories = await memoryExtractorService.extractFromConversation(messages)

    const result = await memoryService.batchCreateMemories(
      extractedMemories.map((m) => ({
        ...m,
        user_id,
      })),
      {
        skipDeduplication: skipDeduplication || false,
      },
    )

    ctx.success(
      {
        created: result.created,
        skipped: result.skipped,
        statistics: {
          total: result.total,
          createdCount: result.createdCount,
          skippedCount: result.skippedCount,
        },
      },
      `提取完成：创建 ${result.createdCount} 条，跳过 ${result.skippedCount} 条重复记忆`,
    )
  })

  getMemories = asyncHandler(async (ctx) => {
    const { user_id, limit, offset, type, keyword } = ctx.query

    // ✅ 将 user_id 转换为整数（与数据库 INT 类型一致）
    const userIdInt = user_id ? parseInt(user_id) : null

    console.log('[MemoryController] Query params:', { user_id: userIdInt, limit, offset, type, keyword })

    let finalLimit = 20
    if (limit !== undefined && limit !== null) {
      const limitValue = parseInt(limit)
      if (limitValue <= 0) {
        finalLimit = null
      } else {
        finalLimit = Math.min(limitValue, 1000)
      }
    }

    const result = await memoryService.getUserMemories(
      userIdInt,
      finalLimit,
      parseInt(offset) || 0,
      type || null,
      keyword || null,
    )

    console.log('[MemoryController] Query result count:', result.total)

    // 使用统一的分页响应方法
    ctx.pageSuccess(
      result.list,
      result.total,
      result.page,
      result.limit
    )
  })

  getMemoryStats = asyncHandler(async (ctx) => {
    const { user_id } = ctx.query

    // ✅ 将 user_id 转换为整数
    const userIdInt = user_id ? parseInt(user_id) : null

    const stats = await memoryService.getMemoryStats(userIdInt)

    ctx.success(stats, '获取成功')
  })

  updateMemory = asyncHandler(async (ctx) => {
    const { id } = ctx.params
    const updates = ctx.request.body

    const memory = await memoryService.updateMemory(id, updates)

    if (!memory) {
      throw new NotFoundError('记忆不存在')
    }

    ctx.success(memory, '更新成功')
  })

  deleteMemory = asyncHandler(async (ctx) => {
    const { id } = ctx.params

    const success = await memoryService.deleteMemory(id)

    if (!success) {
      throw new NotFoundError('记忆不存在')
    }

    ctx.success(null, '删除成功')
  })

  clearMemories = asyncHandler(async (ctx) => {
    const { user_id } = ctx.request.body

    if (!user_id) {
      throw new BadRequestError('参数错误：user_id 不能为空')
    }

    // ✅ 将 user_id 转换为整数
    const userIdInt = parseInt(user_id)

    const count = await memoryService.clearUserMemories(userIdInt)

    ctx.success({ count }, `已清除 ${count} 条记忆`)
  })
}

module.exports = new MemoryController()
