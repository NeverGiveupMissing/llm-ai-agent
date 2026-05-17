/**
 * 文件下载专用工具
 * 文件路径：src/utils/http/download.js
 * 用途：处理二进制文件流下载，支持 Blob 转换和文件名提取
 */

import axios from 'axios'
import { BASE_URL, DEFAULT_TIMEOUT } from './config'
import { message } from './message'

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
    // 匹配 filename*=UTF-8''xxx 或 filename="xxx" 或 filename=xxx
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/)
    if (filenameStarMatch && filenameStarMatch[1]) {
      return decodeURIComponent(filenameStarMatch[1])
    }
    
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]]/g, '')
    }
  }
  return defaultName
}

/**
 * 生成带日期后缀的文件名
 * @param {string} moduleName - 模块名称（如 user, role, menu, interface）
 * @param {string} extension - 文件扩展名（默认 .xlsx）
 * @returns {string} 生成的文件名（如 user_20260513.xlsx）
 */
function generateFilename(moduleName, extension = '.xlsx') {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  return `${moduleName}_${dateStr}${extension}`
}

/**
 * 触发浏览器下载
 * @param {Blob} blob - 二进制数据
 * @param {string} filename - 文件名
 */
function triggerDownload(blob, filename) {
  try {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    // 延迟清理，确保下载开始
    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 100)
    
    message.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败，请重试')
  }
}

/**
 * 将二进制流转换为 Blob URL 并触发下载
 * @param {Object} response - axios 响应对象
 * @param {string} moduleName - 模块名称（用于生成文件名）
 * @param {string} customFilename - 自定义文件名（可选）
 */
function handleDownloadResponse(response, moduleName, customFilename) {
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
  
  // 确定文件名优先级：自定义 > 响应头提取 > 自动生成
  let filename
  if (customFilename) {
    filename = customFilename
  } else {
    filename = extractFilename(response, null)
    if (!filename) {
      filename = generateFilename(moduleName)
    }
  }
  
  // 触发下载
  triggerDownload(response.data, filename)
  return response
}

/**
 * 文件下载 GET 请求并自动触发下载
 * @param {string} url - 请求 URL
 * @param {Object} config - axios 配置
 * @param {string} config.moduleName - 模块名称（用于生成文件名，如 user, role, menu, interface）
 * @param {string} config.filename - 自定义文件名（可选，优先级最高）
 * @returns {Promise} 响应对象
 */
export function downloadGet(url, config = {}) {
  const token = localStorage.getItem('access_token')
  const { moduleName = 'download', filename: customFilename, ...axiosConfig } = config
  
  return downloadAxios.get(url, {
    responseType: 'blob',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    ...axiosConfig,
  }).then(response => {
    return handleDownloadResponse(response, moduleName, customFilename)
  }).catch(error => {
    console.error('下载失败:', error)
    message.error(error.message || '下载失败，请重试')
    throw error
  })
}

/**
 * 文件下载 POST 请求并自动触发下载
 * @param {string} url - 请求 URL
 * @param {Object} data - 请求数据
 * @param {Object} config - axios 配置
 * @param {string} config.moduleName - 模块名称（用于生成文件名）
 * @param {string} config.filename - 自定义文件名（可选）
 * @returns {Promise} 响应对象
 */
export function downloadPost(url, data = {}, config = {}) {
  const token = localStorage.getItem('access_token')
  const { moduleName = 'download', filename: customFilename, ...axiosConfig } = config
  
  return downloadAxios.post(url, data, {
    responseType: 'blob',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    ...axiosConfig,
  }).then(response => {
    return handleDownloadResponse(response, moduleName, customFilename)
  }).catch(error => {
    console.error('下载失败:', error)
    message.error(error.message || '下载失败，请重试')
    throw error
  })
}

/**
 * 通用下载方法（根据请求方法自动选择）
 * @param {string} method - 请求方法（get/post）
 * @param {string} url - 请求 URL
 * @param {Object} options - 选项
 * @param {Object} options.data - POST 数据
 * @param {Object} options.config - 配置
 * @returns {Promise}
 */
export function download(method, url, options = {}) {
  const { data, config } = options
  
  if (method.toLowerCase() === 'post') {
    return downloadPost(url, data, config)
  } else {
    return downloadGet(url, config)
  }
}

export default {
  get: downloadGet,
  post: downloadPost,
  request: download,
}
