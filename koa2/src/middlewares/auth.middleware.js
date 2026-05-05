// 说明：JWT 认证中间件 - 用于验证用户身份和 Token

const jwt = require('jsonwebtoken')
const { mountToContext } = require('../utils/response')
const config = require('../config')

// ✅ 从配置文件获取 JWT 密钥（确保每次重启都使用相同的密钥）
const JWT_SECRET = config.jwt.secret
const JWT_EXPIRES_IN = config.jwt.expiresIn

/**
 * 生成 JWT Token
 * @param {Object} payload - 要编码的数据（通常包含 user_id、user_name 等）
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
      
      // ✅ 调试日志
      console.log('🔍 [Auth Debug] 请求路径:', ctx.path)
      console.log('🔍 [Auth Debug] Authorization 头:', authHeader ? `${authHeader.substring(0, 20)}...` : '无')

      if (!authHeader) {
        console.log('❌ [Auth] 缺少 Authorization 头')
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
        console.log('❌ [Auth] Token 为空')
        ctx.status = 401
        ctx.unauthorized('无效的认证令牌格式')
        return
      }

      // 验证 Token
      const decoded = verifyToken(token)
      console.log('✅ [Auth] Token 验证成功, user_id:', decoded.user_id, '路径:', ctx.path)

      // 将用户信息存储到 ctx.state，供后续中间件和控制器使用
      ctx.state.user_id = decoded.user_id
      ctx.state.user_name = decoded.user_name
      ctx.state.user = decoded

      // 继续执行后续中间件
      await next()
    } catch (error) {
      // Token 验证失败，返回 401
      console.error('❌ [Auth] Token 验证失败:', error.message, '路径:', ctx.path)
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
            ctx.state.user_id = decoded.user_id
            ctx.state.user_name = decoded.user_name
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
    user_id: decoded.user_id,
    user_name: decoded.user_name,
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
