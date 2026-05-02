import { base, rest } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 记忆管理 API
 * 提供记忆的增删改查、检索、统计等功能
 */

/**
 * 获取记忆列表（分页）
 * @param {Object} params - 查询参数
 * @param {string} params.userId - 用户ID
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 * @param {string} params.type - 记忆类型筛选（可选）
 */
export const getMemoryList = (params) => rest.get(`${API_PREFIX}/memory/list`, params)

/**
 * 创建记忆
 * @param {Object} data - 记忆数据
 * @param {string} data.userId - 用户ID
 * @param {string} data.content - 记忆内容
 * @param {string} data.memoryType - 记忆类型（fact/preference/goal/event/opinion）
 * @param {number} data.importance - 重要性（1-10）
 * @param {Array} data.tags - 标签数组
 */
export const createMemory = (data) => rest.post(`${API_PREFIX}/memory/create`, data)

/**
 * 更新记忆
 * @param {string} memoryId - 记忆ID
 * @param {Object} data - 更新数据
 */
export const updateMemory = (memoryId, data) => rest.put(`${API_PREFIX}/memory/${memoryId}`, data)

/**
 * 删除记忆
 * @param {string} memoryId - 记忆ID
 */
export const deleteMemory = (memoryId) => rest.delete(`${API_PREFIX}/memory/${memoryId}`)

/**
 * 检索相关记忆（向量相似度搜索）
 * @param {Object} data - 检索参数
 * @param {string} data.userId - 用户ID
 * @param {string} data.query - 查询内容
 * @param {number} data.limit - 返回数量
 */
export const retrieveMemories = (data) => rest.post(`${API_PREFIX}/memory/retrieve`, data)

/**
 * 从对话中提取记忆（AI 自动提取）
 * @param {Object} data - 提取参数
 * @param {string} data.userId - 用户ID
 * @param {Array} data.messages - 对话消息数组
 */
export const extractMemories = (data) => rest.post(`${API_PREFIX}/memory/extract`, data)

/**
 * 获取记忆统计信息
 * @param {string} userId - 用户ID
 */
export const getMemoryStats = (userId) => rest.get(`${API_PREFIX}/memory/stats`, { userId })

/**
 * 清空用户的所有记忆
 * @param {string} userId - 用户ID
 */
export const clearMemories = (userId) => rest.post(`${API_PREFIX}/memory/clear`, { userId })
