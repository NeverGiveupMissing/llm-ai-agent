/**
 * 会话分组路由
 */

const Router = require('@koa/router')
const SessionGroupController = require('./controller')

const router = new Router({
  prefix: '/session-groups',
})

/**
 * @swagger
 * tags:
 *   name: 会话分组管理
 *   description: AI 对话会话分组管理接口
 */

// ============================================
// 静态路由优先
// ============================================

/**
 * @swagger
 * /session-groups:
 *   get:
 *     tags: [会话分组管理]
 *     summary: 获取用户的所有分组
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
// 获取用户的所有分组
router.get('/', SessionGroupController.getGroups)

/**
 * @swagger
 * /session-groups:
 *   post:
 *     tags: [会话分组管理]
 *     summary: 创建分组
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [group_name]
 *             properties:
 *               group_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 创建成功
 */
// 创建分组
router.post('/', SessionGroupController.createGroup)

/**
 * @swagger
 * /session-groups/sessions/{sessionId}/move:
 *   post:
 *     tags: [会话分组管理]
 *     summary: 移动会话到分组
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
 *               group_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 移动成功
 */
// 移动会话到分组（这个路由没有参数前缀，应该优先）
router.post('/sessions/:sessionId/move', SessionGroupController.moveSessionToGroup)

// ============================================
// 动态路由的具体路径（放在/:id之前）
// ============================================

/**
 * @swagger
 * /session-groups/{id}/pin:
 *   post:
 *     tags: [会话分组管理]
 *     summary: 置顶/取消置顶分组
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 操作成功
 */
// 置顶/取消置顶分组
router.post('/:id/pin', SessionGroupController.pinGroup)

/**
 * @swagger
 * /session-groups/{sessionId}/move-to-group:
 *   post:
 *     tags: [会话分组管理]
 *     summary: 移动会话到分组（新路由）
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
 *               group_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: 移动成功
 */
// 移动会话到分组（新路由，保持兼容）
router.post('/:sessionId/move-to-group', SessionGroupController.moveSessionToGroup)

// ============================================
// 动态路由（作为兜底，放在最后）
// ============================================

/**
 * @swagger
 * /session-groups/{id}:
 *   put:
 *     tags: [会话分组管理]
 *     summary: 更新分组
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               group_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
// 更新分组
router.put('/:id', SessionGroupController.updateGroup)

/**
 * @swagger
 * /session-groups/{id}:
 *   delete:
 *     tags: [会话分组管理]
 *     summary: 删除分组
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
// 删除分组
router.delete('/:id', SessionGroupController.deleteGroup)

module.exports = router