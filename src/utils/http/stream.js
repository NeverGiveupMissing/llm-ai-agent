import { BASE_URL } from './config'

/**
 * 基础文本流式请求（直接输出文本，不解析 JSON）
 * @param {string} url
 * @param {Object} data - 请求体数据
 * @param {Object} callbacks - 回调函数
 * @param {Function} callbacks.onChunk - 接收到数据块时调用 (chunk: string) => void
 * @param {Function} callbacks.onDone - 完成时调用 () => void
 * @param {Function} callbacks.onError - 出错时调用 (error: Error) => void
 * @param {AbortSignal} signal - 用于中止请求的信号
 */
export const streamText = async (url, data, callbacks, signal = null) => {
  const { onChunk, onDone, onError } = callbacks

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
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onDone?.()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 按行分割
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (!trimmedLine) continue

        // 检查结束标记
        if (trimmedLine === '[DONE]') {
          onDone?.()
          return
        }

        // 直接输出内容
        if (onChunk) {
          onChunk(trimmedLine)
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return
    }
    onError?.(error)
  }
}
