// 说明：角色路由 - 定义角色相关的 API 接口
// ✅ 已移除所有手动权限验证，统一由 app.js 全局中间件处理（authMiddleware + globalApiPermissionInterceptor）

const Router = require('@koa/router')
const roleController = require('./controller')

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
router.get('/', roleController.listRoles)

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
router.post('/', roleController.createRole)

/**
 * @swagger
 * /roles/export:
 *   get:
 *     tags: [角色管理]
 *     summary: 导出角色数据为 Excel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: role_key
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
  roleController.exportRoles.bind(roleController),
)

/**
 * @swagger
 * /roles/batch-delete:
 *   post:
 *     tags: [角色管理]
 *     summary: 批量删除角色（软删除）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_ids]
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post(
  '/batch-delete',
  roleController.batchDeleteRoles,
)

/**
 * @swagger
 * /roles/{role_id}/status:
 *   put:
 *     tags: [角色管理]
 *     summary: 更新角色状态（启用/禁用）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.put(
  '/:role_id/status',
  roleController.updateRoleStatus.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/permissions:
 *   post:
 *     tags: [角色管理]
 *     summary: 为角色分配权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.post(
  '/:role_id/permissions',
  roleController.assignPermission,
)

/**
 * @swagger
 * /roles/{role_id}/permissions/batch:
 *   post:
 *     tags: [角色管理]
 *     summary: 批量为角色分配权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.post(
  '/:role_id/permissions/batch',
  roleController.assignPermissions,
)

/**
 * @swagger
 * /roles/{role_id}/permissions/{permissionId}:
 *   delete:
 *     tags: [角色管理]
 *     summary: 移除角色权限
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.delete(
  '/:role_id/permissions/:permissionId',
  roleController.removePermission,
)

/**
 * @swagger
 * /roles/{role_id}/users:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色的所有用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.get(
  '/:role_id/users',
  roleController.getRoleUsers,
)

/**
 * @swagger
 * /roles/{role_id}:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/:role_id',
  roleController.getRoleDetail,
)

/**
 * @swagger
 * /roles/{role_id}:
 *   put:
 *     tags: [角色管理]
 *     summary: 更新角色信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
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
router.put(
  '/:role_id',
  roleController.updateRole,
)

/**
 * @swagger
 * /roles/{role_id}:
 *   delete:
 *     tags: [角色管理]
 *     summary: 删除角色（软删除）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete(
  '/:role_id',
  roleController.deleteRole,
)

/**
 * @swagger
 * /roles/batch-delete:
 *   post:
 *     tags: [角色管理]
 *     summary: 批量删除角色（软删除）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_ids]
 *             properties:
 *               role_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.post(
  '/batch-delete',
  roleController.batchDeleteRoles,
)

/**
 * @swagger
 * /roles/{role_id}/menu-ids:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色的菜单权限 ID 列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/:role_id/menu-ids',
  roleController.getRolemenu_ids.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/menus:
 *   put:
 *     tags: [角色管理]
 *     summary: 保存角色的菜单权限（覆盖更新）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menu_ids]
 *             properties:
 *               menu_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 保存成功
 */
router.put(
  '/:role_id/menus',
  roleController.saveRoleMenus.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/interface-ids:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色的接口权限 ID 列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/:role_id/interface-ids',
  roleController.getRoleApiPaths.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/interfaces:
 *   put:
 *     tags: [角色管理]
 *     summary: 保存角色的接口权限（覆盖更新）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [interface_ids]
 *             properties:
 *               interface_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 保存成功
 */
router.put(
  '/:role_id/interfaces',
  roleController.saveRoleApis.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/button-ids:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色的按钮权限 ID 列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/:role_id/button-ids',
  roleController.getRoleButtonIds.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/buttons:
 *   put:
 *     tags: [角色管理]
 *     summary: 保存角色的按钮权限（覆盖更新）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [button_ids]
 *             properties:
 *               button_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: 保存成功
 */
router.put(
  '/:role_id/buttons',
  roleController.saveRoleButtons.bind(roleController),
)

/**
 * @swagger
 * /roles/{role_id}/permissions:
 *   get:
 *     tags: [角色管理]
 *     summary: 获取角色的所有权限（聚合查询：菜单+按钮+接口）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menus:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 buttons:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 apis:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: 接口ID列表（从 sys_role_interface 表查询）
 */
router.get(
  '/:role_id/permissions',
  roleController.getRoleAllPermissions.bind(roleController),
)

module.exports = router
