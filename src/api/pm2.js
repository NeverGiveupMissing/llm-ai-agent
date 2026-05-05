// 说明：PM2 日志管理 API
import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 获取 PM2 日志
 * @param {Object} params - 查询参数
 * @param {string} [params.type='out'] - 日志类型（out 或 error）
 * @param {number} [params.lines=100] - 返回行数
 * @param {string} [params.process='ai-api'] - 进程名称
 */
export function getPm2Logs(params = {}) {
  // smithyuyi001 页面使用公开接口（页面本身有密码验证）
  return axios.get(`${API_PREFIX}/logs/pm2/detail`, { params })
}

/**
 * 获取 PM2 日志文件列表
 */
export function getPm2LogFiles() {
  return axios.get(`${API_PREFIX}/logs/pm2/files`)
}

/**
 * 清空 PM2 日志
 */
export function clearPm2Logs() {
  return axios.post(`${API_PREFIX}/logs/pm2/clear`)
}