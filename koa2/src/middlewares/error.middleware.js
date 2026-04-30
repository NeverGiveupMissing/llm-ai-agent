/**
 * 全局错误处理中间件
 * 统一捕获所有未处理的异常，返回标准格式
 * @param {import('koa').Context} ctx - Koa 上下文
 * @param {import('koa').Next} next - 下一个中间件
 */
async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (error) {
    // 提取错误状态码（优先使用 error.status，否则根据错误类型判断）
    const status = error.status || error.statusCode || 500
    
    // 构建标准响应格式
    ctx.status = status
    ctx.body = {
      code: status,
      message: error.message || '服务器内部错误',
      data: null,
    }

    // 生产环境不暴露堆栈信息
    if (process.env.NODE_ENV === 'development') {
      ctx.body.stack = error.stack
      console.error('❌ 错误详情:', error)
    } else {
      console.error(`❌ [${status}] ${error.message}`)
    }
  }
}

module.exports = { errorMiddleware }
