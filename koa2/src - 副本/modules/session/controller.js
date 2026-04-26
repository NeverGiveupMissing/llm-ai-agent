// 说明：会话控制器 - 处理会话的 HTTP 请求

const sessionService = require('./service')
const ResponseUtil = require('../../utils/response')

class SessionController {
  /**
   * 获取会话列表
   */
  async listSessions(ctx) {
    try {
      const { userId } = ctx.query
      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 参数')
        return
      }

      const result = await sessionService.listSessions(userId)
      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取会话列表失败')
    }
  }

  /**
   * 创建新会话
   */
  async createSession(ctx) {
    try {
      const { userId, title } = ctx.request.body
      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 参数')
        return
      }

      const result = await sessionService.createSession(userId, title)
      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '创建会话失败')
    }
  }

  /**
   * 更新会话
   */
  async updateSession(ctx) {
    console.log('🔵 [Controller] 收到更新会话请求')
    console.log('🔵 [Controller] sessionId:', ctx.params.sessionId)
    console.log('🔵 [Controller] request.body:', ctx.request.body)

    try {
      const { sessionId } = ctx.params
      const updates = ctx.request.body

      console.log('🔵 [Controller] 解析后的参数:', { sessionId, updates })

      if (!sessionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 sessionId 参数')
        return
      }

      console.log('🔵 [Controller] 调用 service.updateSession...')
      const result = await sessionService.updateSession(sessionId, updates)
      console.log('🔵 [Controller] service 返回:', result)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data, result.message)
      console.log('🔵 [Controller] 响应发送成功')
    } catch (err) {
      console.error('❌ [Controller] 更新会话失败:', err)
      console.error('❌ [Controller] 错误堆栈:', err.stack)
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '更新会话失败')
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(ctx) {
    try {
      const { sessionId } = ctx.params
      if (!sessionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 sessionId 参数')
        return
      }

      const result = await sessionService.deleteSession(sessionId)
      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '删除会话失败')
    }
  }
}

module.exports = new SessionController()
