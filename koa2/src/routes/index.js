const Router = require('@koa/router')
const chatRoutes = require('../modules/chat/routes')
const logsRoutes = require('../modules/logs/routes')
const memoryRoutes = require('../modules/memory/routes')
const chatMemoryRoutes = require('../modules/chat-memory/routes')
const sessionRoutes = require('../modules/session/routes')
const sessionGroupRoutes = require('../modules/session-group/routes')

// RBAC 权限系统路由
const userRoutes = require('../modules/user/routes')
const roleRoutes = require('../modules/role/routes')
const permissionRoutes = require('../modules/permission/routes')

const config = require('../config')

const router = new Router({ prefix: config.api.prefix })

// 原有路由
router.use(chatRoutes.routes(), chatRoutes.allowedMethods())
router.use(logsRoutes.routes(), logsRoutes.allowedMethods())
router.use(memoryRoutes.routes(), memoryRoutes.allowedMethods())
router.use(chatMemoryRoutes.routes(), chatMemoryRoutes.allowedMethods())
router.use(sessionRoutes.routes(), sessionRoutes.allowedMethods())
router.use(sessionGroupRoutes.routes(), sessionGroupRoutes.allowedMethods())

// RBAC 权限系统路由
router.use(userRoutes.routes(), userRoutes.allowedMethods())
router.use(roleRoutes.routes(), roleRoutes.allowedMethods())
router.use(permissionRoutes.routes(), permissionRoutes.allowedMethods())

/**
 * @swagger
 * /:
 *   get:
 *     summary: API 根路径
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/', (ctx) => {
  ctx.body = {
    message: 'AI Chat API is running',
    docs: `${config.api.prefix}-docs`,
  }
})

module.exports = router
