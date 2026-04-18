/**
 * 辅助函数
 */

/**
 * 格式化时长
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长
 */
function formatDuration(seconds) {
  return `${seconds.toFixed(2)}s`
}

/**
 * 计算成功率
 * @param {number} success - 成功数量
 * @param {number} total - 总数量
 * @returns {string} 成功率百分比
 */
function calculateSuccessRate(success, total) {
  if (total === 0) return '0%'
  return `${((success / total) * 100).toFixed(1)}%`
}

/**
 * 计算平均值
 * @param {number[]} values - 数值数组
 * @returns {string} 平均值
 */
function calculateAverage(values) {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

module.exports = { formatDuration, calculateSuccessRate, calculateAverage }
