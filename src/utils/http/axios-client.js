/**
 * Axios HTTP 客户端
 * 文件路径：src/utils/http/axios-client.js
 * 适用于：普通 REST API 请求、文件上传、需要拦截器的场景
 */

import axios from 'axios'
import { message } from './message'
import { BASE_URL, DEFAULT_TIMEOUT, DEFAULT_HEADERS } from './config'
import { requestInterceptor, responseInterceptor } from './interceptors'

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: DEFAULT_HEADERS,
  withCredentials: true, // 携带 cookie
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    requestInterceptor(config)
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  async (response) => {
    // 使用现有的响应拦截器逻辑
    const processedResponse = await responseInterceptor({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: response.config,
    })

    return processedResponse
  },
  async (error) => {
    // 网络错误（无响应）
    if (!error.response) {
      message.error('网络连接失败，请检查网络设置')
      return Promise.reject(new Error('网络连接失败'))
    }

    // 有响应但状态码错误，让 responseInterceptor 统一处理
    try {
      await responseInterceptor({
        ok: false,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        config: error.config,
      })
    } catch (e) {
      return Promise.reject(e)
    }

    return Promise.reject(error)
  },
)

// 导出 axios 实例和便捷方法
export default axiosInstance

// 便捷的 HTTP 方法
export const axiosGet = (url, config = {}) => axiosInstance.get(url, config)
export const axiosPost = (url, data = {}, config = {}) => axiosInstance.post(url, data, config)
export const axiosPut = (url, data = {}, config = {}) => axiosInstance.put(url, data, config)
export const axiosDelete = (url, config = {}) => axiosInstance.delete(url, config)
export const axiosPatch = (url, data = {}, config = {}) => axiosInstance.patch(url, data, config)

// 文件上传方法
// ⚠️ 注意：不要手动设置 Content-Type，让浏览器自动生成 boundary
export const axiosUpload = (url, formData, config = {}) => {
  // 删除默认的 Content-Type，让浏览器自动生成 multipart/form-data 和 boundary
  return axiosInstance.post(url, formData, {
    ...config,
    headers: {
      ...config.headers,
      'Content-Type': undefined, // 关键：删除 Content-Type
    },
  })
}
