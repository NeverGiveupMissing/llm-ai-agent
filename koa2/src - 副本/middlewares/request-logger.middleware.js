const dayjs = require('dayjs')

/**
 * 请求日志中间件
 * @param {import('koa').Context} ctx - Koa 上下文
 * @param {import('koa').Next} next - 下一个中间件
 */
async function requestLoggerMiddleware(ctx, next) {
  const start = Date.now()

  await next()

  const duration = Date.now() - start
  console.log(
    `${dayjs().format('YYYY-MM-DD HH:mm:ss')} | ${ctx.method} ${ctx.path} | ${ctx.status} | ${duration}ms`,
  )
}

module.exports = { requestLoggerMiddleware }
