/**
 * HTTP 请求方式选择器
 * 文件路径：src/utils/http/request-selector.js
 * 按场景自动选择最适合的请求方式
 */

import { request as fetchRequest } from './core'
import {
  get as fetchGet,
  post as fetchPost,
  put as fetchPut,
  del as fetchDelete,
  upload as fetchUpload,
} from './methods'
import { axiosGet, axiosPost, axiosPut, axiosDelete, axiosUpload } from './axios-client'
import { streamSSE } from './sse'

/**
 * 请求方式枚举
 */
export const REQUEST_TYPES = {
  FETCH: 'fetch', // 基于 fetch 的请求
  AXIOS: 'axios', // 基于 axios 的请求
  SSE: 'sse', // Server-Sent Events 流式请求
}

/**
 * 根据场景推荐的请求方式
 */
export const SCENE_RECOMMENDATIONS = {
  // 普通 REST API 请求
  REST_API: REQUEST_TYPES.AXIOS,

  // 文件上传
  FILE_UPLOAD: REQUEST_TYPES.AXIOS,

  // 需要请求/响应拦截器的场景
  WITH_INTERCEPTORS: REQUEST_TYPES.AXIOS,

  // 需要取消请求的场景
  CANCELLABLE: REQUEST_TYPES.AXIOS,

  // 流式数据接收（聊天、实时数据）
  STREAMING: REQUEST_TYPES.SSE,

  // 简单的 GET 请求
  SIMPLE_GET: REQUEST_TYPES.FETCH,

  // 需要手动控制请求细节的场景
  MANUAL_CONTROL: REQUEST_TYPES.FETCH,
}

/**
 * 智能请求选择器
 * @param {string} scene - 使用场景
 * @param {Object} options - 请求选项
 * @returns {Object} 包含请求方法和类型的对象
 */
export const selectRequestMethod = (scene, options = {}) => {
  let requestType = REQUEST_TYPES.FETCH // 默认使用 fetch

  // 根据场景选择请求方式
  switch (scene) {
    case 'rest':
    case 'api':
      requestType = REQUEST_TYPES.AXIOS
      break
    case 'upload':
      requestType = REQUEST_TYPES.AXIOS
      break
    case 'stream':
    case 'sse':
    case 'chat':
      requestType = REQUEST_TYPES.SSE
      break
    case 'simple':
      requestType = REQUEST_TYPES.FETCH
      break
    default:
      // 如果没有指定场景，根据选项智能选择
      if (options.stream || options.sse) {
        requestType = REQUEST_TYPES.SSE
      } else if (options.upload || options.formData) {
        requestType = REQUEST_TYPES.AXIOS
      } else if (options.cancelToken || options.interceptors !== false) {
        requestType = REQUEST_TYPES.AXIOS
      }
      break
  }

  // 返回对应的请求方法
  const methods = {
    [REQUEST_TYPES.FETCH]: {
      get: fetchGet,
      post: fetchPost,
      put: fetchPut,
      delete: fetchDelete,
      upload: fetchUpload,
      request: fetchRequest,
    },
    [REQUEST_TYPES.AXIOS]: {
      get: axiosGet,
      post: axiosPost,
      put: axiosPut,
      delete: axiosDelete,
      upload: axiosUpload,
    },
    [REQUEST_TYPES.SSE]: {
      stream: streamSSE,
    },
  }

  return {
    type: requestType,
    methods: methods[requestType],
  }
}

/**
 * 便捷的场景化请求方法
 */
export const smartRequest = {
  // REST API 请求（推荐 axios）
  api: {
    get: (url, config) => axiosGet(url, config),
    post: (url, data, config) => axiosPost(url, data, config),
    put: (url, data, config) => axiosPut(url, data, config),
    delete: (url, config) => axiosDelete(url, config),
  },

  // 文件上传（推荐 axios）
  upload: (url, formData, config) => axiosUpload(url, formData, config),

  // 流式请求（SSE）
  stream: (url, options) => streamSSE(url, options),

  // 简单请求（fetch）
  simple: {
    get: (url, config) => fetchGet(url, config),
    post: (url, data, config) => fetchPost(url, data, config),
    put: (url, data, config) => fetchPut(url, data, config),
    delete: (url, config) => fetchDelete(url, config),
  },
}
