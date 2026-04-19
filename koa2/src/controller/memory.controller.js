const memoryService = require('../services/memory.service')
const memoryExtractorService = require('../services/memory-extractor.service')
const ResponseUtil = require('../utils/response')

class MemoryController {
  async createMemory(ctx) {
    try {
      const { userId, content, memoryType, importance, tags } = ctx.request.body

      if (!userId || !content) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('参数错误：userId 和 content 不能为空')
        return
      }

      const memory = await memoryService.createMemory({
        userId,
        content,
        memoryType,
        importance,
        tags,
        source: 'manual',
      })

      ctx.status = 200
      ctx.body = ResponseUtil.success(memory, '创建成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async retrieveMemories(ctx) {
    try {
      const { userId, query, limit } = ctx.request.body

      if (!userId || !query) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('参数错误：userId 和 query 不能为空')
        return
      }

      const memories = await memoryService.retrieveMemories(
        userId,
        query,
        parseInt(limit) || undefined,
      )

      ctx.status = 200
      ctx.body = ResponseUtil.success(memories, '检索成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async extractMemories(ctx) {
    try {
      const { userId, messages } = ctx.request.body

      if (!userId || !messages || !Array.isArray(messages)) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('参数错误：userId 和 messages 不能为空')
        return
      }

      const extractedMemories = await memoryExtractorService.extractFromConversation(messages)

      const createdMemories = await memoryService.batchCreateMemories(
        extractedMemories.map((m) => ({
          ...m,
          userId,
        })),
      )

      ctx.status = 200
      ctx.body = ResponseUtil.success(createdMemories, '提取成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async getMemories(ctx) {
    try {
      const { userId, limit, offset, type } = ctx.query

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
      )

      ctx.status = 200
      ctx.body = ResponseUtil.success(result, '获取成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async getMemoryStats(ctx) {
    try {
      const { userId } = ctx.query

      const stats = await memoryService.getMemoryStats(userId || null)

      ctx.status = 200
      ctx.body = ResponseUtil.success(stats, '获取成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async updateMemory(ctx) {
    try {
      const { id } = ctx.params
      const updates = ctx.request.body

      const memory = await memoryService.updateMemory(id, updates)

      if (!memory) {
        ctx.status = 404
        ctx.body = ResponseUtil.notFound('记忆不存在')
        return
      }

      ctx.status = 200
      ctx.body = ResponseUtil.success(memory, '更新成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async deleteMemory(ctx) {
    try {
      const { id } = ctx.params

      const success = await memoryService.deleteMemory(id)

      if (!success) {
        ctx.status = 404
        ctx.body = ResponseUtil.notFound('记忆不存在')
        return
      }

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, '删除成功')
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }

  async clearMemories(ctx) {
    try {
      const { userId } = ctx.request.body

      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('参数错误：userId 不能为空')
        return
      }

      const count = await memoryService.clearUserMemories(userId)

      ctx.status = 200
      ctx.body = ResponseUtil.success({ count }, `已清除 ${count} 条记忆`)
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message)
    }
  }
}

module.exports = new MemoryController()
