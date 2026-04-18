const Router = require('@koa/router')
const chatRoutes = require('./chat.routes')
const logsRoutes = require('./logs.routes')
const config = require('../config')

const router = new Router({ prefix: config.api.prefix })

router.use(chatRoutes.routes(), chatRoutes.allowedMethods())
router.use(logsRoutes.routes(), logsRoutes.allowedMethods())

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
