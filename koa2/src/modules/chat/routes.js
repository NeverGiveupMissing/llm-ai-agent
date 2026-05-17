const Router = require('@koa/router')
const chatController = require('./controller')
const ChatMessageService = require('./message-service')
const ResponseUtil = require('../../utils/response')

const router = new Router({ prefix: '/chat' })

/**
 * @swagger
 * tags:
 *   name: 聊天管理
 *   description: AI 聊天对话管理接口
 */

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
 * @swagger
 * /chat/messages/{sessionId}/latest:
 *   get:
 *     tags: [聊天管理]
 *     summary: 获取会话的最新消息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 获取成功
 */
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
 * @swagger
 * /chat/messages/{messageId}:
 *   delete:
 *     tags: [聊天管理]
 *     summary: 删除单条消息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
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
 * @swagger
 * /chat/messages/{sessionId}:
 *   get:
 *     tags: [聊天管理]
 *     summary: 获取会话的消息历史
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 获取成功
 */
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