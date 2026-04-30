// 说明：会话控制器 - 处理会话的 HTTP 请求

const sessionService = require('./service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class SessionController {
  /**
   * 获取会话列表
   */
  listSessions = asyncHandler(async (ctx) => {
    const { userId } = ctx.query
    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    const result = await sessionService.listSessions(userId)
    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 创建新会话
   */
  createSession = asyncHandler(async (ctx) => {
    const { userId, title } = ctx.request.body
    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    const result = await sessionService.createSession(userId, title)
    ctx.body = ResponseUtil.success(result.data, result.message)
  })

  /**
   * 更新会话
   */
  updateSession = asyncHandler(async (ctx) => {
    console.log('🔵 [Controller] 收到更新会话请求')
    console.log('🔵 [Controller] sessionId:', ctx.params.sessionId)
    console.log('🔵 [Controller] request.body:', ctx.request.body)

    const { sessionId } = ctx.params
    const updates = ctx.request.body

    console.log('🔵 [Controller] 解析后的参数:', { sessionId, updates })

    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }

    console.log('🔵 [Controller] 调用 service.updateSession...')
    const result = await sessionService.updateSession(sessionId, updates)
    console.log('🔵 [Controller] service 返回:', result)

    ctx.body = ResponseUtil.success(result.data, result.message)
    console.log('🔵 [Controller] 响应发送成功')
  })

  /**
   * 置顶/取消置顶会话
   */
  pinSession = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }

    const result = await sessionService.pinSession(sessionId)
    ctx.body = ResponseUtil.success(result.data, result.message)
  })

  /**
   * 获取会话分享信息
   */
  getShareInfo = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }

    const result = await sessionService.getShareInfo(sessionId)
    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 获取会话详情（包含消息列表）
   */
  getSessionDetail = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }

    const result = await sessionService.getSessionDetail(sessionId)
    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 删除会话
   */
  deleteSession = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }

    const result = await sessionService.deleteSession(sessionId)
    ctx.body = ResponseUtil.success(null, result.message)
  })
}

module.exports = new SessionController()
