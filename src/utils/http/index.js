// services/http.js

/**
 * 通用 fetch 封装
 * 支持：JSON 请求、文件上传、流式响应（SSE）、超时控制、请求拦截、响应拦截
 */

// 基础配置
// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const BASE_URL = import.meta.env.VITE_API_BASE_URL

const DEFAULT_TIMEOUT = 30000 // 30秒

/**
 * 请求拦截器（可自定义）
 * @param {Object} config - 请求配置
 * @returns {Object} 处理后的配置
 */
const requestInterceptor = (config) => {
  // 自动添加 token（如果存在）
  const token = localStorage.getItem('access_token')
  if (token && !config.headers?.['Authorization']) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  // 添加请求时间戳（防缓存）
  if (config.method?.toUpperCase() === 'GET' && config.params) {
    config.params._t = Date.now()
  }

  return config
}

/**
 * 响应拦截器（可自定义）
 * @param {Response} response - fetch 响应对象
 * @returns {Promise<any>} 解析后的数据
 */
const responseInterceptor = async (response) => {
  // 401 未授权：清除 token 并跳转登录
  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // 如果不在登录页，跳转登录
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    throw new Error('登录已过期，请重新登录')
  }

  // 其他错误状态码
  if (!response.ok) {
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch (e) {
      // 响应不是 JSON 格式，使用默认错误信息
    }
    throw new Error(errorMessage)
  }

  // 204 No Content
  if (response.status === 204) {
    return null
  }

  // 尝试解析 JSON，如果失败则返回原始文本
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

/**
 * 核心请求方法
 * @param {string} url - 请求路径（会拼接 BASE_URL）
 * @param {Object} options - fetch 配置项
 * @returns {Promise<any>}
 */
const request = async (url, options = {}) => {
  // 默认配置
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // redirect: 'follow',      // 显式声明
    // mode: 'cors',            // 显式声明
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
    clearTimeout(timeoutId)
    return await responseInterceptor(response)
  } catch (error) {
    clearTimeout(timeoutId)

    // 超时错误
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout}ms): ${url}`, { cause: error })
    }

    // 网络错误
    if (error.message === 'Failed to fetch') {
      // 第一个参数：新的错误消息（例如：“网络连接失败”）。
      // 第二个参数：一个配置对象，其中 cause 属性指向被捕获的原始错误对象。
      throw new Error('网络连接失败，请检查网络或后端服务是否启动', { cause: error })
    }

    throw error
  }
}

// ==================== 便捷方法 ====================

/**
 * GET 请求
 * @param {string} url
 * @param {Object} params - URL 查询参数
 * @param {Object} options - 额外 fetch 配置
 */
const get = (url, params = {}, options = {}) => {
  const queryString = new URLSearchParams(params).toString() // 参数序列化 自动 URL 编码
  const fullUrl = queryString ? `${url}?${queryString}` : url
  return request(fullUrl, { ...options, method: 'GET' })
}

/**
 * POST 请求（JSON 格式）
 * @param {string} url
 * @param {Object} data - 请求体数据
 * @param {Object} options - 额外 fetch 配置
 */
const post = (url, data = {}, options = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT 请求
 */
const put = (url, data = {}, options = {}) => {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE 请求
 */
const del = (url, options = {}) => {
  return request(url, { ...options, method: 'DELETE' })
}

/**
 * 文件上传（FormData）
 * @param {string} url
 * @param {FormData} formData
 * @param {Object} options - 额外配置（如 onUploadProgress 需要自行实现）
 */
const upload = (url, formData, options = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body: formData,
    // 不要设置 Content-Type，让浏览器自动处理
  })
}

// ==================== AI 流式响应（SSE）====================

/**
 * 流式请求（用于 AI 对话）
 * @param {string} url
 * @param {Object} data - 请求体数据
 * @param {Object} callbacks - 回调函数
 * @param {Function} callbacks.onChunk - 接收到数据块时调用 (chunk: string) => void
 * @param {Function} callbacks.onDone - 完成时调用 () => void
 * @param {Function} callbacks.onError - 出错时调用 (error: Error) => void
 * @param {AbortSignal} signal - 用于中止请求的信号
 */
const stream = async (url, data, callbacks, signal = null) => {
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

// 导出所有方法
export default {
  request,
  get,
  post,
  put,
  delete: del,
  upload,
  stream,
}

// 单独导出便捷方法
export { get, post, put, del, upload, stream, request }
