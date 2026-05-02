/**
 * 数据库管理路由
 * 路径：koa2/src/modules/database/routes.js
 */

const Router = require('@koa/router')
const router = new Router({ prefix: '/database' })
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')
const databaseController = require('./controller')

/**
 * POST /api/database/execute
 * 执行 SQL 语句
 * 需要权限：database:execute
 */
router.post(
  '/execute',
  authMiddleware(),
  requirePermission('database:execute'),
  databaseController.executeSQL
)

/**
 * GET /api/database/export
 * 导出数据库
 * 需要权限：database:export
 */
router.get(
  '/export',
  authMiddleware(),
  requirePermission('database:export'),
  databaseController.exportDatabase
)

/**
 * POST /api/database/import
 * 导入数据库（执行 SQL 文件）
 * 需要权限：database:import
 */
router.post(
  '/import',
  authMiddleware(),
  requirePermission('database:import'),
  databaseController.importDatabase
)

/**
 * GET /api/database/tables
 * 获取所有表名列表
 * 需要权限：database:table
 */
router.get(
  '/tables',
  authMiddleware(),
  requirePermission('database:table'),
  databaseController.getTableList
)

/**
 * GET /api/database/tables/:name
 * 获取指定表的结构
 * 需要权限：database:table
 */
router.get(
  '/tables/:name',
  authMiddleware(),
  requirePermission('database:table'),
  databaseController.getTableStructure
)

/**
 * GET /api/database/tables/:name/data
 * 获取表数据（分页）
 * 需要权限：database:table
 */
router.get(
  '/tables/:name/data',
  authMiddleware(),
  requirePermission('database:table'),
  databaseController.getTableData
)

/**
 * PUT /api/database/tables/:name/row
 * 更新单行数据
 * 需要权限：database:execute
 */
router.put(
  '/tables/:name/row',
  authMiddleware(),
  requirePermission('database:execute'),
  databaseController.updateTableRow
)

/**
 * DELETE /api/database/tables/:name/row
 * 删除单行数据
 * 需要权限：database:execute
 */
router.delete(
  '/tables/:name/row',
  authMiddleware(),
  requirePermission('database:execute'),
  databaseController.deleteTableRow
)

module.exports = router
