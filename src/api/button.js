/**
 * 按钮权限管理 API
 */

import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/utils/http/axios-client'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取按钮列表（分页）
 */
export function getButtonList(params) {
  return axiosGet(`${API_PREFIX}/buttons`, params)
}

/**
 * 获取按钮详情
 */
export function getButtonDetail(button_id) {
  return axiosGet(`${API_PREFIX}/buttons/${button_id}`)
}

/**
 * 创建按钮
 */
export function createButton(data) {
  return axiosPost(`${API_PREFIX}/buttons`, data)
}

/**
 * 更新按钮
 */
export function updateButton(button_id, data) {
  return axiosPut(`${API_PREFIX}/buttons/${button_id}`, data)
}

/**
 * 删除按钮
 */
export function deleteButton(button_id) {
  return axiosDelete(`${API_PREFIX}/buttons/${button_id}`)
}

/**
 * 批量删除按钮
 */
export function batchDeleteButtons(ids) {
  return axiosPost(`${API_PREFIX}/buttons/batch-delete`, { ids })
}

/**
 * 根据菜单ID获取所有按钮
 */
export function getButtonsByMenuId(menu_id) {
  return axiosGet(`${API_PREFIX}/buttons/menu/${menu_id}`)
}
