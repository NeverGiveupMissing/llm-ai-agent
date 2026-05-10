const operationLogModel = require('./model')

class OperationLogService {
  /**
   * 记录操作日志
   */
  async logOperation(logData) {
    try {
      const result = await operationLogModel.create(logData)
      return { success: true, data: result }
    } catch (error) {
      console.error('记录操作日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取操作日志列表
   */
  async getLogs(params) {
    try {
      const result = await operationLogModel.getList(params)
      return { 
        data: result.list,
        total: result.total,
        page: params.page || 1,
        limit: params.limit || 20
      }
    } catch (error) {
      console.error('获取操作日志列表失败:', error)
      throw error
    }
  }

  /**
   * 获取操作日志详情
   */
  async getLogById(id) {
    try {
      const result = await operationLogModel.getById(id)
      if (!result) {
        return { success: false, error: '日志不存在' }
      }
      return { success: true, data: result }
    } catch (error) {
      console.error('获取操作日志详情失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 删除操作日志
   */
  async deleteLog(id) {
    try {
      const result = await operationLogModel.delete(id)
      if (!result) {
        return { success: false, error: '日志不存在' }
      }
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除操作日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 批量删除操作日志
   */
  async batchDeleteLogs(ids) {
    try {
      const result = await operationLogModel.batchDelete(ids)
      return { success: true, message: `成功删除 ${result.length} 条日志` }
    } catch (error) {
      console.error('批量删除操作日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 清空所有操作日志
   */
  async clearAllLogs() {
    try {
      await operationLogModel.clearAll()
      return { success: true, message: '已清空所有日志' }
    } catch (error) {
      console.error('清空操作日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取统计数据
   */
  async getStats(start_time, end_time) {
    try {
      const result = await operationLogModel.getStats(start_time, end_time)
      return { success: true, data: result }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new OperationLogService()
