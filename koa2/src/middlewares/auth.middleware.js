// 说明：JWT 认证中间件 - 用于验证用户身份和 Token

const jwt = require('jsonwebtoken')
const ResponseUtil = require('../utils/response')
const config = require('../config')

// JWT 密钥（从环境变量获取，生产环境应使用更安全的密钥管理方式）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d' // 默认 7 天过期

/**
 * 生成 JWT Token
 * @param {Object} payload - 要编码的数据（通常包含 userId、username 等）
 * @param {Object} options - 可选配置
 * @returns {string} JWT Token
 */
function generateToken(payload, options = {}) {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000), // 签发时间
  }

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
  })
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的 payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token 已过期')
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('无效的 Token')
    }
    throw error
  }
}

/**
 * JWT 认证中间件
 * 从请求头中提取并验证 Token，将用户信息存储到 ctx.state
 * @returns {Function} Koa 中间件函数
 */
function authMiddleware() {
  return async (ctx, next) => {
    try {
      // 从请求头获取 Token
      const authHeader = ctx.headers.authorization

      if (!authHeader) {
        ctx.status = 401
        ctx.unauthorized('缺少认证令牌')
        return
      }

      // 提取 Token（支持 "Bearer <token>" 格式）
      let token = authHeader
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }

      if (!token) {
        ctx.status = 401
        ctx.unauthorized('无效的认证令牌格式')
        return
      }

      // 验证 Token
      const decoded = verifyToken(token)

      // 将用户信息存储到 ctx.state，供后续中间件和控制器使用
      ctx.state.userId = decoded.userId
      ctx.state.username = decoded.username
      ctx.state.user = decoded

      // 继续执行后续中间件
      await next()
    } catch (error) {
      // Token 验证失败，返回 401
      ctx.status = 401
      ctx.unauthorized(error.message || '认证失败')
    }
  }
}

/**
 * 可选认证中间件
 * 如果提供了 Token 则验证，否则允许匿名访问
 * @returns {Function} Koa 中间件函数
 */
function optionalAuth() {
  return async (ctx, next) => {
    try {
      const authHeader = ctx.headers.authorization

      if (authHeader) {
        let token = authHeader
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }

        if (token) {
          try {
            const decoded = verifyToken(token)
            ctx.state.userId = decoded.userId
            ctx.state.username = decoded.username
            ctx.state.user = decoded
          } catch (error) {
            // Token 无效时不抛出错误，继续执行（视为未登录状态）
            console.warn('⚠️ 可选认证失败:', error.message)
          }
        }
      }

      await next()
    } catch (error) {
      // 即使出错也继续执行，不影响业务流程
      console.error('❌ 可选认证中间件错误:', error.message)
      await next()
    }
  }
}

/**
 * 刷新 Token
 * @param {string} oldToken - 旧 Token
 * @param {Object} extraPayload - 额外的 payload 数据
 * @returns {string} 新的 Token
 */
function refreshToken(oldToken, extraPayload = {}) {
  const decoded = verifyToken(oldToken)
  const newPayload = {
    userId: decoded.userId,
    username: decoded.username,
    ...extraPayload,
  }
  return generateToken(newPayload)
}

module.exports = {
  authMiddleware,
  optionalAuth,
  generateToken,
  verifyToken,
  refreshToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
}
