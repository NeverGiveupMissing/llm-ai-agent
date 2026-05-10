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
 * @param {number} role_id - 角色ID
 * @returns {Promise} 返回角色详情
 */
export const getRoleDetail = (role_id) => axios.get(`${API_PREFIX}/roles/${role_id}`)

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
 * @param {number} role_id - 角色ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 返回更新结果
 */
export const updateRole = (role_id, data) => axios.put(`${API_PREFIX}/roles/${role_id}`, data)

/**
 * 删除角色
 * @param {number} role_id - 角色ID
 * @returns {Promise} 返回删除结果
 */
export const deleteRole = (role_id) => axios.delete(`${API_PREFIX}/roles/${role_id}`)

/**
 * 批量删除角色
 * @param {Array} role_ids - 角色ID数组
 * @returns {Promise} 返回删除结果
 */
export const batchDeleteRole = (role_ids) =>
  axios.post(`${API_PREFIX}/roles/batch-delete`, { role_ids })

/**
 * 为角色分配权限
 * @param {number} role_id - 角色ID
 * @param {Object} data - 权限数据
 * @param {string} data.permission_id - 权限ID
 * @returns {Promise} 返回分配结果
 */
export const assignPermission = (role_id, data) =>
  axios.post(`${API_PREFIX}/roles/${role_id}/permissions`, data)

/**
 * 批量为角色分配权限
 * @param {number} role_id - 角色ID
 * @param {Object} data - 权限数据
 * @param {Array} data.permission_ids - 权限ID数组
 * @returns {Promise} 返回分配结果
 */
export const assignPermissions = (role_id, data) =>
  axios.post(`${API_PREFIX}/roles/${role_id}/permissions/batch`, data)

/**
 * 移除角色权限
 * @param {number} role_id - 角色ID
 * @param {string} permission_id - 权限ID
 * @returns {Promise} 返回移除结果
 */
export const removePermission = (role_id, permission_id) =>
  axios.delete(`${API_PREFIX}/roles/${role_id}/permissions/${permission_id}`)

/**
 * 获取角色的所有用户
 * @param {number} role_id - 角色ID
 * @param {Object} params - 查询参数
 * @returns {Promise} 返回用户列表
 */
export const getRoleUsers = (role_id, params) =>
  axios.get(`${API_PREFIX}/roles/${role_id}/users`, params)

/**
 * 获取角色的菜单权限 ID 列表
 * @param {number} role_id - 角色ID
 * @returns {Promise<{data: number[]}>} 返回菜单 ID 数组
 */
export const getRolemenu_ids = (role_id) => axios.get(`${API_PREFIX}/roles/${role_id}/menu-ids`)

/**
 * 批量保存角色的菜单权限（覆盖更新）
 * @param {number} role_id - 角色ID
 * @param {Object} data - 菜单 ID 数组
 * @param {number[]} data.menu_ids - 菜单 ID 列表
 * @returns {Promise} 返回保存结果
 */
export const saveRoleMenus = (role_id, data) =>
  axios.put(`${API_PREFIX}/roles/${role_id}/menus`, data)

/**
 * 获取角色的接口权限路径列表
 * @param {number} role_id - 角色ID
 * @returns {Promise<{data: Array<{path: string, method: string}>}>} 返回接口路径数组，每个元素包含 path 和 method
 */
export const getRoleApiPaths = (role_id) => axios.get(`${API_PREFIX}/roles/${role_id}/api-paths`)

/**
 * 批量保存角色的接口权限（覆盖更新）
 * @param {number} role_id - 角色ID
 * @param {Object} data - 接口路径数组
 * @param {Array<{path: string, method: string}>} data.api_paths - 接口路径列表，每个元素包含 path 和 method
 * @returns {Promise} 返回保存结果
 */
export const saveRoleApis = (role_id, data) =>
  axios.put(`${API_PREFIX}/roles/${role_id}/api-paths`, data)
