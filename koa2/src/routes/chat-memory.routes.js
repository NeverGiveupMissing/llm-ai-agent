// 说明：对话记忆路由 - 提供记忆上下文获取和自动提取接口

const Router = require('@koa/router')
const ChatMemoryController = require('../controller/chat-memory.controller')

const router = new Router({ prefix: '/chat-memory' })

/**
 * @swagger
 * tags:
 *   name: Chat Memories
 *   description: 对话记忆管理接口
 */

/**
 * @swagger
 * /chat-memory/context:
 *   get:
 *     summary: 获取会话记忆上下文
 *     tags: [Chat Memories]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/context', ChatMemoryController.getSessionMemoryContext)

/**
 * @swagger
 * /chat-memory/extract:
 *   post:
 *     summary: 自动提取对话记忆
 *     tags: [Chat Memories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, userId, messages]
 *             properties:
 *               sessionId:
 *                 type: string
 *               userId:
 *                 type: string
 *               messages:
 *                 type: array
 *     responses:
 *       200:
 *         description: 提取成功
 */
router.post('/extract', ChatMemoryController.autoExtractMemories)

/**
 * @swagger
 * /chat-memory:
 *   get:
 *     summary: 获取会话记忆列表
 *     tags: [Chat Memories]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', ChatMemoryController.getSessionMemories)

/**
 * @swagger
 * /chat-memory/{sessionId}/clear:
 *   delete:
 *     summary: 清空会话记忆
 *     tags: [Chat Memories]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 清空成功
 */
router.delete('/:sessionId/clear', ChatMemoryController.clearMemories)

module.exports = router
