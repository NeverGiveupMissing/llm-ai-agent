const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const { koaSwagger } = require('koa2-swagger-ui')
const swaggerJSDoc = require('swagger-jsdoc')
const router = require('./routes')
const { corsMiddleware } = require('./middlewares/cors.middleware')
const { errorMiddleware } = require('./middlewares/error.middleware')
const { requestLoggerMiddleware } = require('./middlewares/request-logger.middleware')
const config = require('./config')
const swaggerConfig = require('./config/swagger')

const app = new Koa()

app.use(errorMiddleware)
app.use(requestLoggerMiddleware)
app.use(corsMiddleware)
app.use(bodyParser())

app.use(router.routes())
app.use(router.allowedMethods())

const swaggerSpec = swaggerJSDoc(swaggerConfig)
app.use(
  koaSwagger({
    routePrefix: `${config.api.prefix}-docs`,
    swaggerOptions: {
      spec: swaggerSpec,
    },
  }),
)

const PORT = config.server.port
const HOST = config.server.host

app.listen(PORT, HOST, () => {
  console.log(`🚀 AI Chat API is running on http://${HOST}:${PORT}`)
  console.log(`📌 API 前缀: ${config.api.prefix}`)
  console.log(`📚 API Docs: http://${HOST}:${PORT}${config.api.prefix}-docs`)
  console.log(`📝 Swagger JSON: http://${HOST}:${PORT}${config.api.prefix}-docs/swagger.json`)
})

module.exports = app
