const Router = require('@koa/router')
const loginLogController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')

const router = new Router({
  prefix: '/login-logs',
})

/**
 * 获取当前用户的登录日志（需要认证）
 */
router.get('/my', authMiddleware(), loginLogController.getMyLoginLogs)

/**
 * 获取所有登录日志（需要权限）
 */
router.get(
  '/',
  authMiddleware(),
  requirePermission('system:login-log:view'),
  loginLogController.getAllLoginLogs
)

/**
 * 删除登录日志（需要权限）
 */
router.delete(
  '/:id',
  authMiddleware(),
  requirePermission('system:login-log:delete'),
  loginLogController.deleteLog
)

/**
 * 批量删除登录日志（需要权限）
 */
router.post(
  '/batch-delete',
  authMiddleware(),
  requirePermission('system:login-log:delete'),
  loginLogController.batchDeleteLogs
)

/**
 * 清空所有登录日志（需要权限）
 */
router.post(
  '/clear-all',
  authMiddleware(),
  requirePermission('system:login-log:delete'),
  loginLogController.clearAllLogs
)

module.exports = router
