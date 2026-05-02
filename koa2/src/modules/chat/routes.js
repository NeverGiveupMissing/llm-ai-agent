const Router = require('@koa/router')
const chatController = require('./controller')
const ChatMessageService = require('./message-service')
const ResponseUtil = require('../../utils/response')

const router = new Router({ prefix: '/chat' })

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags:
 *       - chat
 *     summary: 简单聊天接口
 *     description: 支持流式和非流式聊天
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *               stream:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', chatController.simpleChat.bind(chatController))

// ============================================
// 动态路由的具体路径（放在/messages/:sessionId之前）
// ============================================

/**
 * 获取会话的最新消息
 */
router.get('/messages/:sessionId/latest', async (ctx) => {
  try {
    const { sessionId } = ctx.params
    const { limit = 10 } = ctx.query

    const messages = await ChatMessageService.getLatestMessages(sessionId, parseInt(limit))

    ctx.success(messages, '获取最新消息成功')
  } catch (error) {
    console.error('❌ 获取最新消息失败:', error.message)
    ctx.fail(error.message)
  }
})

/**
 * 删除单条消息
 */
router.delete('/messages/:messageId', async (ctx) => {
  try {
    await chatController.deleteMessage(ctx)
  } catch (error) {
    console.error('❌ 删除消息失败:', error.message)
    ctx.fail(error.message)
  }
})

// ============================================
// 动态路由（作为兜底，放在最后）
// ============================================

/**
 * 获取会话的消息历史
 */
router.get('/messages/:sessionId', async (ctx) => {
  try {
    const { sessionId } = ctx.params
    const { limit = 100, offset = 0 } = ctx.query

    const messages = await ChatMessageService.getSessionMessages(
      sessionId,
      parseInt(limit),
      parseInt(offset)
    )

    ctx.success(messages, '获取消息历史成功')
  } catch (error) {
    console.error(' 获取消息历史失败:', error.message)
    ctx.fail(error.message)
  }
})

module.exports = router