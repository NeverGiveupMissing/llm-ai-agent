const Router = require('@koa/router')
const chatRoutes = require('../modules/chat/routes')
const logsRoutes = require('../modules/logs/routes')
const memoryRoutes = require('../modules/memory/routes')
const chatMemoryRoutes = require('../modules/chat-memory/routes')
const sessionRoutes = require('../modules/session/routes')
const sessionGroupRoutes = require('../modules/session-group/routes')
const operationLogRoutes = require('../modules/operation-log/routes')

// RBAC 权限系统路由
const userRoutes = require('../modules/user/routes')
const roleRoutes = require('../modules/role/routes')
const menuRoutes = require('../modules/menu/routes')
const buttonRoutes = require('../modules/button/routes')
const interfaceRoutes = require('../modules/interface/routes')

// 数据库管理路由
const databaseRoutes = require('../modules/database/routes')

// 登录日志路由
const loginLogRoutes = require('../modules/login-log/routes')

// 文件上传路由
const uploadRoutes = require('../modules/upload/routes')

// 健康检查路由（不需要 API 前缀，直接挂载到根路径）
const healthRoutes = require('../modules/health/routes')

// 验证码路由
const captchaRoutes = require('../modules/captcha/routes')

const config = require('../config')

const router = new Router({ prefix: config.api.prefix })

// 健康检查路由（直接挂载到 app，不使用 API 前缀）
// 注意：这需要在 app.js 中单独挂载，而不是在这里
// 暂时先挂载到 API 前缀下，路径为 /koa2api/health

// 原有路由
router.use(chatRoutes.routes(), chatRoutes.allowedMethods())
router.use(logsRoutes.routes(), logsRoutes.allowedMethods())
router.use(memoryRoutes.routes(), memoryRoutes.allowedMethods())
router.use(chatMemoryRoutes.routes(), chatMemoryRoutes.allowedMethods())
router.use(sessionRoutes.routes(), sessionRoutes.allowedMethods())
router.use(sessionGroupRoutes.routes(), sessionGroupRoutes.allowedMethods())
router.use(operationLogRoutes.routes(), operationLogRoutes.allowedMethods())

// RBAC 权限系统路由
router.use(userRoutes.routes(), userRoutes.allowedMethods())
router.use(roleRoutes.routes(), roleRoutes.allowedMethods())
router.use(menuRoutes.routes(), menuRoutes.allowedMethods())
router.use(buttonRoutes.routes(), buttonRoutes.allowedMethods())
router.use(interfaceRoutes.routes(), interfaceRoutes.allowedMethods())

// 数据库管理路由
router.use(databaseRoutes.routes(), databaseRoutes.allowedMethods())

// 登录日志路由
router.use(loginLogRoutes.routes(), loginLogRoutes.allowedMethods())

// 文件上传路由
router.use(uploadRoutes.routes(), uploadRoutes.allowedMethods())

// 健康检查路由（不需要 API 前缀，直接挂载到根路径）
router.use(healthRoutes.routes(), healthRoutes.allowedMethods())

// 验证码路由
router.use(captchaRoutes.routes(), captchaRoutes.allowedMethods())

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