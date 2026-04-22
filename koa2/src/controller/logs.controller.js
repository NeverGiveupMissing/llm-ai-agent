const logsService = require('../services/logs.service')
const ResponseUtil = require('../utils/response')

class LogsController {
  /**
   * 获取日志列表
   */
  async getLogs(ctx) {
    const params = {
      date: ctx.query.date,
      limit: parseInt(ctx.query.limit) || 50,
      keyword: ctx.query.keyword,
      status: ctx.query.status,
    }

    const result = await logsService.getLogs(params)
    ctx.body = ResponseUtil.success({
      list: result.logs || [],
      total: result.count || 0,
    })
  }

  /**
   * 获取今日日志
   */
  async getTodayLogs(ctx) {
    const params = {
      limit: parseInt(ctx.query.limit) || 50,
      keyword: ctx.query.keyword,
      status: ctx.query.status,
      session_id: ctx.query.session_id,
    }

    const result = await logsService.getTodayLogs(params)
    ctx.body = ResponseUtil.success({
      list: result.logs || [],
      total: result.count || 0,
    })
  }

  /**
   * 通过 Trace ID 查询日志
   */
  async getTraceLog(ctx) {
    const traceId = ctx.params.trace_id
    const result = await logsService.getTraceLog(traceId)

    if (result.error) {
      ctx.body = ResponseUtil.error(null, result.error)
    } else {
      ctx.body = ResponseUtil.success(result)
    }
  }

  /**
   * 获取会话日志
   */
  async getSessionLogs(ctx) {
    const sessionId = ctx.params.session_id
    const limit = parseInt(ctx.query.limit) || 50
    const result = await logsService.getSessionLogs(sessionId, limit)
    ctx.body = ResponseUtil.success({
      list: result.logs || [],
      total: result.count || 0,
    })
  }

  /**
   * 获取可用日期列表
   */
  async getAvailableDates(ctx) {
    const result = await logsService.getAvailableDates()
    ctx.body = ResponseUtil.success(result)
  }

  /**
   * 获取统计信息
   */
  async getStats(ctx) {
    const date = ctx.query.date
    const result = await logsService.getStats(date)
    ctx.body = ResponseUtil.success(result)
  }
}

module.exports = new LogsController()
