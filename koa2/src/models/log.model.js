/**
 * 日志查询参数接口
 * @typedef {Object} LogQueryParams
 * @property {string} [date] - 日期
 * @property {number} [limit] - 限制数量
 * @property {string} [keyword] - 关键词
 * @property {string} [status] - 状态
 * @property {string} [session_id] - 会话 ID
 */

/**
 * 日志服务接口
 * @interface LogServiceInterface
 */
const LogServiceInterface = {
  /**
   * 获取日志列表
   * @param {LogQueryParams} params - 查询参数
   * @returns {Promise<Object>} 日志数据
   */
  getLogs: async (params) => {},

  /**
   * 获取今日日志
   * @param {LogQueryParams} params - 查询参数
   * @returns {Promise<Object>} 今日日志
   */
  getTodayLogs: async (params) => {},
}

module.exports = { LogServiceInterface }
