const memoryService = require('./service')
const memoryExtractorService = require('../../services/memory-extractor.service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')

class MemoryController {
  createMemory = asyncHandler(async (ctx) => {
    const { userId, content, memoryType, importance, tags, skipDeduplication } = ctx.request.body

    if (!userId || !content) {
      throw new BadRequestError('参数错误：userId 和 content 不能为空')
    }

    const result = await memoryService.createMemory(
      {
        userId,
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
      ctx.body = ResponseUtil.success(result.duplicateInfo, result.message, 200, {
        isDuplicate: true,
      })
      return
    }

    ctx.body = ResponseUtil.success(result.data, '创建成功')
  })

  retrieveMemories = asyncHandler(async (ctx) => {
    const { userId, query, limit } = ctx.request.body

    if (!userId || !query) {
      throw new BadRequestError('参数错误：userId 和 query 不能为空')
    }

    const memories = await memoryService.retrieveMemories(
      userId,
      query,
      parseInt(limit) || undefined,
    )

    ctx.body = ResponseUtil.success(memories, '检索成功')
  })

  extractMemories = asyncHandler(async (ctx) => {
    const { userId, messages, skipDeduplication } = ctx.request.body

    if (!userId || !messages || !Array.isArray(messages)) {
      throw new BadRequestError('参数错误：userId 和 messages 不能为空')
    }

    const extractedMemories = await memoryExtractorService.extractFromConversation(messages)

    const result = await memoryService.batchCreateMemories(
      extractedMemories.map((m) => ({
        ...m,
        userId,
      })),
      {
        skipDeduplication: skipDeduplication || false,
      },
    )

    ctx.body = ResponseUtil.success(
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
    const { userId, limit, offset, type, keyword } = ctx.query

    console.log('[MemoryController] Query params:', { userId, limit, offset, type, keyword })

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
      userId || null,
      finalLimit,
      parseInt(offset) || 0,
      type || null,
      keyword || null,
    )

    console.log('[MemoryController] Query result count:', result.total)

    ctx.body = ResponseUtil.success(result, '获取成功')
  })

  getMemoryStats = asyncHandler(async (ctx) => {
    const { userId } = ctx.query

    const stats = await memoryService.getMemoryStats(userId || null)

    ctx.body = ResponseUtil.success(stats, '获取成功')
  })

  updateMemory = asyncHandler(async (ctx) => {
    const { id } = ctx.params
    const updates = ctx.request.body

    const memory = await memoryService.updateMemory(id, updates)

    if (!memory) {
      throw new NotFoundError('记忆不存在')
    }

    ctx.body = ResponseUtil.success(memory, '更新成功')
  })

  deleteMemory = asyncHandler(async (ctx) => {
    const { id } = ctx.params

    const success = await memoryService.deleteMemory(id)

    if (!success) {
      throw new NotFoundError('记忆不存在')
    }

    ctx.body = ResponseUtil.success(null, '删除成功')
  })

  clearMemories = asyncHandler(async (ctx) => {
    const { userId } = ctx.request.body

    if (!userId) {
      throw new BadRequestError('参数错误：userId 不能为空')
    }

    const count = await memoryService.clearUserMemories(userId)

    ctx.body = ResponseUtil.success({ count }, `已清除 ${count} 条记忆`)
  })
}

module.exports = new MemoryController()
