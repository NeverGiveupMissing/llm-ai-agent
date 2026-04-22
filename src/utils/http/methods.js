import { request } from './core'

/**
 * GET 请求
 * @param {string} url
 * @param {Object} params - URL 查询参数
 * @param {Object} options - 额外 fetch 配置
 */
export const get = (url, params = {}, options = {}) => {
  const queryString = new URLSearchParams(params).toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url
  return request(fullUrl, { ...options, method: 'GET' })
}

/**
 * POST 请求（JSON 格式）
 * @param {string} url
 * @param {Object} data - 请求体数据
 * @param {Object} options - 额外 fetch 配置
 */
export const post = (url, data = {}, options = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT 请求
 */
export const put = (url, data = {}, options = {}) => {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE 请求
 */
export const del = (url, options = {}) => {
  return request(url, { ...options, method: 'DELETE' })
}

/**
 * 文件上传（FormData）
 * @param {string} url
 * @param {FormData} formData
 * @param {Object} options - 额外配置
 */
export const upload = (url, formData, options = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body: formData,
  })
}
