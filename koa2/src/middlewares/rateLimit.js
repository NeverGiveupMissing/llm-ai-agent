// 说明：速率限制中间件 - 防止接口被频繁调用（如暴力破解）

const ResponseUtil = require('../utils/response')

/**
 * 简单的内存存储（生产环境建议使用 Redis）
 * 格式：{ [key]: { count: number, resetTime: timestamp } }
 */
const rateLimitStore = new Map()

/**
 * 清理过期的记录（定期执行）
 */
function cleanupExpiredRecords() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}

// 每 5 分钟清理一次过期记录
setInterval(cleanupExpiredRecords, 5 * 60 * 1000)

/**
 * 速率限制中间件
 * @param {Object} options - 配置选项
 * @param {number} options.windowMs - 时间窗口（毫秒），默认 60000（1分钟）
 * @param {number} options.maxRequests - 最大请求次数，默认 5
 * @param {string} options.keyGenerator - 生成唯一键的函数，默认使用 IP
 * @param {Function} options.message - 自定义错误消息函数
 * @returns {Function} Koa 中间件函数
 */
function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 默认 1 分钟
    maxRequests = 5, // 默认 5 次
    keyGenerator = (ctx) => ctx.ip, // 默认使用 IP 作为键
    message = (remaining, resetTime) => `请求过于频繁，请在 ${Math.ceil((resetTime - Date.now()) / 1000)} 秒后重试`,
  } = options

  return async (ctx, next) => {
    try {
      const key = keyGenerator(ctx)
      const now = Date.now()
      
      let record = rateLimitStore.get(key)

      // 如果记录不存在或已过期，创建新记录
      if (!record || record.resetTime <= now) {
        record = {
          count: 1,
          resetTime: now + windowMs,
        }
        rateLimitStore.set(key, record)
      } else {
        // 增加计数
        record.count++
      }

      // 检查是否超过限制
      if (record.count > maxRequests) {
        ctx.status = 429
        ctx.tooManyRequests(message(maxRequests - record.count, record.resetTime))
        ctx.set('X-RateLimit-Limit', maxRequests.toString())
        ctx.set('X-RateLimit-Remaining', '0')
        ctx.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())
        return
      }

      // 设置响应头
      ctx.set('X-RateLimit-Limit', maxRequests.toString())
      ctx.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString())
      ctx.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString())

      // 继续执行后续中间件
      await next()
    } catch (error) {
      // 速率限制失败不影响业务流程，记录错误并继续
      console.error('❌ 速率限制中间件错误:', error.message)
      // 不要再次调用 next()，让错误向上传递到错误处理中间件
      throw error
    }
  }
}

/**
 * 登录接口速率限制（每分钟最多 5 次）
 */
function loginRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 5, // 最多 5 次
    keyGenerator: (ctx) => `login:${ctx.ip}`, // 使用 IP 作为键
    message: () => '登录尝试次数过多，请稍后再试',
  })
}

/**
 * 注册接口速率限制（每分钟最多 3 次）
 */
function registerRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 3, // 最多 3 次
    keyGenerator: (ctx) => `register:${ctx.ip}`, // 使用 IP 作为键
    message: () => '注册尝试次数过多，请稍后再试',
  })
}

/**
 * 通用 API 速率限制（每分钟最多 60 次）
 */
function apiRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 60, // 最多 60 次
    keyGenerator: (ctx) => `api:${ctx.ip}`, // 使用 IP 作为键
    message: () => 'API 调用过于频繁，请稍后再试',
  })
}

module.exports = {
  rateLimit,
  loginRateLimit,
  registerRateLimit,
  apiRateLimit,
}
