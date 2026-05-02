/**
 * 响应方法挂载中间件
 * 位置：koa2/src/middlewares/response.middleware.js
 * 
 * 将统一的响应方法挂载到 ctx 上，方便在 Controller 中直接使用
 */

const { mountToContext } = require('../utils/response')

/**
 * 响应方法挂载中间件
 */
async function responseMiddleware(ctx, next) {
  // 将响应方法挂载到 ctx
  mountToContext(ctx)
  
  await next()
}

module.exports = responseMiddleware
