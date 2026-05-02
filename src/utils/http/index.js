/**
 * HTTP 请求封装统一入口
 * 文件路径：src/utils/http/index.js
 * 语义化分组导出，支持多种请求方式按场景选择
 */

// ========== 核心请求方法 ==========
import { request } from './core'

// ========== 便捷方法 ==========
import { get, post, put, del, upload as fetchUpload } from './methods'

// ========== 流式请求 ==========
import { streamText } from './stream'
import { streamSSE } from './sse'
import { generateId, scrollToBottom, createSSEController, typewriterEffect } from './sse-tools'

// ========== Axios 支持 ==========
import axiosClient, {
  axiosGet,
  axiosPost,
  axiosPut,
  axiosDelete,
  axiosUpload,
} from './axios-client'

// ========== 文件下载 ==========
import download, { downloadGet, downloadPost } from './download'

// ========== 智能选择器 ==========
import {
  selectRequestMethod,
  smartRequest,
  REQUEST_TYPES,
  SCENE_RECOMMENDATIONS,
} from './request-selector'

// ========== 语义化分组导出 ==========

/**
 * 基础请求方法 - 企业标准，基于 axios，支持拦截器、取消请求等
 */
export const base = {
  request,
  get: axiosGet,
  post: axiosPost,
  put: axiosPut,
  delete: axiosDelete,
  upload: axiosUpload,
}

/**
 * Fetch 请求 - 轻量级，适合特殊场景
 */
export const fetch = {
  request,
  get,
  post,
  put,
  delete: del,
  upload: fetchUpload,
}

/**
 * REST API 请求 - 功能丰富，适合复杂业务（同 base）
 */
export const rest = {
  get: axiosGet,
  post: axiosPost,
  put: axiosPut,
  delete: axiosDelete,
  upload: axiosUpload,
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
 * 工具函数 - 辅助功能
 */
export const utils = {
  generateId,
  scrollToBottom,
}

/**
 * 高级功能 - 智能选择和配置
 */
export const advanced = {
  selectRequestMethod,
  smartRequest,
  REQUEST_TYPES,
  SCENE_RECOMMENDATIONS,
  axios: axiosClient,
}

/**
 * 文件下载 - 绕过拦截器，直接处理 Blob 数据
 */
export const fileDownload = {
  get: downloadGet,
  post: downloadPost,
  ...download,
}

// ========== 兼容性导出（仅保留最基本的向后兼容）==========
export {
  // 企业标准方法（推荐使用 base 分组）
  axiosGet as get,
  axiosPost as post,
  axiosPut as put,
  axiosDelete as delete,
  axiosDelete as del, // 兼容原有 del 导入
  axiosUpload as upload,

  // 流式方法
  streamText,
  streamSSE,
  generateId,
  scrollToBottom,
  createSSEController,
  typewriterEffect,

  // Axios 相关（高级用户）
  axiosClient as axios,
  axiosGet,
  axiosPost,
  axiosPut,
  axiosDelete,
  axiosUpload,

  // 选择器相关（高级用户）
  selectRequestMethod,
  smartRequest,
  REQUEST_TYPES,
  SCENE_RECOMMENDATIONS,
}

// ========== 默认导出（推荐使用分组方式）==========
export default {
  base, // 企业标准请求（axios）
  fetch, // 轻量级请求（fetch）
  stream, // 流式请求
  utils, // 工具函数
  advanced, // 高级功能
  fileDownload, // 文件下载（绕过拦截器）
}
