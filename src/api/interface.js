/**
 * 接口管理 API
 */

import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/utils/http/axios-client'
import { downloadGet } from '@/utils/http/download'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取接口列表
 * @param {Object} params - 查询参数
 */
export function getInterfaceList(params) {
  return axiosGet(`${API_PREFIX}/interfaces`, params)
}

/**
 * 获取接口详情
 */
export function getInterfaceDetail(interface_id) {
  return axiosGet(`${API_PREFIX}/interfaces/${interface_id}`)
}

/**
 * 创建接口
 */
export function createInterface(data) {
  return axiosPost(`${API_PREFIX}/interfaces`, data)
}

/**
 * 更新接口
 */
export function updateInterface(interface_id, data) {
  return axiosPut(`${API_PREFIX}/interfaces/${interface_id}`, data)
}

/**
 * 删除接口
 */
export function deleteInterface(interface_id) {
  return axiosDelete(`${API_PREFIX}/interfaces/${interface_id}`)
}

/**
 * 导出接口数据为 Excel
 * @param {Object} params - 查询参数（支持 interface_name, interface_url, interface_method, status）
 * @returns {Promise} 自动触发下载
 */
export function exportInterfaces(params = {}) {
  return downloadGet(`${API_PREFIX}/interfaces/export`, {
    params,
    moduleName: 'interface', // 生成 interface_20260513.xlsx
  })
}
