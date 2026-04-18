/**
 * CORS 中间件
 * @param {import('koa').Context} ctx - Koa 上下文
 * @param {import('koa').Next} next - 下一个中间件
 */
async function corsMiddleware(ctx, next) {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Credentials', 'false')
  ctx.set('Access-Control-Allow-Methods', '*')
  ctx.set('Access-Control-Allow-Headers', '*')

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204
    return
  }

  await next()
}

module.exports = { corsMiddleware }
