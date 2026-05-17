// 说明：会话路由 - 提供会话管理的 HTTP 接口

const Router = require('@koa/router')
const sessionController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')

const router = new Router({ prefix: '/sessions' })

/**
 * @swagger
 * tags:
 *   name: 会话管理
 *   description: AI 对话会话管理接口
 */

// 所有会话接口都需要认证
router.use(authMiddleware())

/**
 * @swagger
 * /sessions:
 *   get:
 *     tags: [会话管理]
 *     summary: 获取会话列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page_num
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', sessionController.listSessions)

/**
 * @swagger
 * /sessions:
 *   post:
 *     tags: [会话管理]
 *     summary: 创建新会话
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *               title:
 *                 type: string
 *               group_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', sessionController.createSession)

/**
 * @swagger
 * /sessions/{sessionId}/pin:
 *   post:
 *     tags: [会话管理]
 *     summary: 置顶/取消置顶会话
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.post('/:sessionId/pin', sessionController.pinSession)

/**
 * @swagger
 * /sessions/{sessionId}/share:
 *   get:
 *     tags: [会话管理]
 *     summary: 获取会话分享信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:sessionId/share', sessionController.getShareInfo)

/**
 * @swagger
 * /sessions/{sessionId}/detail:
 *   get:
 *     tags: [会话管理]
 *     summary: 获取会话详情（包含消息列表）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:sessionId/detail', sessionController.getSessionDetail)

/**
 * @swagger
 * /sessions/{sessionId}:
 *   put:
 *     tags: [会话管理]
 *     summary: 更新会话
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message_count:
 *                 type: integer
 *               group_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:sessionId', sessionController.updateSession)

/**
 * @swagger
 * /sessions/{sessionId}:
 *   delete:
 *     tags: [会话管理]
 *     summary: 删除会话
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:sessionId', sessionController.deleteSession)

module.exports = router
