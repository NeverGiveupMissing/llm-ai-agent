/**
 * 文件下载专用 axios 实例
 * 文件路径：src/utils/http/download.js
 * 用途：绕过拦截器，直接处理 Blob 数据
 */

import axios from 'axios'
import { BASE_URL, DEFAULT_TIMEOUT } from './config'

/**
 * 创建没有拦截器的 axios 实例
 * 专门用于文件下载，避免拦截器干扰 Blob 数据处理
 */
const downloadAxios = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  // 不配置任何拦截器
})

/**
 * 从响应头中提取文件名
 * @param {Object} response - axios 响应对象
 * @param {string} defaultName - 默认文件名
 * @returns {string} 文件名
 */
function extractFilename(response, defaultName = 'download') {
  const contentDisposition = response.headers['content-disposition']
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]]/g, '')
    }
  }
  return defaultName
}

/**
 * 触发浏览器下载
 * @param {Blob} blob - 二进制数据
 * @param {string} filename - 文件名
 */
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 文件下载 GET 请求并自动触发下载
 * @param {string} url - 请求 URL
 * @param {Object} config - axios 配置
 * @param {string} config.filename - 自定义文件名（可选）
 * @returns {Promise} 响应对象
 */
export function downloadGet(url, config = {}) {
  const token = localStorage.getItem('access_token')
  const customFilename = config.filename
  
  // 移除自定义配置项，避免传递给 axios
  const { filename, ...axiosConfig } = config
  
  return downloadAxios.get(url, {
    responseType: 'blob',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    ...axiosConfig,
  }).then(response => {
    // 检查是否为错误响应（Blob 可能包含 JSON 错误信息）
    if (response.data.type === 'application/json') {
      return response.data.text().then(text => {
        try {
          const error = JSON.parse(text)
          throw new Error(error.message || '下载失败')
        } catch (e) {
          throw new Error('下载失败：' + e.message)
        }
      })
    }
    
    // 提取文件名并触发下载
    const filename = customFilename || extractFilename(response, 'download')
    triggerDownload(response.data, filename)
    return response
  })
}

/**
 * 文件下载 POST 请求并自动触发下载
 * @param {string} url - 请求 URL
 * @param {Object} data - 请求数据
 * @param {Object} config - axios 配置
 * @param {string} config.filename - 自定义文件名（可选）
 * @returns {Promise} 响应对象
 */
export function downloadPost(url, data = {}, config = {}) {
  const token = localStorage.getItem('access_token')
  const customFilename = config.filename
  
  // 移除自定义配置项，避免传递给 axios
  const { filename, ...axiosConfig } = config
  
  return downloadAxios.post(url, data, {
    responseType: 'blob',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    ...axiosConfig,
  }).then(response => {
    // 检查是否为错误响应（Blob 可能包含 JSON 错误信息）
    if (response.data.type === 'application/json') {
      return response.data.text().then(text => {
        try {
          const error = JSON.parse(text)
          throw new Error(error.message || '下载失败')
        } catch (e) {
          throw new Error('下载失败：' + e.message)
        }
      })
    }
    
    // 提取文件名并触发下载
    const filename = customFilename || extractFilename(response, 'download')
    triggerDownload(response.data, filename)
    return response
  })
}

export default {
  get: downloadGet,
  post: downloadPost,
}
