const Router = require('@koa/router')
const chatController = require('./controller')

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

module.exports = router
