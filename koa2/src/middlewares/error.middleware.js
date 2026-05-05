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
    
    // 特殊处理数据库连接错误
    let errorMessage = error.message || '服务器内部错误'
    if (error.code === 'ECONNREFUSED' && error.message.includes('5432')) {
      errorMessage = '数据库连接失败，请检查数据库服务是否正常运行'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '数据库连接超时，请稍后重试'
    } else if (error.message.includes('connect ECONNREFUSED')) {
      errorMessage = '服务连接失败，请联系管理员'
    }
    
    ctx.body = {
      code: status,
      message: errorMessage,
      data: null,
    }

    // 生产环境不暴露堆栈信息
    if (process.env.NODE_ENV === 'development') {
      ctx.body.stack = error.stack
      console.error('❌ 错误详情:', error)
    } else {
      console.error(`❌ [${status}] ${errorMessage}`)
    }
  }
}

module.exports = { errorMiddleware }
