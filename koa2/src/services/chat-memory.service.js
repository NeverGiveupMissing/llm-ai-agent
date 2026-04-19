// 说明：对话记忆服务 - 实现自动记忆上下文构建和对话记忆提取

const memoryService = require('../services/memory.service')
const aiService = require('../services/ai.service')

/**
 * 对话记忆服务 - 自动记忆管理
 */
class ChatMemoryService {
  /**
   * 构建记忆上下文（对话前调用）
   * 检索相关记忆并格式化为系统提示
   */
  async buildMemoryContext(sessionId, userId, query = null) {
    let relevantMemories = []

    // 如果有查询内容，进行向量检索
    if (query) {
      relevantMemories = await memoryService.retrieveMemories(userId, query, 5)
    } else {
      // 否则获取会话相关记忆
      const chatMemoryModel = require('../models/chat-memory.model')
      relevantMemories = await chatMemoryModel.getSessionMemories(sessionId)
      relevantMemories = relevantMemories.slice(0, 5)
    }

    // 格式化为上下文文本
    const memoryContext =
      relevantMemories.length > 0
        ? `相关记忆：\n${relevantMemories.map((m) => `- ${m.content}`).join('\n')}`
        : ''

    return {
      memories: relevantMemories,
      context: memoryContext,
      count: relevantMemories.length,
    }
  }

  /**
   * 自动从对话中提取记忆（对话后调用）
   * 使用 AI 分析对话内容，提取有价值的长期记忆
   */
  async autoExtractFromConversation(sessionId, userId, messages) {
    // 只处理用户消息
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n')

    // 对话太短，不提取记忆
    if (userMessages.length < 10) {
      return []
    }

    // 构建提取提示词
    const extractPrompt = `你是一个记忆提取专家。请从以下对话中提取有价值的长期记忆。

提取规则：
1. 只提取关于用户的长期信息（偏好、事实、目标、经历等）
2. 忽略临时性、对话性的内容
3. 每条记忆应该简洁明了
4. 重要性评分 1-10

对话内容：
${userMessages}

请以 JSON 数组格式返回，格式如下：
[
  {"content": "记忆内容", "type": "fact/preference/goal/event", "importance": 8, "tags": ["标签1"]}
]

如果没有任何有价值的记忆，返回空数组 []。`

    const extractionMessages = [
      { role: 'system', content: '你是一个专业的记忆提取助手。' },
      { role: 'user', content: extractPrompt },
    ]

    try {
      // 调用 AI 提取记忆
      const extractionResult = await aiService.callAiNonStream(extractionMessages)
      const jsonMatch = extractionResult.match(/\[[\s\S]*\]/)

      if (!jsonMatch) {
        return []
      }

      // 解析提取的记忆
      const extractedMemories = JSON.parse(jsonMatch[0])

      // 保存到数据库
      const createdMemories = []
      for (const memory of extractedMemories) {
        const createdMemory = await memoryService.createMemory({
          userId,
          sessionId,
          content: memory.content,
          memoryType: memory.type || 'fact',
          importance: memory.importance || 5,
          tags: memory.tags || [],
          source: 'auto_extract',
        })
        createdMemories.push(createdMemory)
      }

      return createdMemories
    } catch (error) {
      console.error('自动提取记忆失败:', error)
      return []
    }
  }

  /**
   * 获取会话记忆列表
   */
  async getSessionMemories(sessionId) {
    const chatMemoryModel = require('../models/chat-memory.model')
    const memories = await chatMemoryModel.getSessionMemories(sessionId)
    return {
      success: true,
      data: {
        memories,
        total: memories.length,
      },
    }
  }

  /**
   * 清空会话记忆
   */
  async clearSessionMemories(sessionId) {
    const chatMemoryModel = require('../models/chat-memory.model')
    await chatMemoryModel.clearSessionMemories(sessionId)
    return {
      success: true,
      message: '会话记忆已清空',
    }
  }
}

module.exports = new ChatMemoryService()
