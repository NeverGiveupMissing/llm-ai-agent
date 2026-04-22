/**
 * HTTP 请求基础配置
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const DEFAULT_TIMEOUT = 30000 // 30秒

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}
