/**
 * 数据库管理路由
 * 路径：koa2/src/modules/database/routes.js
 */

const Router = require('@koa/router')
const router = new Router({ prefix: '/database' })
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')
const { exportPermissionChecker } = require('../../middlewares/permission-checker')
const { upload } = require('../../middlewares/upload.middleware')
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
 * ✅ 双重权限检查：requirePermission + exportPermissionChecker
 */
router.get(
  '/export',
  authMiddleware(),
  requirePermission('database:export'), // 第一层：菜单权限检查
  exportPermissionChecker(), // 第二层：通用导出权限检查（admin 豁免）
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
  upload.single('file'), // multer 中间件
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
 * GET /api/database/tables/:name/detail
 * 获取表详细信息（字段 + 注释 + 索引）
 * 需要权限：database:table
 */
router.get(
  '/tables/:name/detail',
  authMiddleware(),
  requirePermission('database:table'),
  databaseController.getTableDetail
)

/**
 * GET /api/database/tables/:name
 * 获取指定表的结构（旧接口，保留兼容）
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
