// 说明：用户路由 - 定义用户相关的 API 接口
// ✅ 已移除所有手动权限验证，统一由 app.js 全局中间件处理（authMiddleware + globalApiPermissionInterceptor）

const Router = require('@koa/router')
const userController = require('./controller')
const { loginRateLimit, registerRateLimit } = require('../../middlewares/rateLimit')
const { exportPermissionChecker } = require('../../middlewares/permission-checker')

const router = new Router({
  prefix: '/users',
})

/**
 * @swagger
 * tags:
 *   name: 用户管理
 *   description: 用户相关接口
 */

// ============================================
// ⚠️ 重要：具体路由必须放在动态路由之前
// ============================================

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags: [用户管理]
 *     summary: 用户注册（速率限制：每分钟最多3次）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_name, password]
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: 注册成功
 */
router.post('/register', registerRateLimit(), userController.register)

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [用户管理]
 *     summary: 用户登录（速率限制：每分钟最多5次）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_name, password]
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post('/login', loginRateLimit(), userController.login)

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [用户管理]
 *     summary: 获取当前用户信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/me', userController.getCurrentUser)

/**
 * @swagger
 * /users/me/change-password:
 *   post:
 *     tags: [用户管理]
 *     summary: 修改当前用户密码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [old_password, new_password]
 *             properties:
 *               old_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 修改成功
 */
router.post('/me/change-password', userController.changePassword)

/**
 * @swagger
 * /users/me:
 *   put:
 *     tags: [用户管理]
 *     summary: 更新当前用户信息
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nick_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/me', userController.updateCurrentUser)

// ============================================
// 动态路由必须放在最后
// ============================================

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [用户管理]
 *     summary: 获取用户列表
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
 *         name: phone
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
router.get('/', userController.listUsers)

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [用户管理]
 *     summary: 新增用户
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_name, password]
 *             properties:
 *               user_name:
 *                 type: string
 *               password:
 *                 type: string
 *               nick_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', userController.createUser)

/**
 * @swagger
 * /users/export:
 *   get:
 *     tags: [用户管理]
 *     summary: 导出用户数据
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
router.get(
  '/export',
  exportPermissionChecker(),
  userController.exportUsers.bind(userController),
)

/**
 * @swagger
 * /users/batch-delete:
 *   post:
 *     tags: [用户管理]
 *     summary: 批量删除用户
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post('/batch-delete', userController.batchDeleteUsers)

/**
 * @swagger
 * /users/{user_id}/status:
 *   put:
 *     tags: [用户管理]
 *     summary: 更新用户状态（启用/禁用）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['0', '1']
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:user_id/status', userController.updateUserStatus)

/**
 * @swagger
 * /users/{user_id}/roles:
 *   post:
 *     tags: [用户管理]
 *     summary: 为用户分配角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.post('/:user_id/roles', userController.assignRole)

/**
 * @swagger
 * /users/{user_id}/roles:
 *   put:
 *     tags: [用户管理]
 *     summary: 批量分配角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.put('/:user_id/roles', userController.assignRoles)

/**
 * @swagger
 * /users/{user_id}/roles/{role_id}:
 *   delete:
 *     tags: [用户管理]
 *     summary: 移除用户角色
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 移除成功
 */
router.delete('/:user_id/roles/:role_id', userController.removeRole)

/**
 * @swagger
 * /users/{user_id}/reset-password:
 *   post:
 *     tags: [用户管理]
 *     summary: 重置密码
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 重置成功
 */
router.post('/:user_id/reset-password', userController.resetPassword)

/**
 * @swagger
 * /users/{user_id}:
 *   get:
 *     tags: [用户管理]
 *     summary: 获取用户详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:user_id', userController.getUserDetail)

/**
 * @swagger
 * /users/{user_id}:
 *   put:
 *     tags: [用户管理]
 *     summary: 更新用户信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
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
router.put('/:user_id', userController.updateUser)

/**
 * @swagger
 * /users/{user_id}:
 *   delete:
 *     tags: [用户管理]
 *     summary: 删除用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:user_id', userController.deleteUser)

module.exports = router
