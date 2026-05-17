/**
 * 数据库管理路由
 * 路径：koa2/src/modules/database/routes.js
 * ✅ 已移除所有手动权限验证，统一由全局接口权限拦截器处理
 */

const Router = require('@koa/router')
const router = new Router({ prefix: '/database' })
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { exportPermissionChecker } = require('../../middlewares/permission-checker')
const { upload } = require('../../middlewares/upload.middleware')
const databaseController = require('./controller')

/**
 * @swagger
 * tags:
 *   name: 数据库管理
 *   description: 数据库管理相关接口
 */

/**
 * @swagger
 * /database/execute:
 *   post:
 *     tags: [数据库管理]
 *     summary: 执行 SQL 语句
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sql]
 *             properties:
 *               sql:
 *                 type: string
 *     responses:
 *       200:
 *         description: 执行成功
 */
router.post(
  '/execute',
  authMiddleware(),
  databaseController.executeSQL
)

/**
 * @swagger
 * /database/export:
 *   get:
 *     tags: [数据库管理]
 *     summary: 导出数据库
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 导出成功
 *         content:
 *           application/sql:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/export',
  authMiddleware(),
  exportPermissionChecker(),
  databaseController.exportDatabase
)

/**
 * @swagger
 * /database/import:
 *   post:
 *     tags: [数据库管理]
 *     summary: 导入数据库（执行 SQL 文件）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 导入成功
 */
router.post(
  '/import',
  authMiddleware(),
  upload.single('file'),
  databaseController.importDatabase
)

/**
 * @swagger
 * /database/tables:
 *   get:
 *     tags: [数据库管理]
 *     summary: 获取所有表名列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/tables',
  authMiddleware(),
  databaseController.getTableList
)

/**
 * @swagger
 * /database/tables/{name}/detail:
 *   get:
 *     tags: [数据库管理]
 *     summary: 获取表详细信息（字段 + 注释 + 索引）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/tables/:name/detail',
  authMiddleware(),
  databaseController.getTableDetail
)

/**
 * @swagger
 * /database/tables/{name}:
 *   get:
 *     tags: [数据库管理]
 *     summary: 获取指定表的结构（旧接口，保留兼容）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get(
  '/tables/:name',
  authMiddleware(),
  databaseController.getTableStructure
)

/**
 * @swagger
 * /database/tables/{name}/data:
 *   get:
 *     tags: [数据库管理]
 *     summary: 获取表数据（分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
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
  '/tables/:name/data',
  authMiddleware(),
  databaseController.getTableData
)

/**
 * @swagger
 * /database/tables/{name}/row:
 *   put:
 *     tags: [数据库管理]
 *     summary: 更新单行数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
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
 *               primary_key:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.put(
  '/tables/:name/row',
  authMiddleware(),
  databaseController.updateTableRow
)

/**
 * @swagger
 * /database/tables/{name}/row:
 *   delete:
 *     tags: [数据库管理]
 *     summary: 删除单行数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: primary_key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete(
  '/tables/:name/row',
  authMiddleware(),
  databaseController.deleteTableRow
)

module.exports = router
