import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取接口列表（分页）
 * @param {Object} params - 查询参数
 */
export const getInterfaceList = (params) => axios.get(`${API_PREFIX}/interfaces`, params)

/**
 * 获取接口详情
 * @param {number} id - 接口ID
 */
export const getInterfaceDetail = (id) => axios.get(`${API_PREFIX}/interfaces/${id}`)

/**
 * 创建接口
 * @param {Object} data - 接口数据
 */
export const createInterface = (data) => axios.post(`${API_PREFIX}/interfaces`, data)

/**
 * 更新接口
 * @param {number} id - 接口ID
 * @param {Object} data - 更新数据
 */
export const updateInterface = (id, data) => axios.put(`${API_PREFIX}/interfaces/${id}`, data)

/**
 * 删除接口
 * @param {number} id - 接口ID
 */
export const deleteInterface = (id) => axios.delete(`${API_PREFIX}/interfaces/${id}`)

/**
 * 获取所有接口
 */
export const getAllInterfaces = () => axios.get(`${API_PREFIX}/interfaces/all`)