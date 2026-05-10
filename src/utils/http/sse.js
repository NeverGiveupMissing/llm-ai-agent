import { BASE_URL } from './config'
import { typewriterEffect } from './sse-tools'

/**
 * 默认 SSE 配置
 */
const DEFAULT_SSE_CONFIG = {
  TYPEWRITER_ENABLED: true,
  TYPEWRITER_DELAY: 50,
}

/**
 * 标准 SSE 协议流式请求（支持 JSON 解析、打字机效果）
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
export async function streamSSE(options) {
  const {
    url,
    data,
    callbacks = {},
    signal,
    useTypewriter = DEFAULT_SSE_CONFIG.TYPEWRITER_ENABLED,
    typewriterDelay = DEFAULT_SSE_CONFIG.TYPEWRITER_DELAY,
  } = options
  const { onMessage, onComplete, onError } = callbacks

  try {
    // 获取 Token
    const token = localStorage.getItem('access_token')
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    
    // 添加 Authorization 头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // ✅ 重要:流结束时,先处理 buffer 中剩余的数据
        if (buffer) {
          const lines = buffer.split('\n')
          for (const line of lines) {
            const trimmedLine = line.trim()
            
            if (!trimmedLine || trimmedLine.startsWith(':')) continue
            
            if (trimmedLine.startsWith('data:')) {
              const dataStr = trimmedLine.slice(5).trim()
              
              if (dataStr === '[DONE]') {
                console.log('Received [DONE] signal from buffer')
                onComplete?.()
                return
              }
              
              try {
                const parsedData = JSON.parse(dataStr)
                if (parsedData.content != null && parsedData.content !== '') {
                  onMessage?.(parsedData)
                }
              } catch (e) {
                if (dataStr != null && dataStr !== '') {
                  onMessage?.({ content: dataStr })
                }
              }
            }
          }
        }
        
        console.log('SSE stream completed')
        onComplete?.()
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (!trimmedLine || trimmedLine.startsWith(':')) continue

        if (trimmedLine.startsWith('data:')) {
          const dataStr = trimmedLine.slice(5).trim()

          if (dataStr === '[DONE]') {
            console.log('Received [DONE] signal')
            onComplete?.()
            return
          }

          try {
            const parsedData = JSON.parse(dataStr)

            // 修复：只过滤 null/undefined 和空字符串，保留换行符和空格
            if (parsedData.content != null && parsedData.content !== '') {
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
            // 修复：非 JSON 数据也要保留换行符
            if (dataStr != null && dataStr !== '') {
              console.log('Non-JSON data received:', dataStr)
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
