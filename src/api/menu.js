/**
 * 菜单管理 API
 */

import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/utils/http/axios-client'
import { downloadGet } from '@/utils/http/download'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取菜单树
 */
export function getMenuTree() {
  return axiosGet(`${API_PREFIX}/menus/tree`)
}

/**
 * 获取菜单列表
 */
export function getMenuList(params) {
  return axiosGet(`${API_PREFIX}/menus`, params)
}

/**
 * 获取菜单详情
 */
export function getMenuDetail(menu_id) {
  return axiosGet(`${API_PREFIX}/menus/${menu_id}`)
}

/**
 * 创建菜单
 */
export function createMenu(data) {
  return axiosPost(`${API_PREFIX}/menus`, data)
}

/**
 * 更新菜单
 */
export function updateMenu(menu_id, data) {
  return axiosPut(`${API_PREFIX}/menus/${menu_id}`, data)
}

/**
 * 删除菜单
 */
export function deleteMenu(menu_id) {
  return axiosDelete(`${API_PREFIX}/menus/${menu_id}`)
}

/**
 * 获取当前用户的菜单树
 */
export function getUserMenus() {
  return axiosGet(`${API_PREFIX}/menus/tree`)  // ✅ 修复：添加 /koa2api 前缀
}

/**
 * 导出菜单数据为 Excel
 * @param {Object} params - 查询参数（支持 menu_name, menu_type, status）
 * @returns {Promise} 自动触发下载
 */
export function exportMenus(params = {}) {
  return downloadGet(`${API_PREFIX}/menus/export`, {
    params,
    moduleName: 'menu'  // 生成 menu_20260513.xlsx
  })
}
