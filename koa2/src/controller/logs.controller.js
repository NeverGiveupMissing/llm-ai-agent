const logsService = require('../services/logs.service')

/**
 * 日志控制器
 */
class LogsController {
  /**
   * 获取日志列表
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async getLogs(ctx) {
    const params = {
      date: ctx.query.date,
      limit: parseInt(ctx.query.limit) || 50,
      keyword: ctx.query.keyword,
      status: ctx.query.status,
    }

    const result = await logsService.getLogs(params)
    ctx.body = result
  }

  /**
   * 获取今日日志
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async getTodayLogs(ctx) {
    const params = {
      limit: parseInt(ctx.query.limit) || 50,
      keyword: ctx.query.keyword,
      status: ctx.query.status,
      session_id: ctx.query.session_id,
    }

    const result = await logsService.getTodayLogs(params)
    ctx.body = result
  }

  /**
   * 通过 Trace ID 查询日志
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async getTraceLog(ctx) {
    const traceId = ctx.params.trace_id
    const result = await logsService.getTraceLog(traceId)
    ctx.body = result
  }

  /**
   * 获取会话日志
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async getSessionLogs(ctx) {
    const sessionId = ctx.params.session_id
    const limit = parseInt(ctx.query.limit) || 50
    const result = await logsService.getSessionLogs(sessionId, limit)
    ctx.body = result
  }

  /**
   * 获取可用日期列表
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async getAvailableDates(ctx) {
    const result = await logsService.getAvailableDates()
    ctx.body = result
  }

  /**
   * 获取统计信息
   * @param {import('koa').Context} ctx - Koa 上下文
   */
  async getStats(ctx) {
    const date = ctx.query.date
    const result = await logsService.getStats(date)
    ctx.body = result
  }
}

module.exports = new LogsController()
