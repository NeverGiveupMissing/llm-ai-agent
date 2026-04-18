/**
 * API 基础地址
 * - 开发环境使用空字符串，通过 Vite 代理转发
 * - 生产环境使用实际的 API 地址
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
export const API_PREFIX = '/koa2api'

/**
 * 聊天配置
 */
export const CHAT_CONFIG = {
  /**
   * 是否启用打字机效果
   */
  TYPEWRITER_ENABLED: true,

  /**
   * 打字机效果延迟（毫秒）
   * - 30ms: 快速
   * - 50ms: 正常（推荐）
   * - 80ms: 慢速
   */
  TYPEWRITER_DELAY: 50,

  /**
   * 最大历史消息数（发送给后端的上下文）
   */
  MAX_HISTORY: 10,

  /**
   * 滚动防抖时间（毫秒）
   */
  SCROLL_DEBOUNCE: 100,
}
