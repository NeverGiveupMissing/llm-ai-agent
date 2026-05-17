/**
 * 全局错误处理中间件
 * 统一捕获所有未处理的异常，返回标准格式
 * @param {import('koa').Context} ctx - Koa 上下文
 * @param {import('koa').Next} next - 下一个中间件
 */
const { ResponseUtil } = require('../utils/response')

async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (error) {
    console.error('❌ [Global Error] 捕获到异常:', error.name, error.message)
    console.error('❌ [Global Error] 请求路径:', ctx.path, ctx.method)

    // ✅ 1. 优先使用业务错误定义的状态码
    let status = error.status || error.statusCode

    // ✅ 2. 特殊处理 PostgreSQL 类型错误
    if (error.code === '22P02' || error.message.includes('invalid input syntax for type integer')) {
      status = 400
      error.message = `参数类型错误: ${error.message.split(':')[0] || '参数必须是有效的数字'}`
      console.error('❌ [DB Type Error]', error.detail || error.message)
    }
    // ✅ 3. 数据库连接错误
    else if (error.code === 'ECONNREFUSED' && error.message.includes('5432')) {
      status = 500
      error.message = '数据库连接失败，请检查数据库服务是否正常运行'
    }
    // ✅ 4. 数据库超时错误
    else if (error.code === 'ETIMEDOUT') {
      status = 500
      error.message = '数据库连接超时，请稍后重试'
    }
    // ✅ 5. PostgreSQL 外键约束错误
    else if (error.code === '23503') {
      status = 400
      error.message = '数据关联约束错误，请检查相关数据是否存在'
    }
    // ✅ 6. PostgreSQL 唯一约束错误
    else if (error.code === '23505') {
      status = 400
      error.message = '数据已存在，不能重复添加'
    }
    // ✅ 7. PostgreSQL 表不存在（relation does not exist）
    else if (
      error.code === '42P01' ||
      (error.message.includes('relation') && error.message.includes('does not exist'))
    ) {
      status = 400
      const tableName = error.message.match(/relation "(\w+)"/)?.[1] || '数据表'
      error.message = `数据表 "${tableName}" 不存在，请联系管理员初始化数据库`
      console.error(`❌ [DB Table Missing] 表不存在: ${tableName}`)
    }
    // ✅ 8. PostgreSQL 列不存在
    else if (
      error.code === '42703' ||
      (error.message.includes('column') && error.message.includes('does not exist'))
    ) {
      status = 400
      error.message = '功能暂未开放：数据结构异常，请联系管理员'
      console.error('❌ [DB Column Missing]', error.message)
    }
    // ✅ 9. 如果状态码仍未设置，默认为 500
    if (!status) {
      status = 500
    }

    // ✅ 使用统一响应格式
    ctx.status = status
    ctx.body = ResponseUtil.fail(error.message || '服务器内部错误', status)

    // ✅ 生产环境不暴露堆栈信息
    if (process.env.NODE_ENV === 'development') {
      ctx.body.stack = error.stack
      ctx.body.detail = error.detail
    }
  }
}

module.exports = { errorMiddleware }
