const Router = require('@koa/router')
const memoryController = require('./controller')

const router = new Router({ prefix: '/memory' })

/**
 * @swagger
 * /memory/create:
 *   post:
 *     summary: 创建记忆
 *     description: 手动创建一条用户记忆，系统会自动生成向量嵌入
 *     tags: [记忆管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - content
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 用户唯一标识
 *                 example: "user_123"
 *               content:
 *                 type: string
 *                 description: 记忆内容（不超过2000字符）
 *                 example: "我喜欢Python编程"
 *               memoryType:
 *                 type: string
 *                 enum: [fact, preference, goal, event, opinion]
 *                 description: 记忆类型
 *                 example: "preference"
 *               importance:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: 重要性评分（1-10）
 *                 example: 8
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 记忆标签
 *                 example: ["tech", "hobby"]
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: 创建的记忆对象
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/create', memoryController.createMemory)

/**
 * @swagger
 * /memory/retrieve:
 *   post:
 *     summary: 检索相关记忆
 *     description: 根据查询内容，通过向量相似度搜索检索最相关的记忆
 *     tags: [记忆管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - query
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 用户唯一标识
 *                 example: "user_123"
 *               query:
 *                 type: string
 *                 description: 查询内容（用于语义搜索）
 *                 example: "我喜欢什么编程语言"
 *               limit:
 *                 type: integer
 *                 description: 返回结果数量（默认5）
 *                 example: 3
 *     responses:
 *       200:
 *         description: 检索成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       similarity:
 *                         type: number
 *                         description: 相似度分数（0-1）
 *                       memoryType:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       importance:
 *                         type: integer
 *                 count:
 *                   type: integer
 *                   description: 返回的记忆数量
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/retrieve', memoryController.retrieveMemories)

/**
 * @swagger
 * /memory/extract:
 *   post:
 *     summary: 从对话中提取记忆
 *     description: 使用AI自动分析对话内容，提取有价值的长期记忆
 *     tags: [记忆管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - messages
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 用户唯一标识
 *                 example: "user_123"
 *               messages:
 *                 type: array
 *                 description: 对话消息数组
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                       example: "user"
 *                     content:
 *                       type: string
 *                       example: "我是一名软件工程师，喜欢用Vue开发"
 *     responses:
 *       200:
 *         description: 提取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: 提取并创建的记忆列表
 *                 count:
 *                   type: integer
 *                   description: 提取的记忆数量
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/extract', memoryController.extractMemories)

/**
 * @swagger
 * /memory/list:
 *   get:
 *     summary: 获取用户记忆列表
 *     description: 分页获取用户的所有记忆
 *     tags: [记忆管理]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户唯一标识
 *         example: "user_123"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 偏移量
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       memoryType:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       importance:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/list', memoryController.getMemories)

/**
 * @swagger
 * /memory/stats:
 *   get:
 *     summary: 获取记忆统计信息
 *     description: 获取用户记忆的统计信息（总数、各类型数量、平均重要性）
 *     tags: [记忆管理]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户唯一标识
 *         example: "user_123"
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: 记忆总数
 *                     facts:
 *                       type: integer
 *                       description: 事实类记忆数量
 *                     preferences:
 *                       type: integer
 *                       description: 偏好类记忆数量
 *                     goals:
 *                       type: integer
 *                       description: 目标类记忆数量
 *                     events:
 *                       type: integer
 *                       description: 事件类记忆数量
 *                     avg_importance:
 *                       type: number
 *                       description: 平均重要性
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/stats', memoryController.getMemoryStats)

/**
 * @swagger
 * /memory/{id}:
 *   put:
 *     summary: 更新记忆
 *     description: 更新指定记忆的内容、重要性、标签等信息
 *     tags: [记忆管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 记忆ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 更新后的记忆内容
 *               importance:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: 更新重要性评分
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 更新标签
 *               metadata:
 *                 type: object
 *                 description: 更新元数据
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: 更新后的记忆对象
 *       404:
 *         description: 记忆不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', memoryController.updateMemory)

/**
 * @swagger
 * /memory/{id}:
 *   delete:
 *     summary: 删除记忆
 *     description: 软删除指定记忆（标记为 inactive）
 *     tags: [记忆管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 记忆ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: 记忆不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', memoryController.deleteMemory)

/**
 * @swagger
 * /memory/clear:
 *   post:
 *     summary: 清空用户所有记忆
 *     description: 删除指定用户的所有记忆（硬删除）
 *     tags: [记忆管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: 用户唯一标识
 *                 example: "user_123"
 *     responses:
 *       200:
 *         description: 清空成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "已清除 15 条记忆"
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/clear', memoryController.clearMemories)

module.exports = router
