/**
 * SSE 相关工具函数
 */

/**
 * 生成唯一 ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/**
 * 滚动到底部
 * @param {HTMLElement} element - 要滚动的元素
 */
export function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight
  }
}

/**
 * 创建 SSE 控制器
 * 用于管理 SSE 连接的生命周期
 * @returns {Object} SSE 控制器
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
 * 打字机效果 - 逐字显示
 * @param {string} text - 要显示的文本
 * @param {Function} onChar - 每个字符的回调 (char: string) => void
 * @param {number} delay - 每个字符的延迟时间（毫秒）
 * @returns {Promise<void>}
 */
export function typewriterEffect(text, onChar, delay = 50) {
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
