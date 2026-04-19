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

    // 构建提取提示词（优化版）
    const extractPrompt = `你是一个专业的记忆提取专家。请从以下对话中提取有价值的**长期记忆**。

## 📋 记忆类型定义

| 类型 | 说明 | 示例 |
|------|------|------|
| fact（事实） | 用户的基本信息、背景 | "我是大学生"、"我住在上海" |
| preference（偏好） | 用户的喜好、倾向 | "我喜欢 Python"、"我更习惯使用 Vue" |
| goal（目标） | 用户的长期目标、计划 | "我想学习人工智能"、"我计划考研究生" |
| event（经历） | 用户的重要经历、经验 | "我参加过编程比赛"、"我实习过前端开发" |

## ✅ 应该提取的记忆

**高价值信息（importance >= 7）：**
- 用户的身份、职业、学历
- 重要的个人偏好和习惯
- 长期的目标和计划
- 关键的技术栈偏好
- 重要的个人经历

**中等价值信息（importance 4-6）：**
- 一般性的兴趣爱好
- 短期内的计划
- 辅助性的背景信息

## ❌ 不应提取的内容

**低价值信息（直接忽略）：**
- 临时性问题（如"今天天气怎么样"）
- 对话中的客套话（如"谢谢"、"好的"）
- 技术细节讨论（如代码实现细节）
- 重复的确认性内容
- 一次性任务请求（如"帮我写个周报"）

## 📝 提取要求

1. **简洁明确**：每条记忆不超过 50 字
2. **第一人称视角**：用"我"来描述（如"我是大学生"而非"用户是大学生"）
3. **长期有效**：只提取至少在 1 个月内仍然有效的信息
4. **避免重复**：如果已存在相似记忆，不要重复提取
5. **合理评分**：
   - 10 分：极其重要（身份、核心目标）
   - 7-9 分：重要（主要偏好、关键经历）
   - 4-6 分：一般（兴趣爱好、辅助信息）
   - 1-3 分：可忽略

## 📄 返回格式

请以 JSON 数组格式返回，格式如下：

\`\`\`json
[
  {
    "content": "记忆内容（简洁明了）",
    "type": "fact/preference/goal/event",
    "importance": 8,
    "tags": ["标签1", "标签2"]
  }
]
\`\`\`

**标签建议：**
- 事实类：身份、地点、职业、教育
- 偏好类：技术栈、语言、工具、风格
- 目标类：学习、职业、项目、考试
- 经历类：工作、比赛、项目、实习

## ⚠️ 重要提醒

- 如果没有有价值的记忆，返回空数组 \`[]\`
- 不要编造或推测用户未提及的信息
- 宁可少提取，不要提取垃圾信息
- 确保 JSON 格式完全正确

## 💬 对话内容

${userMessages}

请直接返回 JSON 数组，不要添加其他说明文字。`

    const extractionMessages = [
      { role: 'system', content: '你是一个专业的记忆提取助手，擅长从对话中识别有价值的长期信息。' },
      { role: 'user', content: extractPrompt },
    ]

    try {
      // 调用 AI 提取记忆
      const extractionResult = await aiService.callAiNonStream(extractionMessages)
      const jsonMatch = extractionResult.match(/\[[\s\S]*\]/)

      if (!jsonMatch) {
        console.warn('⚠️ 未找到有效的 JSON 数组格式')
        return []
      }

      // 解析提取的记忆
      const extractedMemories = JSON.parse(jsonMatch[0])

      // 过滤低重要性记忆（importance < 4）
      const filteredMemories = extractedMemories.filter((m) => (m.importance || 5) >= 4)

      // 保存到数据库
      const createdMemories = []
      for (const memory of filteredMemories) {
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

      if (createdMemories.length > 0) {
        console.log(`✅ 成功提取 ${createdMemories.length} 条记忆`)
      }

      return createdMemories
    } catch (error) {
      console.error('❌ 自动提取记忆失败:', error.message)
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
