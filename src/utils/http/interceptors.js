/**
 * 请求/响应拦截器
 */

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

  return config
}

/**
 * 响应拦截器
 */
export const responseInterceptor = async (response) => {
  // 401 未授权
  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    throw new Error('登录已过期，请重新登录')
  }

  // 其他错误状态码
  if (!response.ok) {
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      // 尝试读取错误信息（此时 body 还没被读，可以读一次）
      const errorData = await response.json()
      errorMessage = errorData.msg || errorData.message || errorMessage
    } catch (e) {
      // 忽略读取错误
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

      // 统一处理后端返回格式 { code, msg, data }
      if (data.code !== 200) {
        throw new Error(data.msg || '请求失败')
      }

      // ✅ 成功：直接返回 data 字段，业务层无需判断 code
      return data.data !== undefined ? data : data
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
