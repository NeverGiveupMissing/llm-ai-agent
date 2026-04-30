/**
 * 异步控制器包装器
 * 自动捕获异步错误并传递给错误处理中间件，无需在 Controller 中写 try/catch
 * 
 * @param {Function} fn - 控制器方法
 * @returns {Function} Koa 中间件函数
 */
function asyncHandler(fn) {
  return async (ctx, next) => {
    try {
      await fn(ctx, next)
    } catch (error) {
      // 将错误传递给全局错误处理中间件
      throw error
    }
  }
}

module.exports = { asyncHandler }
