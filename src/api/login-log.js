// 说明：登录日志 API
import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取当前用户的登录日志
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @returns {Promise} 返回登录日志列表
 */
export const getMyLoginLogs = (params) => axios.get(`${API_PREFIX}/login-logs/my`, params)

/**
 * 获取所有登录日志（管理员）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.username - 用户名筛选
 * @param {string} params.status - 状态筛选
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @param {string} params.keyword - 搜索关键词
 * @returns {Promise} 返回登录日志列表
 */
export const getAllLoginLogs = (params) => axios.get(`${API_PREFIX}/login-logs`, params)

/**
 * 删除登录日志
 * @param {string} id - 日志ID
 * @returns {Promise} 返回删除结果
 */
export const deleteLoginLog = (id) => axios.delete(`${API_PREFIX}/login-logs/${id}`)

/**
 * 批量删除登录日志
 * @param {Array} ids - 日志ID数组
 * @returns {Promise} 返回删除结果
 */
export const batchDeleteLoginLogs = (ids) => axios.post(`${API_PREFIX}/login-logs/batch-delete`, { ids })

/**
 * 清空所有登录日志
 * @returns {Promise} 返回清空结果
 */
export const clearAllLoginLogs = () => axios.post(`${API_PREFIX}/login-logs/clear-all`)
