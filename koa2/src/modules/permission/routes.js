// 说明：权限路由 - 定义权限相关的 API 接口

const Router = require('@koa/router')
const permissionController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')

const router = new Router({
  prefix: '/permissions',
})

/**
 * @swagger
 * tags:
 *   name: 权限管理
 *   description: 权限相关接口
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     tags: [权限管理]
 *     summary: 获取权限列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', authMiddleware(), requirePermission('permission:read'), permissionController.listPermissions)

/**
 * @swagger
 * /permissions/by-module:
 *   get:
 *     tags: [权限管理]
 *     summary: 按模块分组获取权限
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/by-module', authMiddleware(), requirePermission('permission:read'), permissionController.getPermissionsByModule)

/**
 * @swagger
 * /permissions/{permissionId}:
 *   get:
 *     tags: [权限管理]
 *     summary: 获取权限详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:permissionId', authMiddleware(), requirePermission('permission:read'), permissionController.getPermissionDetail)

/**
 * @swagger
 * /permissions/user/{userId}:
 *   get:
 *     tags: [权限管理]
 *     summary: 获取用户的所有权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/user/:userId', authMiddleware(), requirePermission('permission:read'), permissionController.getUserPermissions)

/**
 * @swagger
 * /permissions/check/{userId}/{permissionCode}:
 *   get:
 *     tags: [权限管理]
 *     summary: 检查用户权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 检查成功
 */
router.get('/check/:userId/:permissionCode', authMiddleware(), requirePermission('permission:read'), permissionController.checkPermission)

/**
 * @swagger
 * /permissions/check-any/{userId}:
 *   post:
 *     tags: [权限管理]
 *     summary: 检查用户是否拥有任一权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionCodes]
 *             properties:
 *               permissionCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 检查成功
 */
router.post('/check-any/:userId', authMiddleware(), requirePermission('permission:read'), permissionController.checkAnyPermission)

/**
 * @swagger
 * /permissions/check-all/{userId}:
 *   post:
 *     tags: [权限管理]
 *     summary: 检查用户是否拥有所有权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionCodes]
 *             properties:
 *               permissionCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 检查成功
 */
router.post('/check-all/:userId', authMiddleware(), requirePermission('permission:read'), permissionController.checkAllPermissions)

module.exports = router
