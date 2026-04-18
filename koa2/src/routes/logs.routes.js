const Router = require('@koa/router')
const logsController = require('../controller/logs.controller')

const router = new Router({ prefix: '/logs' })

/**
 * @swagger
 * /logs:
 *   get:
 *     tags:
 *       - logs
 *     summary: 获取日志列表
 *     description: 获取聊天日志列表，默认返回所有日期的日志
 *     parameters:
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *         description: 指定日期 (YYYY-MM-DD)
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回条数 (1-1000)
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [success, error]
 *         description: 状态筛选
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/', logsController.getLogs.bind(logsController))

/**
 * @swagger
 * /logs/today:
 *   get:
 *     tags:
 *       - logs
 *     summary: 获取今日日志
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: keyword
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: session_id
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/today', logsController.getTodayLogs.bind(logsController))

/**
 * @swagger
 * /logs/trace/{trace_id}:
 *   get:
 *     tags:
 *       - logs
 *     summary: 通过 Trace ID 查询日志
 *     parameters:
 *       - name: trace_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/trace/:trace_id', logsController.getTraceLog.bind(logsController))

/**
 * @swagger
 * /logs/session/{session_id}:
 *   get:
 *     tags:
 *       - logs
 *     summary: 获取会话日志
 *     parameters:
 *       - name: session_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/session/:session_id', logsController.getSessionLogs.bind(logsController))

/**
 * @swagger
 * /logs/dates:
 *   get:
 *     tags:
 *       - logs
 *     summary: 获取可用日期列表
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/dates', logsController.getAvailableDates.bind(logsController))

/**
 * @swagger
 * /logs/stats:
 *   get:
 *     tags:
 *       - logs
 *     summary: 获取统计信息
 *     parameters:
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/stats', logsController.getStats.bind(logsController))

module.exports = router
