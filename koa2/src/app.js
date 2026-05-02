const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const multer = require('@koa/multer')
const path = require('path')
const serve = require('koa-static')
const { koaSwagger } = require('koa2-swagger-ui')
const swaggerJSDoc = require('swagger-jsdoc')
const router = require('./routes')
const { corsMiddleware } = require('./middlewares/cors.middleware')
const { errorMiddleware } = require('./middlewares/error.middleware')
const { requestLoggerMiddleware } = require('./middlewares/request-logger.middleware')
const { checkRbacInitialized } = require('./middlewares/rbac-initializer')
const operationLogger = require('./middlewares/operation-logger')
const responseMiddleware = require('./middlewares/response.middleware')
const config = require('./config')
const swaggerConfig = require('./config/swagger')

const app = new Koa()

// 配置文件上传中间件
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'), // 临时存储目录
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制 50MB
  },
})

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
    app.use(responseMiddleware) // 挂载响应方法到 ctx

    // 静态文件服务（上传的文件）
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!require('fs').existsSync(uploadsDir)) {
      require('fs').mkdirSync(uploadsDir, { recursive: true })
    }
    app.use(serve(uploadsDir))

    // ⚠️ 文件上传中间件必须在 bodyParser 之前执行
    // 使用 endsWith 兼容不同环境的 API 前缀（如 /api 或 /koa2api）
    app.use(async (ctx, next) => {
      if (ctx.path.endsWith('/database/import') && ctx.method === 'POST') {
        return upload.single('file')(ctx, next)
      }
      return next()
    })

    // 请求体解析（不会处理 multipart/form-data）
    app.use(
      bodyParser({
        enableTypes: ['json', 'form', 'text'],
        jsonLimit: '10mb',
        formLimit: '10mb',
      }),
    )

    app.use(operationLogger) // 操作日志记录中间件

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
