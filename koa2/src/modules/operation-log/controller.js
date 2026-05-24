/**
 * 操作日志控制器
 * 位置：koa2/src/modules/operation-log/controller.js
 */

const operationLogService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { exportToExcel } = require('../../utils/excel-exporter')
const { ExportDTO } = require('../../utils/export-dto')

class OperationLogController {
  /**
   * 获取操作日志列表
   */
  getLogs = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.limit) || 20,
      username: ctx.query.username,
      module: ctx.query.module,
      action: ctx.query.action,
      // ✅ 下划线命名 start_time/end_time
      start_time: ctx.query.start_time,
      end_time: ctx.query.end_time,
      keyword: ctx.query.keyword,
    }

    const result = await operationLogService.getLogs(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(
      result.data,
      result.total,
      result.page,
      result.limit
    )
  })

  /**
   * 获取操作日志详情
   */
  getLogById = asyncHandler(async (ctx) => {
    const { id } = ctx.params

    const result = await operationLogService.getLogById(id)

    if (result) {
      ctx.success(result)
    } else {
      ctx.fail('日志不存在', 404)
    }
  })

  /**
   * 删除操作日志
   */
  deleteLog = asyncHandler(async (ctx) => {
    const { id } = ctx.params

    const result = await operationLogService.deleteLog(id)

    if (result) {
      ctx.success(null, '删除成功')
    } else {
      ctx.fail('日志不存在', 404)
    }
  })

  /**
   * 批量删除操作日志
   */
  batchDeleteLogs = asyncHandler(async (ctx) => {
    const { ids } = ctx.request.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.fail('请提供要删除的日志ID列表', 400)
      return
    }

    const result = await operationLogService.batchDeleteLogs(ids)
    ctx.success(null, `成功删除 ${result.length} 条日志`)
  })

  /**
   * 清空所有操作日志
   */
  clearAllLogs = asyncHandler(async (ctx) => {
    await operationLogService.clearAllLogs()
    ctx.success(null, '已清空所有日志')
  })

  /**
   * 获取统计数据
   */
  getStats = asyncHandler(async (ctx) => {
    // ✅ 下划线命名 start_time/end_time
    const { start_time, end_time } = ctx.query

    const result = await operationLogService.getStats(start_time, end_time)
    ctx.success(result)
  })

  /**
   * 导出操作日志数据为 Excel
   * GET /operation-logs/export
   * 支持过滤条件：username, module, action, start_time, end_time
   */
  exportOperationLogs = asyncHandler(async (ctx) => {
    const params = ctx.query
    
    // 调用 service 获取导出数据
    const data = await operationLogService.exportOperationLogs(params)
    
    // 使用通用导出函数
    await exportToExcel(ctx, {
      filename: ExportDTO.operationLog.filename,
      sheetName: ExportDTO.operationLog.sheetName,
      headers: ExportDTO.operationLog.headers,
      data,
    })
  })
}

module.exports = new OperationLogController()
