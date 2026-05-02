// 说明：会话控制器 - 处理会话的 HTTP 请求

const sessionService = require('./service')
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
    ctx.success(result.data)
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
    ctx.success(result.data, result.message)
  })

  /**
   * 更新会话
   */
  updateSession = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
    const updates = ctx.request.body

    if (!sessionId) {
      throw new BadRequestError('缺少 sessionId 参数')
    }

    const result = await sessionService.updateSession(sessionId, updates)
    ctx.success(result.data, result.message)
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
    ctx.success(result.data, result.message)
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
    ctx.success(result.data)
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
    ctx.success(result.data)
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
    ctx.success(null, result.message)
  })
}

module.exports = new SessionController()
