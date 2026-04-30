const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const { koaSwagger } = require('koa2-swagger-ui')
const swaggerJSDoc = require('swagger-jsdoc')
const router = require('./routes')
const { corsMiddleware } = require('./middlewares/cors.middleware')
const { errorMiddleware } = require('./middlewares/error.middleware')
const { requestLoggerMiddleware } = require('./middlewares/request-logger.middleware')
const { checkRbacInitialized } = require('./middlewares/rbac-initializer')
const config = require('./config')
const swaggerConfig = require('./config/swagger')

const app = new Koa()

// ============================================
// 启动服务器
// ============================================
async function startServer() {
  try {
    // 检查 RBAC 系统初始化状态
    await checkRbacInitialized()

    // 配置中间件
    app.use(errorMiddleware)
    app.use(requestLoggerMiddleware)
    app.use(corsMiddleware)
    app.use(bodyParser())

    // 配置路由
    app.use(router.routes())
    app.use(router.allowedMethods())

    // 配置 Swagger 文档
    const swaggerSpec = swaggerJSDoc(swaggerConfig)
    app.use(
      koaSwagger({
        routePrefix: `${config.api.prefix}-docs`,
        swaggerOptions: {
          spec: swaggerSpec,
        },
      }),
    )

    // 启动服务器
    const PORT = config.server.port
    const HOST = config.server.host

    app.listen(PORT, HOST, () => {
      console.log('')
      console.log('🚀 ========================================')
      console.log(`🚀 AI Chat API is running on http://${HOST}:${PORT}`)
      console.log(`📌 API 前缀: ${config.api.prefix}`)
      console.log(`📚 API Docs: http://${HOST}:${PORT}${config.api.prefix}-docs`)
      console.log(`📝 Swagger JSON: http://${HOST}:${PORT}${config.api.prefix}-docs/swagger.json`)
      console.log('🚀 ========================================')
      console.log('')
    })
  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message)
    console.error('详细错误:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()

module.exports = app
