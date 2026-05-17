/**
 * 按钮路由配置
 * @description 管理 sys_button 表中的按钮权限数据，提供 RESTful API 路由
 * @author System
 * @date 2026-05-13
 * ✅ 已移除所有手动权限验证，统一由全局接口权限拦截器处理
 */

const Router = require('@koa/router')
const buttonController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')

const router = new Router({ prefix: '/buttons' })

/**
 * @swagger
 * tags:
 *   name: 按钮管理
 *   description: 按钮权限管理接口
 */

// ✅ 全局认证中间件（必须在所有路由之前）
router.use(authMiddleware())

// ✅ 具体路由必须在动态路由之前定义（Koa Router 按顺序匹配）

/**
 * @swagger
 * /buttons/menu/{menu_id}:
 *   get:
 *     tags: [按钮管理]
 *     summary: 根据菜单ID获取所有按钮
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menu_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
// 根据菜单ID获取所有按钮（具体路径，必须在 /:button_id 之前）
router.get('/menu/:menu_id', buttonController.getButtonsByMenuId)

/**
 * @swagger
 * /buttons/batch-delete:
 *   post:
 *     tags: [按钮管理]
 *     summary: 批量删除按钮
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               button_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
// 批量删除按钮（具体路径，必须在 /:button_id 之前）
router.post('/batch-delete', buttonController.batchDeleteButtons)

/**
 * @swagger
 * /buttons:
 *   get:
 *     tags: [按钮管理]
 *     summary: 获取按钮列表（分页）
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
 *         name: button_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
// 获取按钮列表
router.get('/', buttonController.listButtons)

/**
 * @swagger
 * /buttons/{button_id}:
 *   get:
 *     tags: [按钮管理]
 *     summary: 获取按钮详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: button_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
// 获取按钮详情（动态路径）
router.get('/:button_id', buttonController.getButtonDetail)

/**
 * @swagger
 * /buttons:
 *   post:
 *     tags: [按钮管理]
 *     summary: 创建按钮
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [button_name, parent_id]
 *             properties:
 *               button_name:
 *                 type: string
 *               parent_id:
 *                 type: integer
 *               perms:
 *                 type: string
 *               show_location:
 *                 type: string
 *               order_num:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
// 创建按钮
router.post('/', buttonController.createButton)

/**
 * @swagger
 * /buttons/{button_id}:
 *   put:
 *     tags: [按钮管理]
 *     summary: 更新按钮
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: button_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 更新成功
 */
// 更新按钮（动态路径）
router.put('/:button_id', buttonController.updateButton)

/**
 * @swagger
 * /buttons/{button_id}:
 *   delete:
 *     tags: [按钮管理]
 *     summary: 删除按钮
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: button_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
// 删除按钮（动态路径）
router.delete('/:button_id', buttonController.deleteButton)

module.exports = router
