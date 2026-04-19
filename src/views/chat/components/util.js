// 说明：聊天流式请求工具 - 处理 SSE 流式通信和记忆参数传递

import { sendChatMessage } from '@/api/chat'
import { createSSEController, fetchSSE } from '@/utils/sse'
import { CHAT_CONFIG } from '@/utils/constants'

// 生成默认 userId（实际项目中应从登录信息获取）
const DEFAULT_USER_ID =
  'user_' + (localStorage.getItem('userId') || Math.random().toString(36).substr(2, 9))
localStorage.setItem('userId', DEFAULT_USER_ID.replace('user_', ''))

/**
 * 构建 SSE 回调处理器
 * @param {Object} callbacks - 业务层回调
 * @returns {Object} SSE 层回调
 */
function buildSSECallbacks(callbacks) {
  return {
    onMessage: (data) => {
      const content = typeof data === 'string' ? data : data.content
      if (content && content.trim() !== '' && callbacks.onChunk) {
        callbacks.onChunk(content)
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
    send: (messages, callbacks, sessionId) => {
      // 获取 sessionId
      const currentSessionId = sessionId || localStorage.getItem('current_session_id') || 'default'

      // 获取 userId
      const currentUserId = localStorage.getItem('userId') || 'anonymous'

      const requestConfig = sendChatMessage({
        messages,
        stream: true,
        sessionId: currentSessionId,
        userId: currentUserId,
      })

      return fetchSSE({
        url: requestConfig.url,
        data: requestConfig.data,
        useTypewriter: false,
        typewriterDelay:
          callbacks.typewriterDelay !== undefined
            ? callbacks.typewriterDelay
            : CHAT_CONFIG.TYPEWRITER_DELAY,
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
