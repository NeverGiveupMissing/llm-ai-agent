const loginLogModel = require('./model')

class LoginLogService {
  /**
   * 记录登录日志
   */
  async logLogin(logData) {
    try {
      const result = await loginLogModel.create(logData)
      return { success: true, data: result }
    } catch (error) {
      console.error('记录登录日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取登录日志列表
   */
  async getLogs(params) {
    try {
      const result = await loginLogModel.getList(params)
      return {
        data: result.list,
        total: result.total,
        page: params.page || 1,
        limit: params.limit || 20,
      }
    } catch (error) {
      console.error('获取登录日志列表失败:', error)
      throw error
    }
  }

  /**
   * 获取当前用户的登录日志
   */
  async getUserLoginLogs(user_id, page = 1, limit = 20) {
    try {
      const result = await loginLogModel.getByuser_id(user_id, page, limit)
      return {
        data: result.list,
        total: result.total,
        page,
        limit,
      }
    } catch (error) {
      console.error('获取用户登录日志失败:', error)
      throw error
    }
  }

  /**
   * 删除登录日志
   */
  async deleteLog(id) {
    try {
      const result = await loginLogModel.delete(id)
      if (!result) {
        return { success: false, error: '日志不存在' }
      }
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除登录日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 批量删除登录日志
   */
  async batchDeleteLogs(ids) {
    try {
      const result = await loginLogModel.batchDelete(ids)
      return { success: true, message: `成功删除 ${result.length} 条日志` }
    } catch (error) {
      console.error('批量删除登录日志失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 清空所有登录日志
   */
  async clearAllLogs() {
    try {
      await loginLogModel.clearAll()
      return { success: true, message: '已清空所有日志' }
    } catch (error) {
      console.error('清空登录日志失败:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new LoginLogService()
