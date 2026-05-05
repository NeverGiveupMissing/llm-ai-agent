// 说明：角色管理 API
import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取角色列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.keyword - 搜索关键词
 * @returns {Promise} 返回角色列表
 */
export const getRoleList = (params) => axios.get(`${API_PREFIX}/roles`, params)

/**
 * 获取角色详情
 * @param {string} roleId - 角色ID
 * @returns {Promise} 返回角色详情
 */
export const getRoleDetail = (roleId) => axios.get(`${API_PREFIX}/roles/${roleId}`)

/**
 * 创建角色
 * @param {Object} data - 角色数据
 * @param {string} data.name - 角色名称（英文标识）
 * @param {string} data.displayName - 显示名称
 * @param {string} data.description - 描述
 * @param {boolean} data.isSystem - 是否为系统角色
 * @returns {Promise} 返回创建的角色
 */
export const createRole = (data) => axios.post(`${API_PREFIX}/roles`, data)

/**
 * 更新角色信息
 * @param {string} roleId - 角色ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 返回更新结果
 */
export const updateRole = (roleId, data) => axios.put(`${API_PREFIX}/roles/${roleId}`, data)

/**
 * 删除角色
 * @param {string} roleId - 角色ID
 * @returns {Promise} 返回删除结果
 */
export const deleteRole = (roleId) => axios.delete(`${API_PREFIX}/roles/${roleId}`)

/**
 * 为角色分配权限
 * @param {string} roleId - 角色ID
 * @param {Object} data - 权限数据
 * @param {string} data.permissionId - 权限ID
 * @returns {Promise} 返回分配结果
 */
export const assignPermission = (roleId, data) => axios.post(`${API_PREFIX}/roles/${roleId}/permissions`, data)

/**
 * 批量为角色分配权限
 * @param {string} roleId - 角色ID
 * @param {Object} data - 权限数据
 * @param {Array} data.permissionIds - 权限ID数组
 * @returns {Promise} 返回分配结果
 */
export const assignPermissions = (roleId, data) => axios.post(`${API_PREFIX}/roles/${roleId}/permissions/batch`, data)

/**
 * 移除角色权限
 * @param {string} roleId - 角色ID
 * @param {string} permissionId - 权限ID
 * @returns {Promise} 返回移除结果
 */
export const removePermission = (roleId, permissionId) => axios.delete(`${API_PREFIX}/roles/${roleId}/permissions/${permissionId}`)

/**
 * 获取角色的所有用户
 * @param {string} roleId - 角色ID
 * @param {Object} params - 查询参数
 * @returns {Promise} 返回用户列表
 */
export const getRoleUsers = (roleId, params) => axios.get(`${API_PREFIX}/roles/${roleId}/users`, params)

/**
 * 获取角色的菜单权限 ID 列表
 * @param {number} roleId - 角色ID
 * @returns {Promise<{data: number[]}>} 返回菜单 ID 数组
 */
export const getRoleMenuIds = (roleId) => axios.get(`${API_PREFIX}/roles/${roleId}/menu-ids`)

/**
 * 批量保存角色的菜单权限（覆盖更新）
 * @param {number} roleId - 角色ID
 * @param {Object} data - 菜单 ID 数组
 * @param {number[]} data.menuIds - 菜单 ID 列表
 * @returns {Promise} 返回保存结果
 */
export const saveRoleMenus = (roleId, data) => axios.put(`${API_PREFIX}/roles/${roleId}/menus`, data)