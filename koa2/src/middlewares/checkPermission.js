// 说明：权限验证中间件 - 用于保护需要特定权限的接口

const permissionModel = require('../models/permissionModel')
const ResponseUtil = require('../utils/response')

/**
 * 权限验证中间件工厂函数
 * @param {string|string[]} permissionCodes - 权限代码（单个字符串或数组）
 * @param {Object} options - 配置选项
 * @param {string} options.type - 验证类型：'single' | 'any' | 'all'
 * @returns {Function} Koa 中间件函数
 */
function checkPermission(permissionCodes, options = {}) {
  const { type = 'single' } = options

  return async (ctx, next) => {
    try {
      // 从上下文获取用户 ID（假设认证中间件已将其存储在 ctx.state）
      const userId = ctx.state.userId

      if (!userId) {
        ctx.status = 401
        ctx.body = ResponseUtil.unauthorized('未登录或登录已过期')
        return
      }

      let hasPermission = false

      switch (type) {
        case 'single':
          // 单个权限验证
          hasPermission = await permissionModel.hasPermission(userId, permissionCodes)
          if (!hasPermission) {
            ctx.status = 403
            ctx.body = ResponseUtil.forbidden(`权限不足：需要 ${permissionCodes} 权限`)
            return
          }
          break

        case 'any':
          // 任一权限验证
          hasPermission = await permissionModel.hasAnyPermission(userId, permissionCodes)
          if (!hasPermission) {
            ctx.status = 403
            ctx.body = ResponseUtil.forbidden(
              `权限不足：需要以下任一权限 [${permissionCodes.join(', ')}]`,
            )
            return
          }
          break

        case 'all':
          // 所有权限验证
          hasPermission = await permissionModel.hasAllPermissions(userId, permissionCodes)
          if (!hasPermission) {
            ctx.status = 403
            ctx.body = ResponseUtil.forbidden(
              `权限不足：需要所有权限 [${permissionCodes.join(', ')}]`,
            )
            return
          }
          break

        default:
          throw new Error(`未知的权限验证类型: ${type}`)
      }

      // 权限验证通过，继续执行后续中间件
      await next()
    } catch (error) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(error.message || '权限验证失败')
    }
  }
}

/**
 * 便捷方法：单个权限验证
 */
function requirePermission(permissionCode) {
  return checkPermission(permissionCode, { type: 'single' })
}

/**
 * 便捷方法：任一权限验证
 */
function requireAnyPermission(permissionCodes) {
  return checkPermission(permissionCodes, { type: 'any' })
}

/**
 * 便捷方法：所有权限验证
 */
function requireAllPermissions(permissionCodes) {
  return checkPermission(permissionCodes, { type: 'all' })
}

module.exports = {
  checkPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
}
