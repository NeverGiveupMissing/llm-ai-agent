/**
 * HTTP 请求封装统一入口
 * 文件路径：src/utils/http/index.js
 * 支持：JSON 请求、文件上传、流式响应（SSE）、超时控制、请求拦截、响应拦截
 */

// 导入所有模块
import { request } from './core'
import { get, post, put, del, upload } from './methods'
import { streamText } from './stream'
import { streamSSE } from './sse'
import { generateId, scrollToBottom, createSSEController, typewriterEffect } from './sse-tools'

// 默认导出
export default {
  request,
  get,
  post,
  put,
  delete: del,
  upload,
  streamText,
  streamSSE,
  generateId,
  scrollToBottom,
  createSSEController,
  typewriterEffect,
}

// 单独导出所有方法
export {
  request,
  get,
  post,
  put,
  del,
  upload,
  streamText,
  streamSSE,
  generateId,
  scrollToBottom,
  createSSEController,
  typewriterEffect,
}
