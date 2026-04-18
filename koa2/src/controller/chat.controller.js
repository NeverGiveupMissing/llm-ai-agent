const { ChatRequestModel } = require('../models/chat.model')
const { callAiNonStream, callAiStream } = require('../services/ai.service')
const { logChat } = require('../utils/chat-logger')
const config = require('../config')

/**
 * 聊天控制器
 */
class ChatController {
  /**
   * 简单聊天接口
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
      ctx.body = { error: 'Invalid request: messages are required' }
      return
    }

    const startTime = Date.now()
    const { messages, stream } = request

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
        for await (const chunk of callAiStream(messages)) {
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
      }
    } else {
      try {
        const content = await callAiNonStream(messages)
        const duration = (Date.now() - startTime) / 1000

        logChat(messages, content, duration, config.api.model)

        ctx.body = { content }
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logChat(messages, '', duration, config.api.model, error.message)

        ctx.status = 500
        ctx.body = { error: error.message }
      }
    }
  }
}

module.exports = new ChatController()
