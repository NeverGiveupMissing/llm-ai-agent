import { showLoading, hideLoading } from './loading'
import { message } from './message'
import router from '@/router'

/**
 * 请求拦截器
 */
export const requestInterceptor = (config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers?.['Authorization']) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  if (config.method?.toUpperCase() === 'GET' && config.params) {
    config.params._t = Date.now()
  }

  // ✅ 默认显示 Loading，除非明确设置 skipLoading: true
  if (!config.skipLoading) {
    showLoading()
  }

  return config
}

/**
 * 响应拦截器
 * 兼容 fetch Response 和 axios response 对象
 */
export const responseInterceptor = async (response) => {
  // ✅ 隐藏 Loading（如果请求时显示了）
  if (!response.config?.skipLoading) {
    hideLoading()
  }

  // 401 未授权
  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    message.error('登录已过期，请重新登录')
    throw new Error('登录已过期，请重新登录')
  }

  // 403 无权限
  if (response.status === 403) {
    message.error('暂无权限访问')
    if (!window.location.pathname.includes('/403')) {
      router.push('/403')
    }
    throw new Error('暂无权限访问')
  }

  // 404 资源不存在
  if (response.status === 404) {
    message.error('请求的资源不存在')
    throw new Error('资源不存在')
  }

  // 429 请求过于频繁
  if (response.status === 429) {
    message.error('操作太频繁，请稍后再试')
    throw new Error('请求过于频繁')
  }

  // 500 服务器错误
  if (response.status === 500) {
    message.error('服务器错误，请稍后重试')
    throw new Error('服务器错误')
  }

  // ✅ 判断是否为 axios 响应（有 data 属性且没有 json 方法）
  const isAxiosResponse = response.data !== undefined && typeof response.json !== 'function'

  if (isAxiosResponse) {
    // Axios 响应处理
    const data = response.data

    // 统一处理后端返回格式 { code, message, data }
    if (data.code !== 200) {
      // ✅ 自动显示错误消息
      if (!response.config?.skipErrorMsg) {
        message.error(data.message || '请求失败')
      }
      throw new Error(data.message || '请求失败')
    }

    return data
  }

  // Fetch Response 处理
  // 其他错误状态码
  if (!response.ok) {
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      // 尝试读取错误信息（此时 body 还没被读，可以读一次）
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch (e) {
      // 忽略读取错误
    }

    // ✅ 自动显示错误消息（除非设置了 skipErrorMsg）
    if (!response.config?.skipErrorMsg) {
      message.error(errorMessage)
    }

    throw new Error(errorMessage)
  }

  // 204 No Content
  if (response.status === 204) return null

  // ✅ 核心修复：根据 Content-Type 决定读取方式，互斥执行
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    try {
      const data = await response.json()

      // 统一处理后端返回格式 { code, message, data }
      if (data.code !== 200) {
        // ✅ 自动显示错误消息
        if (!response.config?.skipErrorMsg) {
          message.error(data.message || '请求失败')
        }
        throw new Error(data.message || '请求失败')
      }

      // ✅ 成功：返回完整的响应数据 { code, message, data }
      return data
    } catch (error) {
      // 如果解析 JSON 失败（如网络断开或返回了非 JSON），抛出错误
      if (error.name === 'SyntaxError') {
        throw new Error('后端响应格式错误，非 JSON 数据')
      }
      throw error
    }
  }

  // 只有非 JSON 响应才尝试解析为 text
  return await response.text()
}
