/**
 * 菜单路由 - 定义 RESTful API 接口
 */

const Router = require('@koa/router')
const menuController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')

const router = new Router({
  prefix: '/menus',
})

/**
 * @swagger
 * tags:
 *   name: 菜单管理
 *   description: 菜单相关接口
 */

/**
 * @swagger
 * /menus/tree:
 *   get:
 *     tags: [菜单管理]
 *     summary: 获取菜单树（用于前端动态路由）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/tree', authMiddleware(), menuController.getUserMenus)

/**
 * @swagger
 * /menus:
 *   get:
 *     tags: [菜单管理]
 *     summary: 获取菜单列表（树形结构，支持筛选）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: menuName
 *         schema:
 *           type: string
 *         description: 菜单名称（模糊搜索）
 *       - in: query
 *         name: visible
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *         description: 是否显示（0显示 1隐藏）
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *         description: 状态（0正常 1停用）
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', authMiddleware(), requirePermission('system:menu:list'), menuController.listMenus)

/**
 * @swagger
 * /menus:
 *   post:
 *     tags: [菜单管理]
 *     summary: 创建菜单
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menuName]
 *             properties:
 *               menuName:
 *                 type: string
 *                 description: 菜单名称
 *               parentId:
 *                 type: integer
 *                 description: 父菜单ID
 *               orderNum:
 *                 type: integer
 *                 description: 显示顺序
 *               path:
 *                 type: string
 *                 description: 路由地址
 *               component:
 *                 type: string
 *                 description: 组件路径
 *               routeName:
 *                 type: string
 *                 description: 路由名称
 *               isFrame:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 是否为外链（0是 1否）
 *               isCache:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 是否缓存（0缓存 1不缓存）
 *               menuType:
 *                 type: string
 *                 enum: ['M', 'C', 'F']
 *                 description: 菜单类型（M目录 C菜单 F按钮）
 *               visible:
 *                 type: string
 *                 enum: ['0', '1']
 *                 description: 是否显示（0显示 1隐藏）
 *               status:
 *                 type: string
 *                 enum: ['0', '1']
 *                 description: 状态（0正常 1停用）
 *               perms:
 *                 type: string
 *                 description: 权限标识
 *               icon:
 *                 type: string
 *                 description: 菜单图标
 *               remark:
 *                 type: string
 *                 description: 备注
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', authMiddleware(), requirePermission('system:menu:add'), menuController.createMenu)

/**
 * @swagger
 * /menus/{menuId}:
 *   get:
 *     tags: [菜单管理]
 *     summary: 获取菜单详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/:menuId', authMiddleware(), requirePermission('system:menu:query'), menuController.getMenuDetail.bind(menuController))

/**
 * @swagger
 * /menus/{menuId}:
 *   put:
 *     tags: [菜单管理]
 *     summary: 更新菜单
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
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
 *               menuName:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               orderNum:
 *                 type: integer
 *               path:
 *                 type: string
 *               component:
 *                 type: string
 *               routeName:
 *                 type: string
 *               isFrame:
 *                 type: integer
 *               isCache:
 *                 type: integer
 *               menuType:
 *                 type: string
 *               visible:
 *                 type: string
 *               status:
 *                 type: string
 *               perms:
 *                 type: string
 *               icon:
 *                 type: string
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put('/:menuId', authMiddleware(), requirePermission('system:menu:edit'), menuController.updateMenu.bind(menuController))

/**
 * @swagger
 * /menus/{menuId}:
 *   delete:
 *     tags: [菜单管理]
 *     summary: 删除菜单
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/:menuId', authMiddleware(), requirePermission('system:menu:remove'), menuController.deleteMenu.bind(menuController))

module.exports = router
