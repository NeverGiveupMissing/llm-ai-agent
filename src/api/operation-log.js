import { axios } from '@/utils/http'
import { downloadGet } from '@/utils/http/download'
import { API_PREFIX } from '@/utils/constants'

const OPERATION_LOG_PREFIX = `${API_PREFIX}/operation-logs`

/**
 * 获取操作日志列表
 */
export const getOperationLogs = (params) => axios.get(OPERATION_LOG_PREFIX, params)

/**
 * 获取操作日志详情
 */
export const getOperationLogById = (id) => axios.get(`${OPERATION_LOG_PREFIX}/${id}`)

/**
 * 删除操作日志
 */
export const deleteOperationLog = (id) => axios.delete(`${OPERATION_LOG_PREFIX}/${id}`)

/**
 * 批量删除操作日志
 */
export const batchDeleteOperationLogs = (ids) => axios.post(`${OPERATION_LOG_PREFIX}/batch-delete`, { ids })

/**
 * 清空所有操作日志
 */
export const clearAllOperationLogs = () => axios.post(`${OPERATION_LOG_PREFIX}/clear-all`)

/**
 * 获取统计数据
 */
export const getOperationLogStats = (params) => axios.get(`${OPERATION_LOG_PREFIX}/stats`, params)

/**
 * 导出操作日志数据为 Excel
 * @param {Object} params - 查询参数（支持 username, module, action, start_time, end_time）
 * @returns {Promise} 自动触发下载
 */
export const exportOperationLogs = (params = {}) => {
  return downloadGet(`${OPERATION_LOG_PREFIX}/export`, {
    params,
    moduleName: 'operation-log'  // 生成 operation-log_20260524.xlsx
  })
}