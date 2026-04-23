// AI 调用服务（多个模块共用）
const axios = require('axios')
const config = require('../config')

const { apiKey: API_KEY, baseUrl: BASE_URL, model: MODEL } = config.api

/**
 * 非流式 AI 调用
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} AI 响应内容
 */
async function callAiNonStream(messages) {
  const url = `${BASE_URL}/chat/completions`

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }

  const data = {
    model: MODEL,
    messages,
    stream: false,
  }

  try {
    const response = await axios.post(url, data, {
      headers,
      timeout: 60000,
    })

    if (response.status !== 200) {
      throw new Error(`API错误: ${response.status}`)
    }

    return response.data.choices[0].message.content
  } catch (error) {
    throw new Error(`AI 调用失败: ${error.message}`)
  }
}

/**
 * 流式 AI 调用（Async Generator）
 * @param {Array} messages - 消息数组
 * @returns {AsyncGenerator<string>} 流式内容生成器
 */
async function* callAiStream(messages) {
  if (messages.length > 10) {
    messages = messages.slice(-10)
  }

  const url = `${BASE_URL}/chat/completions`

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }

  const data = {
    model: MODEL,
    messages,
    stream: true,
    max_tokens: 500,
  }

  const maxRetries = 3
  const retryDelay = 2000

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(url, data, {
        headers,
        timeout: 60000,
        responseType: 'stream',
      })

      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          const waitTime = retryDelay * (attempt + 1)
          yield `⏳ 请求过于频繁，${waitTime / 1000}秒后重试...\n`
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        } else {
          yield '❌ 请求次数过多，请稍后再试'
          return
        }
      }

      if (response.status !== 200) {
        yield `错误: ${response.status}`
        return
      }

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n')

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine.startsWith('data: ')) continue

          const dataStr = trimmedLine.substring(6)
          if (dataStr === '[DONE]') return

          try {
            const jsonData = JSON.parse(dataStr)
            const content = jsonData.choices?.[0]?.delta?.content || ''
            if (content) {
              yield content
            }
          } catch {
            continue
          }
        }
      }

      return
    } catch (error) {
      if (attempt < maxRetries - 1) {
        yield '⚠️ 网络错误，重试中...\n'
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      } else {
        yield `❌ 请求失败: ${error.message}`
        return
      }
    }
  }
}

module.exports = { callAiNonStream, callAiStream }
