// 说明：权限路由 - 基于若依菜单权限体系
// 路径：koa2/src/modules/permission/routes.js
// ✅ 已废弃旧的 permissions 表相关路由，仅保留权限验证接口

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
 *   description: 权限验证相关接口（基于若依菜单权限体系）
 */



/**
 * @swagger
 * /permissions/my-permissions:
 *   get:
 *     tags: [权限管理]
 *     summary: 获取当前用户的所有权限
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/my-permissions', authMiddleware(), permissionController.getUserPermissions.bind(permissionController))

/**
 * @swagger
 * /permissions/check:
 *   post:
 *     tags: [权限管理]
 *     summary: 检查用户权限
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionCode]
 *             properties:
 *               permissionCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: 检查完成
 */
router.post('/check', authMiddleware(), permissionController.checkPermission.bind(permissionController))



module.exports = router