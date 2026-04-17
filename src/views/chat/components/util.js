import { sendChatMessage } from '@/api/chat'
import { createSSEController, fetchSSE } from '@/utils/sse'
import { CHAT_CONFIG } from '@/utils/constants'

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
function createChatStream() {
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

export { createChatStream }
