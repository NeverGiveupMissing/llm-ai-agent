/**
 * 用户管理 API
 */

import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/utils/http/axios-client'
import { downloadGet } from '@/utils/http/download'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取用户列表
 */
export function getUserList(params) {
  return axiosGet(`${API_PREFIX}/users`, params)
}

/**
 * 获取用户详情
 */
export function getUserDetail(user_id) {
  return axiosGet(`${API_PREFIX}/users/${user_id}`)
}

/**
 * 创建用户
 */
export function createUser(data) {
  return axiosPost(`${API_PREFIX}/users`, data)
}

/**
 * 更新用户
 */
export function updateUser(user_id, data) {
  return axiosPut(`${API_PREFIX}/users/${user_id}`, data)
}

/**
 * 删除用户
 */
export function deleteUser(user_id) {
  return axiosDelete(`${API_PREFIX}/users/${user_id}`)
}

/**
 * 批量删除用户
 */
export function batchDeleteUser(user_ids) {
  return axiosPost(`${API_PREFIX}/users/batch-delete`, { user_ids })
}

/**
 * 更新用户状态
 */
export function updateUserStatus(user_id, status) {
  return axiosPut(`${API_PREFIX}/users/${user_id}/status`, { status })
}

/**
 * 重置用户密码
 */
export function resetPassword(user_id, new_password) {
  return axiosPost(`${API_PREFIX}/users/${user_id}/reset-password`, { new_password })
}

/**
 * 为用户分配角色
 */
export function assignRole(user_id, role_id) {
  return axiosPost(`${API_PREFIX}/users/${user_id}/roles`, { role_id })
}

/**
 * 批量分配角色
 */
export function assignRoles(user_id, role_ids) {
  return axiosPut(`${API_PREFIX}/users/${user_id}/roles`, { role_ids })
}

/**
 * 移除用户角色
 */
export function removeRole(user_id, role_id) {
  return axiosDelete(`${API_PREFIX}/users/${user_id}/roles/${role_id}`)
}

/**
 * 导出用户数据为 Excel
 * @param {Object} params - 查询参数（支持 status, user_name, phonenumber, start_time, end_time）
 * @returns {Promise} 自动触发下载
 */
export function exportUsers(params = {}) {
  return downloadGet(`${API_PREFIX}/users/export`, {
    params,
    moduleName: 'user'  // 生成 user_20260513.xlsx
  })
}
