const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const config = require('../config')
const { calculateSuccessRate, calculateAverage } = require('../utils/helpers')

const LOG_DIR = path.join(process.cwd(), config.log.dir)

class LogsService {
  /**
   * 获取日志列表
   * @param {Object} params - 查询参数
   * @param {string} [params.date] - 日期
   * @param {number} [params.limit=50] - 限制数量
   * @param {string} [params.keyword] - 关键词
   * @param {string} [params.status] - 状态
   * @returns {Promise<Object>} 日志数据
   */
  async getLogs(params) {
    if (!fs.existsSync(LOG_DIR)) {
      return { count: 0, logs: [], message: '暂无日志' }
    }

    const { date, limit = 50, keyword, status } = params
    let allLogs = []
    let queryDates = []

    if (date) {
      const logFile = path.join(LOG_DIR, `chat_${date}.jsonl`)
      if (fs.existsSync(logFile)) {
        allLogs = this.readLogFile(logFile)
      }
      queryDates = [date]
    } else {
      const logFiles = this.getLogFiles()
      for (const logFile of logFiles) {
        const dateStr = path.basename(logFile, '.jsonl').replace('chat_', '')
        queryDates.push(dateStr)
        allLogs = allLogs.concat(this.readLogFile(logFile))
      }
    }

    let filteredLogs = allLogs
    if (status) {
      filteredLogs = filteredLogs.filter((log) => log.status === status)
    }
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      filteredLogs = filteredLogs.filter((log) => {
        const searchText = (log.input_preview + log.output_preview).toLowerCase()
        return searchText.includes(lowerKeyword)
      })
    }
    // 按时间倒序排序（最新的在前）
    filteredLogs.sort((a, b) => new Date(b.time) - new Date(a.time))

    const resultLogs = filteredLogs.slice(0, limit)

    return {
      count: resultLogs.length,
      dates: queryDates,
      logs: resultLogs,
    }
  }

  /**
   * 获取今日日志
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 今日日志
   */
  async getTodayLogs(params) {
    const today = dayjs().format('YYYY-MM-DD')
    const logFile = path.join(LOG_DIR, `chat_${today}.jsonl`)

    if (!fs.existsSync(logFile)) {
      return { count: 0, logs: [], message: '今日暂无日志' }
    }

    let logs = this.readLogFile(logFile)

    const { limit = 50, keyword, status, session_id } = params
    if (status) {
      logs = logs.filter((log) => log.status === status)
    }
    if (session_id) {
      logs = logs.filter((log) => log.session_id === session_id)
    }
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      logs = logs.filter((log) => {
        const searchText = (log.input_preview + log.output_preview).toLowerCase()
        return searchText.includes(lowerKeyword)
      })
    }

    return {
      count: logs.length,
      logs: logs.slice(0, limit),
    }
  }

  /**
   * 通过 Trace ID 查询日志
   * @param {string} traceId - 追踪 ID
   * @returns {Promise<Object>} 日志或错误
   */
  async getTraceLog(traceId) {
    const today = dayjs().format('YYYY-MM-DD')
    const logFile = path.join(LOG_DIR, `chat_${today}.jsonl`)

    if (!fs.existsSync(logFile)) {
      return { error: '今日暂无日志' }
    }

    const logs = this.readLogFile(logFile)
    const log = logs.find((l) => l.trace_id === traceId)

    return log || { error: `未找到 trace_id: ${traceId}` }
  }

  /**
   * 获取会话日志
   * @param {string} sessionId - 会话 ID
   * @param {number} [limit=50] - 限制数量
   * @returns {Promise<Object>} 会话日志
   */
  async getSessionLogs(sessionId, limit = 50) {
    const today = dayjs().format('YYYY-MM-DD')
    const logFile = path.join(LOG_DIR, `chat_${today}.jsonl`)

    if (!fs.existsSync(logFile)) {
      return { count: 0, session_id: sessionId, logs: [] }
    }

    const logs = this.readLogFile(logFile).filter((log) => log.session_id === sessionId)

    return {
      count: logs.length,
      session_id: sessionId,
      logs: logs.slice(0, limit),
    }
  }

  /**
   * 获取可用日期列表
   * @returns {Promise<Object>} 日期列表
   */
  async getAvailableDates() {
    if (!fs.existsSync(LOG_DIR)) {
      return { dates: [] }
    }

    const dates = this.getLogFiles().map((file) =>
      path.basename(file, '.jsonl').replace('chat_', ''),
    )

    return { dates }
  }

  /**
   * 获取统计信息
   * @param {string} [date] - 日期
   * @returns {Promise<Object>} 统计数据
   */
  async getStats(date) {
    const queryDate = date || dayjs().format('YYYY-MM-DD')
    const logFile = path.join(LOG_DIR, `chat_${queryDate}.jsonl`)

    if (!fs.existsSync(logFile)) {
      return { date: queryDate, total: 0 }
    }

    const logs = this.readLogFile(logFile)
    const total = logs.length
    const success = logs.filter((log) => log.status === 'success').length
    const failed = total - success
    const durations = logs.map((log) => log.duration)
    const inputTokens = logs.reduce((sum, log) => sum + (log.tokens?.input || 0), 0)
    const outputTokens = logs.reduce((sum, log) => sum + (log.tokens?.output || 0), 0)

    return {
      date: queryDate,
      total,
      success,
      failed,
      success_rate: calculateSuccessRate(success, total),
      avg_duration: calculateAverage(durations),
      total_tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
    }
  }

  /**
   * 读取日志文件
   * @private
   * @param {string} filePath - 文件路径
   * @returns {Array} 日志数组
   */
  readLogFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line))
    } catch {
      return []
    }
  }

  /**
   * 获取日志文件列表
   * @private
   * @returns {Array} 文件路径数组
   */
  getLogFiles() {
    try {
      return fs
        .readdirSync(LOG_DIR)
        .filter((file) => file.startsWith('chat_') && file.endsWith('.jsonl'))
        .sort()
        .reverse()
        .map((file) => path.join(LOG_DIR, file))
    } catch {
      return []
    }
  }
}

module.exports = new LogsService()
