// 说明：对话记忆 API - 提供记忆上下文、自动提取和手动管理接口

import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取会话记忆上下文（对话前调用）
 * @param {Object} params
 * @param {string} params.sessionId - 会话ID
 * @param {string} params.user_id - 用户ID
 * @param {string} params.query - 查询内容（用于检索相关记忆）
 */
export const getSessionMemoryContext = (params) => {
  return axios.get(`${API_PREFIX}/chat-memory/context`, params)
}

/**
 * 自动提取对话记忆（对话后调用）
 * @param {Object} data
 * @param {string} data.sessionId - 会话ID
 * @param {string} data.user_id - 用户ID
 * @param {Array} data.messages - 对话消息数组
 */
export const autoExtractMemories = (data, options = {}) => {
  return axios.post(`${API_PREFIX}/chat-memory/extract`, data, options)
}

/**
 * 获取会话记忆列表
 * @param {string} sessionId - 会话ID
 */
export const getSessionMemories = (sessionId) => {
  return axios.get(`${API_PREFIX}/chat-memory`, { sessionId })
}

/**
 * 手动添加记忆到会话（可选功能）
 * @param {Object} data
 * @param {string} data.sessionId - 会话ID
 * @param {string} data.memoryId - 记忆ID
 */
export const addMemoryToSession = (data) => {
  return axios.post(`${API_PREFIX}/chat-memory`, data)
}

/**
 * 从会话移除记忆（可选功能）
 * @param {string} sessionId - 会话ID
 * @param {string} memoryId - 记忆ID
 */
export const removeMemoryFromSession = (sessionId, memoryId) => {
  return axios.delete(`${API_PREFIX}/chat-memory/${sessionId}/${memoryId}`)
}

/**
 * 清空会话记忆
 * @param {string} sessionId - 会话ID
 */
export const clearSessionMemories = (sessionId) => {
  return axios.delete(`${API_PREFIX}/chat-memory/${sessionId}/clear`)
}
