// 记忆提取服务（多个模块共用）
const { callAiNonStream } = require('../services/ai.service')
const { MEMORY_TYPES } = require('../config/constants')

class MemoryExtractorService {
  extractPrompt = `你是一个记忆提取专家。请分析用户和 AI 的对话内容，提取出有价值的长期记忆。

提取规则：
1. 只提取关于用户的客观事实和偏好
2. 忽略一次性或临时性信息
3. 每个记忆点应简洁明确（不超过200字）
4. 评估重要性（1-10分）：10分=极其重要，5分=一般重要，1分=可忽略

请返回 JSON 格式：
{
  "memories": [
    {
      "content": "记忆内容",
      "memoryType": "fact|preference|goal|event|opinion",
      "importance": 5,
      "tags": ["tag1", "tag2"]
    }
  ]
}`

  async extractFromConversation(messages) {
    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n')

    const prompt = `${this.extractPrompt}\n\n对话内容：\n${conversationText}`

    try {
      const response = await callAiNonStream([
        { role: 'system', content: this.extractPrompt },
        { role: 'user', content: conversationText },
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return []
      }

      const parsed = JSON.parse(jsonMatch[0])
      return parsed.memories || []
    } catch (error) {
      console.error('记忆提取失败:', error.message)
      return []
    }
  }

  generateContextPrompt(retrievedMemories) {
    if (!retrievedMemories || retrievedMemories.length === 0) {
      return ''
    }

    const memoriesText = retrievedMemories
      .map((m) => {
        const tags = m.tags.length > 0 ? ` [${m.tags.join(', ')}]` : ''
        return `- ${m.content}${tags}`
      })
      .join('\n')

    return `

【用户记忆】（以下是对该用户的历史了解，请在回答时参考）：
${memoriesText}
`
  }
}

module.exports = new MemoryExtractorService()
