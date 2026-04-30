// 说明：用户路由 - 定义用户相关的 API 接口

const Router = require('@koa/router')
const userController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')

const router = new Router({
  prefix: '/users',
})

/**
 * @swagger
 * tags:
 *   name: 用户管理
 *   description: 用户相关接口
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags: [用户管理]
 *     summary: 用户注册
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
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
router.post('/register', userController.register)

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [用户管理]
 *     summary: 用户登录
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
router.post('/login', userController.login)

// 需要认证的接口
router.get('/me', authMiddleware(), userController.getCurrentUser)

// 需要 user:read 权限的接口
router.get('/', authMiddleware(), requirePermission('user:read'), userController.listUsers)

// 需要 user:read 权限的接口
router.get('/:userId', authMiddleware(), requirePermission('user:read'), userController.getUserDetail)

// 需要 user:update 权限的接口
router.put('/:userId', authMiddleware(), requirePermission('user:update'), userController.updateUser)

// 需要 user:delete 权限的接口
router.delete('/:userId', authMiddleware(), requirePermission('user:delete'), userController.deleteUser)

// 需要 user:update 权限的接口
router.post('/:userId/roles', authMiddleware(), requirePermission('user:update'), userController.assignRole)

// 需要 user:update 权限的接口
router.delete('/:userId/roles/:roleId', authMiddleware(), requirePermission('user:update'), userController.removeRole)

module.exports = router
