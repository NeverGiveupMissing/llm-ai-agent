const loginLogService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { NotFoundError } = require('../../utils/app-error')

class LoginLogController {
  /**
   * 获取当前用户的登录日志
   */
  getMyLoginLogs = asyncHandler(async (ctx) => {
    const user_id = ctx.state.user_id
    const page = parseInt(ctx.query.page) || 1
    const limit = parseInt(ctx.query.limit) || 20

    const result = await loginLogService.getUserLoginLogs(user_id, page, limit)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page, result.limit)
  })

  /**
   * 获取所有登录日志（管理员）
   */
  getAllLoginLogs = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.limit) || 20,
      username: ctx.query.username,
      status: ctx.query.status,
      startDate: ctx.query.startDate,
      endDate: ctx.query.endDate,
      keyword: ctx.query.keyword,
    }

    const result = await loginLogService.getLogs(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page, result.limit)
  })

  /**
   * 删除登录日志
   */
  deleteLog = asyncHandler(async (ctx) => {
    const { id } = ctx.params

    const result = await loginLogService.deleteLog(id)

    if (result.success) {
      ctx.success(null, result.message)
    } else {
      throw new NotFoundError(result.error)
    }
  })

  /**
   * 批量删除登录日志
   */
  batchDeleteLogs = asyncHandler(async (ctx) => {
    const { ids } = ctx.request.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('参数错误：ids 不能为空')
    }

    const result = await loginLogService.batchDeleteLogs(ids)

    if (result.success) {
      ctx.success(null, result.message)
    } else {
      throw new Error(result.error)
    }
  })

  /**
   * 清空所有登录日志
   */
  clearAllLogs = asyncHandler(async (ctx) => {
    const result = await loginLogService.clearAllLogs()

    if (result.success) {
      ctx.success(null, result.message)
    } else {
      throw new Error(result.error)
    }
  })
}

module.exports = new LoginLogController()
