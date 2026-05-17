/**
 * 角色管理 API
 */

import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/utils/http/axios-client'
import { downloadGet } from '@/utils/http/download'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取角色列表
 */
export function getRoleList(params) {
  return axiosGet(`${API_PREFIX}/roles`, params)
}

/**
 * 获取角色详情
 */
export function getRoleDetail(role_id) {
  return axiosGet(`${API_PREFIX}/roles/${role_id}`)
}

/**
 * 创建角色
 */
export function createRole(data) {
  return axiosPost(`${API_PREFIX}/roles`, data)
}

/**
 * 更新角色
 */
export function updateRole(role_id, data) {
  return axiosPut(`${API_PREFIX}/roles/${role_id}`, data)
}

/**
 * 删除角色
 */
export function deleteRole(role_id) {
  return axiosDelete(`${API_PREFIX}/roles/${role_id}`)
}

/**
 * 批量删除角色
 */
export function batchDeleteRole(role_ids) {
  return axiosPost(`${API_PREFIX}/roles/batch-delete`, { role_ids })
}

/**
 * 获取角色的菜单权限 ID 列表
 */
export function getRoleMenuIds(role_id) {
  return axiosGet(`${API_PREFIX}/roles/${role_id}/menu-ids`)
}

/**
 * 保存角色的菜单权限
 */
export function saveRoleMenus(role_id, menu_ids) {
  return axiosPut(`${API_PREFIX}/roles/${role_id}/menus`, { menu_ids })
}

/**
 * 获取角色的接口权限 ID 列表
 */
export function getRoleApiPaths(role_id) {
  return axiosGet(`${API_PREFIX}/roles/${role_id}/interface-ids`)
}

/**
 * 保存角色的接口权限
 */
export function saveRoleApis(role_id, interface_ids) {
  return axiosPut(`${API_PREFIX}/roles/${role_id}/interfaces`, { interface_ids })
}

/**
 * 获取角色的按钮权限 ID 列表
 */
export function getRoleButtonIds(role_id) {
  return axiosGet(`${API_PREFIX}/roles/${role_id}/button-ids`)
}

/**
 * 保存角色的按钮权限
 */
export function saveRoleButtons(role_id, button_ids) {
  return axiosPut(`${API_PREFIX}/roles/${role_id}/buttons`, { button_ids })
}

/**
 * 获取角色的所有权限（聚合查询）
 */
export function getRoleAllPermissions(role_id) {
  return axiosGet(`${API_PREFIX}/roles/${role_id}/permissions`)
}

/**
 * 导出角色数据为 Excel
 * @param {Object} params - 查询参数（支持 status, role_name, role_key）
 * @returns {Promise} 自动触发下载
 */
export function exportRoles(params = {}) {
  return downloadGet(`${API_PREFIX}/roles/export`, {
    params,
    moduleName: 'role'  // 生成 role_20260513.xlsx
  })
}
