const Router = require('@koa/router')
const operationLogController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')

const router = new Router({
  prefix: '/operation-logs',
})

// ============================================
// 静态路由优先
// ============================================

/**
 * 获取操作日志列表（需要权限）
 */
router.get('/', authMiddleware(), requirePermission('log:read'), operationLogController.getLogs)

/**
 * 获取统计数据（需要权限）
 */
router.get('/stats', authMiddleware(), requirePermission('log:read'), operationLogController.getStats)

/**
 * 批量删除操作日志（需要权限）
 */
router.post('/batch-delete', authMiddleware(), requirePermission('log:delete'), operationLogController.batchDeleteLogs)

/**
 * 清空所有操作日志（需要管理员权限）
 */
router.post('/clear-all', authMiddleware(), requirePermission('log:delete'), operationLogController.clearAllLogs)

// ============================================
// 动态路由（作为兜底，放在最后）
// ============================================

/**
 * 获取操作日志详情（需要权限）
 */
router.get('/:id', authMiddleware(), requirePermission('log:read'), operationLogController.getLogById)

/**
 * 删除操作日志（需要权限）
 */
router.delete('/:id', authMiddleware(), requirePermission('log:delete'), operationLogController.deleteLog)

module.exports = router