import { get } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取日志列表
 * @param {Object} params - 查询参数
 */
export function getLogs(params) {
  return get(`${API_PREFIX}/logs`, params)
}

/**
 * 获取统计信息
 * @param {Object} params - 查询参数
 */
export function getLogsStats(params) {
  return get(`${API_PREFIX}/logs/stats`, params)
}
