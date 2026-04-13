// src/api/chat.js
import { fetchSSE, createSSEController } from '@/utils/sse'
import { CHAT_CONFIG } from '@/utils/constants'

/**
 * 发送聊天消息配置
 * @param {Object} params
 * @param {Array} params.messages - 消息历史
 * @param {boolean} params.stream - 是否流式
 */
export function sendChatMessage(params) {
  const { messages, stream = true } = params

  return {
    url: '/api/chat',
    data: {
      messages,
      stream,
    },
  }
}

/**
 * 构建 SSE 回调处理器
 * @param {Object} callbacks - 业务层回调
 * @returns {Object} SSE 层回调
 */
function buildSSECallbacks(callbacks) {
  return {
    onMessage: (data) => {
      if (data.content && data.content.trim() !== '' && callbacks.onChunk) {
        callbacks.onChunk(data.content)
      } else if (callbacks.onChunk && typeof data === 'string' && data.trim() !== '') {
        callbacks.onChunk(data)
      }
    },
    onComplete: () => {
      callbacks.onDone?.()
    },
    onError: (error) => {
      callbacks.onError?.(error)
    },
  }
}

/**
 * 创建流式聊天控制器
 */
export function createChatStream() {
  const sseController = createSSEController()

  return {
    send: (messages, callbacks) => {
      const requestConfig = sendChatMessage({ messages, stream: true })

      return fetchSSE({
        url: requestConfig.url,
        data: requestConfig.data,
        useTypewriter: callbacks.useTypewriter ?? CHAT_CONFIG.TYPEWRITER_ENABLED,
        typewriterDelay: callbacks.typewriterDelay ?? CHAT_CONFIG.TYPEWRITER_DELAY,
        callbacks: buildSSECallbacks(callbacks),
        signal: sseController.signal,
      })
    },

    abort: () => {
      sseController.abort()
    },

    isAborted: () => sseController.isAborted(),
  }
}
