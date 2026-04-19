import { get, post, put, del } from '@/utils/http'
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
 * @returns {Promise} 返回记忆列表
 */
export const getMemoryList = (params) => get(`${API_PREFIX}/memory/list`, params)

/**
 * 创建记忆
 * @param {Object} data - 记忆数据
 * @param {string} data.userId - 用户ID
 * @param {string} data.content - 记忆内容
 * @param {string} data.memoryType - 记忆类型（fact/preference/goal/event/opinion）
 * @param {number} data.importance - 重要性（1-10）
 * @param {Array} data.tags - 标签数组
 * @returns {Promise} 返回创建的记忆
 */
export const createMemory = (data) => post(`${API_PREFIX}/memory/create`, data)

/**
 * 检索相关记忆（向量相似度搜索）
 * @param {Object} data - 检索参数
 * @param {string} data.userId - 用户ID
 * @param {string} data.query - 查询内容
 * @param {number} data.limit - 返回数量
 * @returns {Promise} 返回相关记忆列表
 */
export const retrieveMemories = (data) => post(`${API_PREFIX}/memory/retrieve`, data)

/**
 * 从对话中提取记忆（AI 自动提取）
 * @param {Object} data - 提取参数
 * @param {string} data.userId - 用户ID
 * @param {Array} data.messages - 对话消息数组
 * @returns {Promise} 返回提取的记忆列表
 */
export const extractMemories = (data) => post(`${API_PREFIX}/memory/extract`, data)

/**
 * 获取记忆统计信息
 * @param {Object} params - 查询参数
 * @param {string} params.userId - 用户ID
 * @returns {Promise} 返回统计数据
 */
export const getMemoryStats = (params) => get(`${API_PREFIX}/memory/stats`, params)

/**
 * 更新记忆
 * @param {string} id - 记忆ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 返回更新后的记忆
 */
export const updateMemory = (id, data) => put(`${API_PREFIX}/memory/${id}`, data)

/**
 * 删除记忆（软删除）
 * @param {string} id - 记忆ID
 * @returns {Promise} 返回删除结果
 */
export const deleteMemory = (id) => del(`${API_PREFIX}/memory/${id}`)

/**
 * 清空用户所有记忆（硬删除）
 * @param {Object} data - 清空参数
 * @param {string} data.userId - 用户ID
 * @returns {Promise} 返回清空结果
 */
export const clearMemories = (data) => post(`${API_PREFIX}/memory/clear`, data)
