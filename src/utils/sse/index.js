import { BASE_URL, CHAT_CONFIG } from '@/utils/constants'

/**
 * 生成唯一 ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * 滚动到底部
 */
export function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight
  }
}

/**
 * 打字机效果 - 逐字显示
 * @param {string} text - 要显示的文本
 * @param {Function} onChar - 每个字符的回调
 * @param {number} delay - 每个字符的延迟时间（毫秒）
 * @returns {Promise}
 */
export function typewriterEffect(text, onChar, delay = CHAT_CONFIG.TYPEWRITER_DELAY) {
  return new Promise((resolve) => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        onChar(text[index])
        index++
      } else {
        clearInterval(interval)
        resolve()
      }
    }, delay)
  })
}

/**
 * 创建 SSE 控制器
 * 用于管理 SSE 连接的生命周期
 */
export function createSSEController() {
  const controller = new AbortController()

  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    isAborted: () => controller.signal.aborted,
  }
}

/**
 * 发起 SSE 请求
 * @param {Object} options
 * @param {string} options.url - 请求地址
 * @param {Object} options.data - 请求数据
 * @param {Object} options.callbacks - 回调函数
 * @param {Function} options.callbacks.onMessage - 收到消息时的回调
 * @param {Function} options.callbacks.onComplete - 完成时的回调
 * @param {Function} options.callbacks.onError - 错误时的回调
 * @param {AbortSignal} options.signal - 取消信号
 * @param {boolean} options.useTypewriter - 是否使用打字机效果
 * @param {number} options.typewriterDelay - 打字机延迟（毫秒）
 */
export async function fetchSSE(options) {
  const {
    url,
    data,
    callbacks = {},
    signal,
    useTypewriter = CHAT_CONFIG.TYPEWRITER_ENABLED,
    typewriterDelay = CHAT_CONFIG.TYPEWRITER_DELAY,
  } = options
  const { onMessage, onComplete, onError } = callbacks

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onComplete?.()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (!trimmedLine || trimmedLine.startsWith(':')) continue

        if (trimmedLine.startsWith('data:')) {
          const dataStr = trimmedLine.slice(5).trim()

          if (dataStr === '[DONE]') {
            onComplete?.()
            return
          }

          try {
            const parsedData = JSON.parse(dataStr)

            if (parsedData.content && parsedData.content.trim() !== '') {
              if (useTypewriter) {
                await typewriterEffect(
                  parsedData.content,
                  (char) => {
                    onMessage?.({ content: char })
                  },
                  typewriterDelay,
                )
              } else {
                onMessage?.(parsedData)
              }
            }
          } catch (e) {
            if (dataStr && dataStr.trim() !== '') {
              if (useTypewriter) {
                await typewriterEffect(
                  dataStr,
                  (char) => {
                    onMessage?.({ content: char })
                  },
                  typewriterDelay,
                )
              } else {
                onMessage?.({ content: dataStr })
              }
            }
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('SSE request aborted')
      return
    }

    console.error('SSE error:', error)
    onError?.(error)
    throw error
  }
}
