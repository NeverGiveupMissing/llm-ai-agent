// 说明：权限路由 - 定义权限相关的 API 接口
// 路径：koa2/src/modules/permission/routes.js

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
 * /permissions/tree:
 *   get:
 *     tags: [权限管理]
 *     summary: 获取权限树形结构
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/tree', authMiddleware(), requirePermission('permission:read'), permissionController.getPermissionTree.bind(permissionController))

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
router.get('/by-module', authMiddleware(), requirePermission('permission:read'), permissionController.getPermissionsByModule.bind(permissionController))

/**
 * @swagger
 * /permissions/menu-tree:
 *   get:
 *     tags: [权限管理]
 *     summary: 获取当前用户的菜单树
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/menu-tree', authMiddleware(), permissionController.getUserMenuTree.bind(permissionController))

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
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', authMiddleware(), requirePermission('permission:read'), permissionController.listPermissions.bind(permissionController))

/**
 * @swagger
 * /permissions:
 *   post:
 *     tags: [权限管理]
 *     summary: 创建权限
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [menu, button]
 *               parentId:
 *                 type: string
 *               path:
 *                 type: string
 *               icon:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', authMiddleware(), requirePermission('permission:create'), permissionController.createPermission.bind(permissionController))

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
router.get('/:permissionId', authMiddleware(), requirePermission('permission:read'), permissionController.getPermissionDetail.bind(permissionController))

/**
 * @swagger
 * /permissions/{permissionId}:
 *   put:
 *     tags: [权限管理]
 *     summary: 更新权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *               parentId:
 *                 type: string
 *               path:
 *                 type: string
 *               icon:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:permissionId', authMiddleware(), requirePermission('permission:update'), permissionController.updatePermission.bind(permissionController))

/**
 * @swagger
 * /permissions/{permissionId}:
 *   delete:
 *     tags: [权限管理]
 *     summary: 删除权限
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
 *         description: 删除成功
 */
router.delete('/:permissionId', authMiddleware(), requirePermission('permission:delete'), permissionController.deletePermission.bind(permissionController))

module.exports = router