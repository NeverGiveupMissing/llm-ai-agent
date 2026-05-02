// 说明：权限相关 API 接口
// 路径：src/api/permission.js

import { rest } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取当前用户的菜单树
 * @returns {Promise} 菜单树数据
 */
export function getMenuTree() {
  return rest.get(`${API_PREFIX}/permissions/menu-tree`)
}

/**
 * 获取当前用户的所有权限
 * @returns {Promise} 权限列表
 */
export function getMyPermissions() {
  return rest.get(`${API_PREFIX}/permissions/my-permissions`)
}

/**
 * 检查用户权限
 * @param {string} permissionCode - 权限代码
 * @returns {Promise} 权限检查结果
 */
export function checkPermission(permissionCode) {
  return rest.post(`${API_PREFIX}/permissions/check`, { permissionCode })
}

/**
 * 获取权限列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 权限列表
 */
export function getPermissionList(params) {
  return rest.get(`${API_PREFIX}/permissions`, { params })
}

/**
 * 获取权限树形结构
 * @returns {Promise} 权限树
 */
export function getPermissionTree() {
  return rest.get(`${API_PREFIX}/permissions/tree`)
}

/**
 * 创建权限
 * @param {Object} data - 权限数据
 * @returns {Promise} 创建结果
 */
export function createPermission(data) {
  return rest.post(`${API_PREFIX}/permissions`, data)
}

/**
 * 更新权限
 * @param {string} permissionId - 权限ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 更新结果
 */
export function updatePermission(permissionId, data) {
  return rest.put(`${API_PREFIX}/permissions/${permissionId}`, data)
}

/**
 * 删除权限
 * @param {string} permissionId - 权限ID
 * @returns {Promise} 删除结果
 */
export function deletePermission(permissionId) {
  return rest.delete(`${API_PREFIX}/permissions/${permissionId}`)
}