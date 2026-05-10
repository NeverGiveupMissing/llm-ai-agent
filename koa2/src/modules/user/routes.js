// 说明：用户路由 - 定义用户相关的 API 接口

const Router = require('@koa/router')
const userController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')
const { loginRateLimit, registerRateLimit } = require('../../middlewares/rateLimit')

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
 * 获取当前用户信息（需要认证）
 * ⚠️ 必须放在 /:user_id 之前
 */
router.get('/me', authMiddleware(), userController.getCurrentUser)

/**
 * 修改当前用户密码（需要认证）
 * ️ 必须放在 /:user_id 之前
 */
router.post('/me/change-password', authMiddleware(), userController.changePassword)

/**
 * 更新当前用户信息（需要认证）
 * ⚠️ 必须放在 /:user_id 之前
 */
router.put('/me', authMiddleware(), userController.updateCurrentUser)

// ============================================
// 动态路由必须放在最后
// ============================================

/**
 * 获取用户列表（需要 user:read 权限）
 */
router.get('/', authMiddleware(), requirePermission('user:read'), userController.listUsers)

/**
 * 管理员新增用户（需要认证 + user:create 权限，不需要验证码）
 */
router.post('/', authMiddleware(), requirePermission('user:create'), userController.createUser)

/**
 * 批量删除用户（需要 user:delete 权限）
 * ⚠️ 必须放在 /:user_id 之前
 */
router.post(
  '/batch-delete',
  authMiddleware(),
  requirePermission('user:delete'),
  userController.batchDeleteUsers,
)

/**
 * 更新用户状态（启用/禁用）（需要 user:update 权限）
 * ⚠️ 必须放在 /:user_id 之前
 */
router.put(
  '/:user_id/status',
  authMiddleware(),
  requirePermission('user:update'),
  userController.updateUserStatus,
)

/**
 * 为用户分配角色（需要 user:update 权限）
 * ⚠️ 必须放在 /:user_id 之前
 */
router.post(
  '/:user_id/roles',
  authMiddleware(),
  requirePermission('user:update'),
  userController.assignRole,
)

/**
 * 批量分配角色（需要 user:update 权限）
 * ️ 必须放在 /:user_id 之前
 */
router.put(
  '/:user_id/roles',
  authMiddleware(),
  requirePermission('user:update'),
  userController.assignRoles,
)

/**
 * 移除用户角色（需要 user:update 权限）
 * ⚠️ 必须放在 /:user_id/:role_id 之前
 */
router.delete(
  '/:user_id/roles/:role_id',
  authMiddleware(),
  requirePermission('user:update'),
  userController.removeRole,
)

/**
 * 重置密码（需要 user:update 权限）
 * ⚠️ 必须放在 /:user_id 之前
 */
router.post(
  '/:user_id/reset-password',
  authMiddleware(),
  requirePermission('user:update'),
  userController.resetPassword,
)

/**
 * 获取用户详情（需要 user:read 权限）
 * ⚠️ 必须放在所有 /:user_id/* 路由之后，作为兜底
 */
router.get(
  '/:user_id',
  authMiddleware(),
  requirePermission('user:read'),
  userController.getUserDetail,
)

/**
 * 更新用户信息（需要 user:update 权限）
 * ⚠️ 必须放在所有 /:user_id/* 路由之后，作为兜底
 */
router.put(
  '/:user_id',
  authMiddleware(),
  requirePermission('user:update'),
  userController.updateUser,
)

/**
 * 删除用户（需要 user:delete 权限）
 * ️ 必须放在所有 /:user_id/* 路由之后，作为兜底
 */
router.delete(
  '/:user_id',
  authMiddleware(),
  requirePermission('user:delete'),
  userController.deleteUser,
)

module.exports = router
