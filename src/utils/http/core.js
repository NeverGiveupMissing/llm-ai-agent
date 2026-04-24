import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './config'
import { requestInterceptor, responseInterceptor } from './interceptors'

/**
 * 核心请求方法
 * @param {string} url - 请求路径（会拼接 BASE_URL）
 * @param {Object} options - fetch 配置项
 * @returns {Promise<any>}
 */
export const request = async (url, options = {}) => {
  // 默认配置
  const defaultOptions = {
    method: 'GET',
    headers: { ...DEFAULT_HEADERS },
    credentials: 'include', // 携带 cookie（跨域时需后端配置）
  }

  // 合并配置
  let finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  // 如果 body 是 FormData，删除 Content-Type（让浏览器自动设置 boundary）
  if (finalOptions.body instanceof FormData) {
    delete finalOptions.headers['Content-Type']
  }

  // 执行请求拦截器
  finalOptions = requestInterceptor(finalOptions)

  // 完整 URL
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // 超时控制
  const timeout = options.timeout || DEFAULT_TIMEOUT
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(fullUrl, {
      ...finalOptions,
      signal: controller.signal,
    })

    // ✅ 将配置传递给响应拦截器
    response.config = {
      skipLoading: options.skipLoading,
      skipErrorMsg: options.skipErrorMsg,
      skipSuccessMsg: options.skipSuccessMsg,
    }

    clearTimeout(timeoutId)
    return await responseInterceptor(response)
  } catch (error) {
    clearTimeout(timeoutId)

    // ✅ 确保出错时也隐藏 Loading
    if (!options.skipLoading) {
      const { hideLoading } = await import('./loading')
      hideLoading()
    }

    // ✅ 自动显示网络错误消息（除非设置了 skipErrorMsg）
    if (!options.skipErrorMsg) {
      const { createDiscreteApi } = await import('naive-ui')
      const { message } = createDiscreteApi(['message'])

      if (error.name === 'AbortError') {
        message.error(`请求超时 (${timeout}ms)`)
      } else if (error.message === 'Failed to fetch') {
        message.error('网络连接失败，请检查网络或后端服务是否启动')
      } else {
        message.error(error.message || '请求失败')
      }
    }

    // 超时错误
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout}ms): ${url}`, { cause: error })
    }

    // 网络错误
    if (error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查网络或后端服务是否启动', { cause: error })
    }

    throw error
  }
}
