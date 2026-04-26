const path = require('path')
const config = require('./index')

/**
 * Swagger 配置
 */
const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Chat API',
      version: '1.0.0',
      description: 'AI 聊天 API - Node.js Koa2 JavaScript 实现',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}${config.api.prefix}`,
        description: '开发服务器',
      },
    ],
    tags: [
      { name: 'chat', description: '聊天相关接口' },
      { name: 'logs', description: '日志管理接口' },
    ],
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
}

module.exports = swaggerConfig
