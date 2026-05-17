const Router = require('@koa/router')
const operationLogController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')

const router = new Router({
  prefix: '/operation-logs',
})

/**
 * @swagger
 * tags:
 *   name: 操作日志
 *   description: 操作日志管理接口
 */

// ============================================
// 静态路由优先
// ============================================

/**
 * @swagger
 * /operation-logs:
 *   get:
 *     tags: [操作日志]
 *     summary: 获取操作日志列表
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
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: oper_name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', authMiddleware(), operationLogController.getLogs)

/**
 * @swagger
 * /operation-logs/stats:
 *   get:
 *     tags: [操作日志]
 *     summary: 获取统计数据
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/stats', authMiddleware(), operationLogController.getStats)

/**
 * @swagger
 * /operation-logs/batch-delete:
 *   post:
 *     tags: [操作日志]
 *     summary: 批量删除操作日志
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
router.post('/batch-delete', authMiddleware(), operationLogController.batchDeleteLogs)

/**
 * @swagger
 * /operation-logs/clear-all:
 *   post:
 *     tags: [操作日志]
 *     summary: 清空所有操作日志
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 清空成功
 */
router.post('/clear-all', authMiddleware(), operationLogController.clearAllLogs)

// ============================================
// 动态路由（作为兜底，放在最后）
// ============================================

/**
 * @swagger
 * /operation-logs/{id}:
 *   get:
 *     tags: [操作日志]
 *     summary: 获取操作日志详情
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
 *         description: 获取成功
 */
router.get('/:id', authMiddleware(), operationLogController.getLogById)

/**
 * @swagger
 * /operation-logs/{id}:
 *   delete:
 *     tags: [操作日志]
 *     summary: 删除操作日志
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
router.delete('/:id', authMiddleware(), operationLogController.deleteLog)

module.exports = router