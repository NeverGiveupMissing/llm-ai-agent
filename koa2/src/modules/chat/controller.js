const { ChatRequestModel } = require('./model')
const { callAiNonStream, callAiStream } = require('../../services/ai.service')
const chatMemoryService = require('../chat-memory/service')
const ChatMessageService = require('./message-service')
const SessionService = require('../session/service')
const { logChat } = require('../../utils/chat-logger')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')
const config = require('../../config')

/**
 * 聊天控制器（支持自动记忆管理）
 */
class ChatController {
  /**
   * 简单聊天接口（带记忆功能）
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  simpleChat = asyncHandler(async (ctx) => {
    const requestBody = ctx.request.body

    const request = new ChatRequestModel({
      messages: requestBody.messages,
      stream: requestBody.stream,
    })

    if (!request.validate()) {
      throw new BadRequestError('参数错误：messages 不能为空')
    }

    const startTime = Date.now()
    const { messages, stream } = request
    const sessionId = requestBody.sessionId
    const user_id = requestBody.user_id

    // 第一步：对话前检索记忆（如果有 sessionId 和 user_id）
    let memoryContext = ''
    let relevantMemories = []

    if (sessionId && user_id) {
      try {
        // 获取最后一条用户消息作为查询词
        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
        const query = lastUserMessage ? lastUserMessage.content : null

        const memoryResult = await chatMemoryService.buildMemoryContext(sessionId, user_id, query)

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

    // ✅ 默认的系统提示词，要求 AI 使用 Markdown 格式但不输出标记
    const defaultSystemPrompt = {
      role: 'system',
      content: `你是一个专业的 AI 助手。

## 输出格式要求
- 请使用 Markdown 格式进行排版（标题、列表、代码块、表格等）
- 直接输出内容，不要在开头或结尾添加任何格式标记（如 \`\`\`、\`\`\` 等）
- 保持内容简洁、清晰、专业`,
    }

    if (memoryContext) {
      const systemPrompt = {
        role: 'system',
        content: `你是一个有用的 AI 助手。以下是用户的相关信息，请在回答时参考：

${memoryContext}

## 输出格式要求
- 请使用 Markdown 格式进行排版（标题、列表、代码块、表格等）
- 直接输出内容，不要在开头或结尾添加任何格式标记（如 \`\`\`、\`\`\` 等）
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
    } else {
      // 没有记忆上下文时，也注入默认的系统提示词
      if (processedMessages.length === 0 || processedMessages[0].role !== 'system') {
        processedMessages.unshift(defaultSystemPrompt)
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
        // 保存用户消息到数据库
        if (sessionId) {
          try {
            const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
            if (lastUserMessage) {
              console.log('💾 尝试保存用户消息, sessionId:', sessionId)
              await ChatMessageService.saveUserMessage(sessionId, lastUserMessage.content)
              console.log('✅ 用户消息保存成功')
            }
          } catch (saveError) {
            console.error('❌ 保存用户消息失败:', saveError.message, { sessionId })
            // 不阻塞流式响应,继续执行
          }
        }

        for await (const chunk of callAiStream(processedMessages)) {
          ctx.res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
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

        // 保存AI回复到数据库
        if (sessionId && fullResponse) {
          try {
            console.log('💾 尝试保存AI回复, sessionId:', sessionId)
            await ChatMessageService.saveAssistantMessage(sessionId, fullResponse)
            console.log('✅ AI回复保存成功')
          } catch (saveError) {
            console.error('❌ 保存AI回复失败:', saveError.message, { sessionId })
            // 不阻塞响应
          }
        }

        // 第四步：对话后自动提取记忆和生成标题（异步执行，不阻塞响应）
        if (sessionId && user_id && messages.length > 0) {
          // 异步提取记忆
          this.extractMemoriesAsync(sessionId, user_id, messages).catch((err) => {
            console.error('⚠️ 异步提取记忆失败:', err.message)
          })

          // 🏷️ 异步生成会话标题
          this.generateSessionTitleAsync(sessionId).catch((err) => {
            console.error('⚠️ 生成会话标题失败:', err.message)
          })
        }
      }
    } else {
      try {
        const content = await callAiNonStream(processedMessages)
        const duration = (Date.now() - startTime) / 1000

        logChat(messages, content, duration, config.api.model)

        // 保存用户消息和AI回复到数据库
        if (sessionId) {
          const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
          if (lastUserMessage) {
            await ChatMessageService.saveUserMessage(sessionId, lastUserMessage.content)
          }
          await ChatMessageService.saveAssistantMessage(sessionId, content)
        }

        // 对话后自动提取记忆（异步执行）
        if (sessionId && user_id && messages.length > 0) {
          this.extractMemoriesAsync(sessionId, user_id, messages).catch((err) => {
            console.error('⚠️ 异步提取记忆失败:', err.message)
          })
        }

        ctx.success({ content }, 'success')
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logChat(messages, '', duration, config.api.model, error.message)
        throw error
      }
    }
  })

  /**
   * 异步提取记忆（不阻塞主流程）
   */
  async extractMemoriesAsync(sessionId, user_id, messages) {
    try {
      console.log('🧠 开始提取记忆...')
      const extractedMemories = await chatMemoryService.autoExtractFromConversation(
        sessionId,
        user_id,
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

  /**
   * 异步生成会话标题（不阻塞主流程）
   * 基于会话的完整消息历史生成标题
   */
  async generateSessionTitleAsync(sessionId) {
    try {
      console.log('🏷️ 开始生成会话标题...')

      // 从数据库获取完整的历史消息
      const allMessages = await ChatMessageService.getSessionMessages(sessionId, 50, 0)

      if (allMessages && allMessages.length > 0) {
        const title = SessionService.extractTitleFromMessages(allMessages)
        console.log('🏷️ 自动生成会话标题:', title)
        await SessionService.updateSession(sessionId, { title })
        console.log('✅ 会话标题更新成功')
      } else {
        console.log('ℹ️ 消息为空,跳过标题生成')
      }
    } catch (error) {
      console.error('❌ 生成会话标题失败:', error.message)
    }
  }

  /**
   * 删除单条消息
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  deleteMessage = asyncHandler(async (ctx) => {
    const { messageId } = ctx.params

    if (!messageId) {
      throw new BadRequestError('参数错误：messageId 不能为空')
    }

    console.log('🗑️ 删除消息:', messageId)

    // 调用 Service 层删除消息
    const deletedMessage = await ChatMessageService.deleteMessage(messageId)

    if (!deletedMessage) {
      throw new NotFoundError('消息不存在')
    }

    console.log('✅ 消息删除成功')

    ctx.success({ messageId }, '删除成功')
  })
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
