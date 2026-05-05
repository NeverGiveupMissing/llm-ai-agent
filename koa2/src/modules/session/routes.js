// 说明：会话路由 - 提供会话管理的 HTTP 接口

const Router = require('@koa/router')
const sessionController = require('./controller')

const router = new Router({ prefix: '/sessions' })

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: 获取会话列表
 *     tags: [Sessions]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', sessionController.listSessions)

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: 创建新会话
 *     tags: [Sessions]
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
 *     responses:
 *       200:
 *         description: 创建成功
 */
router.post('/', sessionController.createSession)

/**
 * @swagger
 * /sessions/{sessionId}/pin:
 *   post:
 *     summary: 置顶/取消置顶会话
 *     tags: [Sessions]
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
 *     summary: 获取会话分享信息
 *     tags: [Sessions]
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
 *     summary: 获取会话详情（包含消息列表）
 *     tags: [Sessions]
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
 *     summary: 更新会话
 *     tags: [Sessions]
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
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:sessionId', sessionController.updateSession)

/**
 * @swagger
 * /sessions/{sessionId}:
 *   delete:
 *     summary: 删除会话
 *     tags: [Sessions]
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
