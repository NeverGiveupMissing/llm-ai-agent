const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
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
const { authMiddleware } = require('./middlewares/auth.middleware')
const { globalApiPermissionInterceptor } = require('./middlewares/global-api-permission')
const config = require('./config')
const swaggerConfig = require('./config/swagger')
const { uploadDir } = require('./middlewares/upload.middleware')
const { testConnection } = require('./config/db')

const app = new Koa()

// ============================================
// 启动服务器
// ============================================
async function startServer() {
  try {
    // 检查 RBAC 系统初始化状态
    await checkRbacInitialized()

    // 测试数据库连接
    console.log('🔍 正在测试数据库连接...')
    const dbConnected = await testConnection()
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器无法启动')
      console.error('💡 请确保 PostgreSQL 服务正在运行，并检查 .env 文件中的数据库配置')
      process.exit(1)
    }

    // ✅ 全局中间件链（按照执行顺序注册）
    
    // 1. 基础中间件（错误处理、日志、跨域、响应格式化）
    app.use(errorMiddleware)
    app.use(requestLoggerMiddleware)
    app.use(corsMiddleware)
    app.use(responseMiddleware)
    
    // 2. 静态文件服务（上传的文件）
    const staticRootPath = path.resolve(process.cwd())
    console.log('📁 静态文件服务根目录 (koa2):', staticRootPath)

    const uploadsPath = path.join(staticRootPath, 'uploads')
    if (!require('fs').existsSync(uploadsPath)) {
      require('fs').mkdirSync(uploadsPath, { recursive: true })
      console.log('✅ 已创建 uploads 目录')
    } else {
      const files = require('fs').readdirSync(uploadsPath)
      console.log('📄 uploads 目录中的文件:', files)
    }

    app.use(
      serve(staticRootPath, {
        maxage: 3600000,
        hidden: false,
        index: false,
      }),
    )
    console.log('✅ 静态文件服务已启动，可通过 /uploads/ 访问文件')

    // 3. 请求体解析
    app.use(
      bodyParser({
        enableTypes: ['json', 'form', 'text'],
        jsonLimit: '10mb',
        formLimit: '10mb',
      }),
    )

    // 4. ✅ 全局 Token 解析中间件（必须在权限拦截器之前）
    // 内部包含白名单逻辑，登录/注册/健康检查等路由会自动跳过认证
    app.use(authMiddleware())
    console.log('✅ 全局认证中间件已启用')

    // 5. ✅ 全局接口权限拦截器（必须在 authMiddleware 之后，router 之前）
    // 此时 ctx.state.user_id 已挂载，可以安全进行权限校验
    // 内部包含：白名单放行 -> 账号停用校验 -> Admin绿通 -> 普通用户撞表
    app.use(globalApiPermissionInterceptor())
    console.log('✅ 全局接口权限拦截器已启用')

    // 6. 操作日志记录中间件
    app.use(operationLogger)

    // 7. 配置路由（业务路由内部干干净净，只管业务逻辑）
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
