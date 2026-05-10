// 说明：用户管理 API
import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取用户列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 状态筛选
 * @param {string} params.keyword - 搜索关键词
 * @returns {Promise} 返回用户列表
 */
export const getUserList = (params) => axios.get(`${API_PREFIX}/users`, params)

/**
 * 获取用户详情
 * @param {string} user_id - 用户ID
 * @returns {Promise} 返回用户详情
 */
export const getUserDetail = (user_id) => axios.get(`${API_PREFIX}/users/${user_id}`)

/**
 * 创建用户
 * @param {Object} data - 用户数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.email - 邮箱
 * @param {string} data.avatarUrl - 头像URL
 * @returns {Promise} 返回创建的用户
 */
export const createUser = (data) => axios.post(`${API_PREFIX}/users/register`, data)

/**
 * 更新用户信息
 * @param {string} user_id - 用户ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 返回更新结果
 */
export const updateUser = (user_id, data) => axios.put(`${API_PREFIX}/users/${user_id}`, data)

/**
 * 删除用户
 * @param {string} user_id - 用户ID
 * @returns {Promise} 返回删除结果
 */
export const deleteUser = (user_id) => axios.delete(`${API_PREFIX}/users/${user_id}`)

/**
 * 批量删除用户
 * @param {Array} user_ids - 用户ID数组
 * @returns {Promise} 返回删除结果
 */
export const batchDeleteUser = (user_ids) =>
  axios.post(`${API_PREFIX}/users/batch-delete`, { ids: user_ids })

/**
 * 为用户分配角色
 * @param {string} user_id - 用户ID
 * @param {Object} data - 角色数据
 * @param {string} data.role_id - 角色ID
 * @returns {Promise} 返回分配结果
 */
export const assignRole = (user_id, data) =>
  axios.post(`${API_PREFIX}/users/${user_id}/roles`, data)

/**
 * 移除用户角色
 * @param {string} user_id - 用户ID
 * @param {string} role_id - 角色ID
 * @returns {Promise} 返回移除结果
 */
export const removeRole = (user_id, role_id) =>
  axios.delete(`${API_PREFIX}/users/${user_id}/roles/${role_id}`)

/**
 * 获取用户的所有角色
 * @param {string} user_id - 用户ID
 * @returns {Promise} 返回角色列表
 */
export const getUserRoles = (user_id) => axios.get(`${API_PREFIX}/users/${user_id}/roles`)

/**
 * 重置用户密码（管理员操作）
 * @param {string} user_id - 用户ID
 * @param {Object} data - 密码数据
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} 返回重置结果
 */
export const resetPassword = (user_id, data) =>
  axios.post(`${API_PREFIX}/users/${user_id}/reset-password`, data)

/**
 * 更新用户状态
 * @param {string} user_id - 用户ID
 * @param {Object} data - 状态数据
 * @param {string} data.status - 新状态（active/banned）
 * @returns {Promise} 返回更新结果
 */
export const updateUserStatus = (user_id, data) =>
  axios.put(`${API_PREFIX}/users/${user_id}/status`, data)
