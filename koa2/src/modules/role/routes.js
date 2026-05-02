// 说明：角色路由 - 定义角色相关的 API 接口

const Router = require('@koa/router')
const roleController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission, requireAnyPermission } = require('../../middlewares/checkPermission')

const router = new Router({
  prefix: '/roles',
})

/**
 * @swagger
 * tags:
 *   name: 角色管理
 *   description: 角色相关接口
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', authMiddleware(), requirePermission('role:read'), roleController.listRoles)

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [角色管理]
 *     summary: 创建角色
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               isSystem:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', authMiddleware(), requirePermission('role:create'), roleController.createRole)

/**
 * @swagger
 * /roles/{roleId}/status:
 *   put:
 *     tags: [角色管理]
 *     summary: 更新角色状态（启用/禁用）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:roleId/status', authMiddleware(), requirePermission('role:update'), roleController.updateRoleStatus.bind(roleController))

/**
 * @swagger
 * /roles/{roleId}/permissions:
 *   post:
 *     tags: [角色管理]
 *     summary: 为角色分配权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionId]
 *             properties:
 *               permissionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.post('/:roleId/permissions', authMiddleware(), requirePermission('role:update'), roleController.assignPermission)

/**
 * @swagger
 * /roles/{roleId}/permissions/batch:
 *   post:
 *     tags: [角色管理]
 *     summary: 批量为角色分配权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionIds]
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量分配成功
 */
router.post('/:roleId/permissions/batch', authMiddleware(), requirePermission('role:update'), roleController.assignPermissions)

/**
 * @swagger
 * /roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     tags: [角色管理]
 *     summary: 移除角色权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 移除成功
 */
router.delete('/:roleId/permissions/:permissionId', authMiddleware(), requirePermission('role:update'), roleController.removePermission)

/**
 * @swagger
 * /roles/{roleId}/users:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色的所有用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:roleId/users', authMiddleware(), requirePermission('role:read'), roleController.getRoleUsers)

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:roleId', authMiddleware(), requirePermission('role:read'), roleController.getRoleDetail)

/**
 * @swagger
 * /roles/{roleId}:
 *   put:
 *     tags: [角色管理]
 *     summary: 更新角色信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
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
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:roleId', authMiddleware(), requirePermission('role:update'), roleController.updateRole)

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     tags: [角色管理]
 *     summary: 删除角色（软删除）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:roleId', authMiddleware(), requirePermission('role:delete'), roleController.deleteRole)

module.exports = router
