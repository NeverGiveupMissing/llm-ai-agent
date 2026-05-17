// 说明：接口路由 - 定义接口相关的 API 接口
// ✅ 已移除所有手动权限验证，统一由全局接口权限拦截器处理

const Router = require('@koa/router')
const router = new Router({ prefix: '/interfaces' })

const controller = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: 接口管理
 *   description: 系统接口管理接口
 */

// 应用认证中间件
router.use(authMiddleware())

/**
 * @swagger
 * /interfaces/all:
 *   get:
 *     tags: [接口管理]
 *     summary: 获取所有接口（不分页）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
// 获取所有接口
router.get('/all', controller.all)

/**
 * @swagger
 * /interfaces/export:
 *   get:
 *     tags: [接口管理]
 *     summary: 导出接口数据为 Excel
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 导出成功
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
// 导出接口数据为 Excel
router.get(
  '/export',
  authMiddleware(),
  controller.exportInterfaces.bind(controller),
)

/**
 * @swagger
 * /interfaces:
 *   get:
 *     tags: [接口管理]
 *     summary: 获取接口列表（分页）
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
 *         name: interface_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: interface_method
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
// 获取接口列表（分页）
router.get('/', controller.list)

/**
 * @swagger
 * /interfaces/{id}:
 *   get:
 *     tags: [接口管理]
 *     summary: 获取接口详情
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
// ❌ 动态路由必须放在最后
// 获取接口详情
router.get('/:id', controller.detail)

/**
 * @swagger
 * /interfaces:
 *   post:
 *     tags: [接口管理]
 *     summary: 创建接口
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [interface_name, interface_url, interface_method]
 *             properties:
 *               interface_name:
 *                 type: string
 *               interface_url:
 *                 type: string
 *               interface_method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE, PATCH]
 *               interface_category:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
// 创建接口
router.post('/', controller.create)

/**
 * @swagger
 * /interfaces/{id}:
 *   put:
 *     tags: [接口管理]
 *     summary: 更新接口
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
// 更新接口
router.put('/:id', controller.update)

/**
 * @swagger
 * /interfaces/{id}:
 *   delete:
 *     tags: [接口管理]
 *     summary: 删除接口
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
// 删除接口
router.delete('/:id', controller.delete)

module.exports = router
