import { rest } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

const OPERATION_LOG_PREFIX = `${API_PREFIX}/operation-logs`

/**
 * 获取操作日志列表
 */
export const getOperationLogs = (params) => rest.get(OPERATION_LOG_PREFIX, params)

/**
 * 获取操作日志详情
 */
export const getOperationLogById = (id) => rest.get(`${OPERATION_LOG_PREFIX}/${id}`)

/**
 * 删除操作日志
 */
export const deleteOperationLog = (id) => rest.delete(`${OPERATION_LOG_PREFIX}/${id}`)

/**
 * 批量删除操作日志
 */
export const batchDeleteOperationLogs = (ids) => rest.post(`${OPERATION_LOG_PREFIX}/batch-delete`, { ids })

/**
 * 清空所有操作日志
 */
export const clearAllOperationLogs = () => rest.post(`${OPERATION_LOG_PREFIX}/clear-all`)

/**
 * 获取统计数据
 */
export const getOperationLogStats = (params) => rest.get(`${OPERATION_LOG_PREFIX}/stats`, params)