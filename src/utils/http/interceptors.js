/**
 * 请求/响应拦截器
 */

/**
 * 请求拦截器
 * @param {Object} config - 请求配置
 * @returns {Object} 处理后的配置
 */
export const requestInterceptor = (config) => {
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
 * 响应拦截器
 * @param {Response} response - fetch 响应对象
 * @returns {Promise<any>} 解析后的数据
 */
export const responseInterceptor = async (response) => {
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
      errorMessage = errorData.msg || errorData.message || errorMessage
    } catch (e) {
      // 响应不是 JSON 格式，使用默认错误信息
    }
    throw new Error(errorMessage)
  }

  // 204 No Content
  if (response.status === 204) {
    return null
  }

  // 尝试解析 JSON
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    const data = await response.json()

    // 统一处理后端返回格式 { code, msg, data }
    if (data.code !== undefined && data.code !== 200) {
      throw new Error(data.msg || '请求失败')
    }

    // 返回 data 字段或完整响应
    return data.data !== undefined ? data : data
  }

  return response.text()
}
