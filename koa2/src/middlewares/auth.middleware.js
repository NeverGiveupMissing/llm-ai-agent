// 说明：JWT 认证中间件 - 用于验证用户身份和 Token

const jwt = require('jsonwebtoken')
const { mountToContext } = require('../utils/response')
const { pool } = require('../config/db')
const config = require('../config')
const { isPublicPath } = require('../config/public-paths')

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
      // ✅ 权限豁免：检查是否在白名单中（使用统一配置）
      if (isPublicPath(ctx.path)) {
        console.log('⏭️ [Auth] 路径在白名单中，跳过认证:', ctx.path)
        await next()
        return
      }
  
      // 从请求头获取 Token
      const authHeader = ctx.headers.authorization
  
      // ✅ 调试日志
      console.log('🔍 [Auth Debug] 请求路径:', ctx.path)
      console.log(
        '🔍 [Auth Debug] Authorization 头:',
        authHeader ? `${authHeader.substring(0, 20)}...` : '无',
      )
  
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
  
      // ✅ 阶段1：验证 Token（此阶段的错误返回 401）
      let decoded
      try {
        decoded = verifyToken(token)
      } catch (error) {
        // Token 验证失败，返回 401
        console.error(' [Auth] Token 验证失败:', error.message, '路径:', ctx.path)
        ctx.status = 401
        ctx.unauthorized(error.message || '认证失败')
        return
      }
        
      console.log(' [Auth] Token 验证成功, user_id:', decoded.user_id, '路径:', ctx.path)
      
      // ✅ 新增：查库校验账号状态（替代 Redis）
      const user_id = decoded.user_id
      try {
        const query = 'SELECT status FROM sys_user WHERE user_id = $1::int AND del_flag = $2'
        const result = await pool.query(query, [user_id, '0']) // del_flag = '0' 表示未删除
        
        if (!result.rows || result.rows.length === 0) {
          // 用户不存在或已删除
          console.warn(` [Auth] 用户 ${user_id} 不存在或已删除，路径:`, ctx.path)
          ctx.status = 401
          ctx.body = { code: 401, message: '用户不存在，请重新登录！' }
          return
        }
        
        const userStatus = result.rows[0].status
        console.log(` [Auth] 用户 ${user_id} 状态: ${userStatus}（'0'=停用, '1'=正常）`)
        
        // ✅ 拦截停用账号
        if (userStatus === '0') {
          console.warn(` [Auth] 用户 ${user_id} 已被停用，拦截请求，路径:`, ctx.path)
          // 确保 ctx.state 存在
          if (!ctx.state) ctx.state = {}
          // 清除上下文
          ctx.state.user_id = null
          ctx.state.user_name = null
          ctx.state.user = null
          
          ctx.status = 401
          ctx.body = {
            code: 401,
            message: '您的账号已被停用，请联系管理员！',
          }
          return
        }
      } catch (dbError) {
        console.error(' [Auth] 查库校验账号状态失败:', dbError.message)
        // 数据库异常时，降级放行（避免阻塞正常用户）
        console.warn(' [Auth] 降级处理：允许请求通过')
      }
        
      // 将用户信息存储到 ctx.state，供后续中间件和控制器使用
      ctx.state.user_id = decoded.user_id
      ctx.state.user_name = decoded.user_name
      ctx.state.user = decoded
        
      // ✅ 阶段2：执行业务逻辑（此阶段的错误直接抛出，由全局错误处理中间件统一处理）
      await next()
    } catch (error) {
      // ✅ 区分认证错误和业务错误
      // 如果是 AppError（业务错误），直接抛出给全局错误处理中间件
      if (error.name === 'AppError' || error.status || error.statusCode) {
        throw error
      }
      
      // ✅ PostgreSQL 数据库错误也抛出给全局错误处理中间件（统一处理 404/500 等）
      if (error.code || error.message.includes('relation') || error.message.includes('does not exist')) {
        throw error
      }
      
      // 否则是认证相关的未预期错误，返回 500
      console.error('❌ [Auth] 认证中间件发生未预期的错误:', error.message)
      ctx.status = 500
      ctx.serverError('服务器内部错误')
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
