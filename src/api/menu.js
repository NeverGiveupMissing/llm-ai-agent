/**
 * 菜单管理 API
 */

/**
 * @typedef {Object} SysMenu
 * @property {number} [menu_id] - 菜单ID
 * @property {string} menu_name - 菜单名称
 * @property {number} parent_id - 父菜单ID
 * @property {number} order_num - 显示顺序
 * @property {string} [path] - 路由地址
 * @property {string} [component] - 组件路径
 * @property {string} [query] - 路由参数
 * @property {string} [route_name] - 路由名称
 * @property {number} [is_frame] - 是否外链 (1是 0否)
 * @property {number} [is_cache] - 是否缓存 (1是 0否)
 * @property {string} menu_type - 菜单类型 (M目录 C菜单 F按钮)
 * @property {string} visible - 显示状态 (0显示 1隐藏)
 * @property {string} status - 菜单状态 (0正常 1停用)
 * @property {string} [perms] - 权限标识
 * @property {string} [icon] - 菜单图标
 * @property {string} [create_by] - 创建者
 * @property {string} [create_time] - 创建时间
 * @property {string} [update_by] - 更新者
 * @property {string} [update_time] - 更新时间
 * @property {string} [remark] - 备注
 * @property {SysMenu[]} [children] - 子菜单列表 (树形结构时使用)
 */

import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取菜单列表（树形结构）
 * @param {Object} [params] - 查询参数（下划线命名）
 * @param {string} [params.menu_id] - 菜单ID（精确匹配）
 * @param {string} [params.menu_name] - 菜单名称（模糊搜索）
 * @param {string} [params.menu_type] - 菜单类型 (M/C/F)
 * @param {string} [params.perms] - 权限标识（模糊匹配）
 * @param {string} [params.visible] - 是否显示（0显示 1隐藏）
 * @param {string} [params.status] - 状态（0正常 1停用）
 * @returns {Promise<{data: SysMenu[]}>}
 */
export function getMenuList(params) {
  return axios.get(`${API_PREFIX}/menus`, params)
}

/**
 * 获取菜单详情
 * @param {number} menuId - 菜单ID
 * @returns {Promise<{data: SysMenu}>}
 */
export function getMenuDetail(menuId) {
  return axios.get(`${API_PREFIX}/menus/${menuId}`)
}

/**
 * 创建菜单
 * @param {SysMenu} data - 菜单数据
 * @returns {Promise<{data: SysMenu}>}
 */
export function createMenu(data) {
  return axios.post(`${API_PREFIX}/menus`, data)
}

/**
 * 更新菜单
 * @param {number} menuId - 菜单ID
 * @param {Partial<SysMenu>} data - 菜单数据
 * @returns {Promise<{data: SysMenu}>}
 */
export function updateMenu(menuId, data) {
  return axios.put(`${API_PREFIX}/menus/${menuId}`, data)
}

/**
 * 删除菜单
 * @param {number} menuId - 菜单ID
 * @returns {Promise<{message: string}>}
 */
export function deleteMenu(menuId) {
  return axios.delete(`${API_PREFIX}/menus/${menuId}`)
}

/**
 * 获取用户菜单树（用于动态路由）
 * @returns {Promise<{data: SysMenu[]}>}
 */
export function getUserMenus() {
  return axios.get(`${API_PREFIX}/menus/tree`)
}
