/**
 * 系统健康检查路由
 * 提供数据库连接状态等系统健康信息
 */

const Router = require('@koa/router')
const { checkDatabaseHealth, formatHealthStatus } = require('../../utils/db-health-check')
const { asyncHandler } = require('../../utils/async-handler')

const router = new Router()

/**
 * GET /health
 * 获取系统健康状态
 */
router.get(
  '/health',
  asyncHandler(async (ctx) => {
    const dbHealth = await checkDatabaseHealth()
    
    // 如果数据库不健康，返回 503 状态码
    if (dbHealth.status === 'unhealthy') {
      ctx.status = 503
      ctx.body = {
        code: 503,
        message: '服务不可用',
        data: {
          database: dbHealth,
          formatted: formatHealthStatus(dbHealth),
        },
      }
      return
    }
    
    ctx.body = {
      code: 200,
      message: '服务正常',
      data: {
        database: dbHealth,
        formatted: formatHealthStatus(dbHealth),
        timestamp: new Date().toISOString(),
      },
    }
  }),
)

/**
 * GET /health/db
 * 仅获取数据库健康状态
 */
router.get(
  '/health/db',
  asyncHandler(async (ctx) => {
    const dbHealth = await checkDatabaseHealth()
    
    ctx.body = {
      code: dbHealth.status === 'healthy' ? 200 : 503,
      message: dbHealth.status === 'healthy' ? '数据库连接正常' : '数据库连接异常',
      data: dbHealth,
    }
  }),
)

module.exports = router
