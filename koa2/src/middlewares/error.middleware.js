/**
 * 错误处理中间件
 * @param {import('koa').Context} ctx - Koa 上下文
 * @param {import('koa').Next} next - 下一个中间件
 */
async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (error) {
    ctx.status = error.status || 500
    ctx.body = {
      code: ctx.status,
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    }

    console.error('Error:', error)
  }
}

module.exports = { errorMiddleware }
