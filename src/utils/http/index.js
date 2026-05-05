/**
 * HTTP 请求封装统一入口
 * 文件路径：src/utils/http/index.js
 * 
 * 提供两种核心请求方式：
 * - axios: REST API 请求（基于 axios，支持拦截器、Token 自动注入等）
 * - stream: 流式请求（SSE/流式文本）
 */

// ========== Axios 客户端 ==========
import {
  axiosGet,
  axiosPost,
  axiosPut,
  axiosDelete,
  axiosUpload,
} from './axios-client'

// ========== 流式请求 ==========
import { streamText } from './stream'
import { streamSSE } from './sse'
import { generateId, scrollToBottom, createSSEController, typewriterEffect } from './sse-tools'

// ========== 文件下载 ==========
import { downloadGet, downloadPost } from './download'

// ========== 语义化分组导出 ==========

/**
 * Axios 请求 - 基础 REST 与文件操作
 */
export const axios = {
  get: axiosGet,
  post: axiosPost,
  put: axiosPut,
  delete: axiosDelete,
  upload: axiosUpload,
  download: {
    get: downloadGet,
    post: downloadPost,
  },
}

/**
 * 流式请求 - 专门处理实时数据流
 */
export const stream = {
  text: streamText,
  sse: streamSSE,
  controller: createSSEController,
  typewriter: typewriterEffect,
}

/**
 * 工具函数
 */
export const utils = {
  generateId,
  scrollToBottom,
}

// ========== 默认导出 ==========
export default {
  axios,
  stream,
  utils,
}
