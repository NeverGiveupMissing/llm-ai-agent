const { ChatRequestModel } = require('./model')
const { callAiNonStream, callAiStream } = require('../../services/ai.service')
const chatMemoryService = require('../chat-memory/service')
const { logChat } = require('../../utils/chat-logger')
const ResponseUtil = require('../../utils/response')
const config = require('../../config')

/**
 * 聊天控制器（支持自动记忆管理）
 */
class ChatController {
  /**
   * 简单聊天接口（带记忆功能）
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async simpleChat(ctx) {
    const requestBody = ctx.request.body

    const request = new ChatRequestModel({
      messages: requestBody.messages,
      stream: requestBody.stream,
    })

    if (!request.validate()) {
      ctx.status = 400
      ctx.body = ResponseUtil.error('参数错误：messages 不能为空')
      return
    }

    const startTime = Date.now()
    const { messages, stream } = request
    const sessionId = requestBody.sessionId
    const userId = requestBody.userId

    // 第一步：对话前检索记忆（如果有 sessionId 和 userId）
    let memoryContext = ''
    let relevantMemories = []

    if (sessionId && userId) {
      try {
        // 获取最后一条用户消息作为查询词
        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
        const query = lastUserMessage ? lastUserMessage.content : null

        const memoryResult = await chatMemoryService.buildMemoryContext(sessionId, userId, query)

        memoryContext = memoryResult.context
        relevantMemories = memoryResult.memories

        if (relevantMemories.length > 0) {
          console.log(`💡 检索到 ${relevantMemories.length} 条相关记忆`)
        }
      } catch (err) {
        console.error('⚠️ 检索记忆失败:', err.message)
      }
    }

    // 第二步：将记忆注入到系统提示词中
    let processedMessages = [...messages]

    if (memoryContext) {
      // 在第一条消息前插入系统提示
      const systemPrompt = {
        role: 'system',
        content: `你是一个有用的 AI 助手。以下是用户的相关信息，请在回答时参考：

${memoryContext}

请注意：
- 基于这些信息提供个性化的回答
- 如果用户询问与自己相关的问题，请根据记忆回答
- 不要直接引用记忆内容，自然地融入对话中`,
      }

      // 如果已有 system 消息，追加到其内容中
      if (processedMessages.length > 0 && processedMessages[0].role === 'system') {
        processedMessages[0].content += `\n\n${memoryContext}`
      } else {
        processedMessages.unshift(systemPrompt)
      }
    }

    // 第三步：执行聊天
    if (stream) {
      ctx.set('Content-Type', 'text/event-stream')
      ctx.set('Cache-Control', 'no-cache')
      ctx.set('Connection', 'keep-alive')

      ctx.status = 200
      ctx.res.setHeader('Content-Type', 'text/event-stream')
      ctx.res.setHeader('Cache-Control', 'no-cache')
      ctx.res.setHeader('Connection', 'keep-alive')

      let fullResponse = ''

      try {
        for await (const chunk of callAiStream(processedMessages)) {
          ctx.res.write(`data: ${chunk}\n\n`)
          fullResponse += chunk
        }
        ctx.res.write(`data: [DONE]\n\n`)
        ctx.res.end()
      } catch (error) {
        ctx.res.write(`event: error\n`)
        ctx.res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        ctx.res.end()
      } finally {
        const duration = (Date.now() - startTime) / 1000
        logChat(messages, fullResponse, duration, config.api.model, null, true)

        // 第四步：对话后自动提取记忆（异步执行，不阻塞响应）
        if (sessionId && userId && messages.length > 0) {
          this.extractMemoriesAsync(sessionId, userId, messages).catch((err) => {
            console.error('⚠️ 异步提取记忆失败:', err.message)
          })
        }
      }
    } else {
      try {
        const content = await callAiNonStream(processedMessages)
        const duration = (Date.now() - startTime) / 1000

        logChat(messages, content, duration, config.api.model)

        // 对话后自动提取记忆（异步执行）
        if (sessionId && userId && messages.length > 0) {
          this.extractMemoriesAsync(sessionId, userId, messages).catch((err) => {
            console.error('⚠️ 异步提取记忆失败:', err.message)
          })
        }

        ctx.status = 200
        ctx.body = ResponseUtil.success({ content }, 'success')
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logChat(messages, '', duration, config.api.model, error.message)

        ctx.status = 500
        ctx.body = ResponseUtil.serverError(error.message)
      }
    }
  }

  /**
   * 异步提取记忆（不阻塞主流程）
   */
  async extractMemoriesAsync(sessionId, userId, messages) {
    try {
      console.log('🧠 开始提取记忆...')
      const extractedMemories = await chatMemoryService.autoExtractFromConversation(
        sessionId,
        userId,
        messages,
      )

      if (extractedMemories.length > 0) {
        console.log(`✅ 成功提取 ${extractedMemories.length} 条记忆`)
      } else {
        console.log('ℹ️ 未提取到新记忆')
      }
    } catch (error) {
      console.error('❌ 提取记忆失败:', error.message)
    }
  }
}

module.exports = new ChatController()

// 用户发送消息
//     ↓
// 【对话前】检索相关记忆（向量相似度搜索）
//     ↓
// 将记忆注入系统提示词
//     ↓
// 调用 AI 生成回复（AI 能看到记忆）
//     ↓
// 【对话后】异步提取新记忆保存到数据库
//     ↓
// 下次对话时 AI 就能记住
