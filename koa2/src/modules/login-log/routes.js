const Router = require('@koa/router')
const loginLogController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')

const router = new Router({
  prefix: '/login-logs',
})

/**
 * @swagger
 * tags:
 *   name: 登录日志
 *   description: 登录日志管理接口
 */

/**
 * @swagger
 * /login-logs/my:
 *   get:
 *     tags: [登录日志]
 *     summary: 获取当前用户的登录日志
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
router.get('/my', authMiddleware(), loginLogController.getMyLoginLogs)

/**
 * @swagger
 * /login-logs:
 *   get:
 *     tags: [登录日志]
 *     summary: 获取所有登录日志
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page_num
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: user_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/',
  authMiddleware(),
  loginLogController.getAllLoginLogs
)

/**
 * @swagger
 * /login-logs/{id}:
 *   delete:
 *     tags: [登录日志]
 *     summary: 删除登录日志
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete(
  '/:id',
  authMiddleware(),
  loginLogController.deleteLog
)

/**
 * @swagger
 * /login-logs/batch-delete:
 *   post:
 *     tags: [登录日志]
 *     summary: 批量删除登录日志
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               log_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post(
  '/batch-delete',
  authMiddleware(),
  loginLogController.batchDeleteLogs
)

/**
 * @swagger
 * /login-logs/clear-all:
 *   post:
 *     tags: [登录日志]
 *     summary: 清空所有登录日志
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 清空成功
 */
router.post(
  '/clear-all',
  authMiddleware(),
  loginLogController.clearAllLogs
)

module.exports = router
