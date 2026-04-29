// 说明：权限业务逻辑 - 处理权限的查询和验证

const permissionModel = require('../models/permissionModel')
const roleModel = require('../models/roleModel')

class PermissionService {
  /**
   * 获取权限列表
   */
  async listPermissions(params) {
    const permissions = await permissionModel.list(params)

    return {
      success: true,
      data: permissions,
      total: permissions.length,
    }
  }

  /**
   * 按模块分组获取权限
   */
  async getPermissionsByModule() {
    const groupedPermissions = await permissionModel.listByModule()

    return {
      success: true,
      data: groupedPermissions,
    }
  }

  /**
   * 获取权限详情
   */
  async getPermissionDetail(permissionId) {
    const permission = await permissionModel.getById(permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }

    return {
      success: true,
      data: permission,
    }
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(userId) {
    const permissions = await permissionModel.getUserPermissions(userId)

    return {
      success: true,
      data: permissions,
      total: permissions.length,
    }
  }

  /**
   * 检查用户权限
   */
  async checkPermission(userId, permissionCode) {
    const hasPermission = await permissionModel.hasPermission(userId, permissionCode)

    return {
      success: true,
      data: {
        hasPermission,
        permissionCode,
      },
    }
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async checkAnyPermission(userId, permissionCodes) {
    const hasAny = await permissionModel.hasAnyPermission(userId, permissionCodes)

    return {
      success: true,
      data: {
        hasAny,
        permissionCodes,
      },
    }
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async checkAllPermissions(userId, permissionCodes) {
    const hasAll = await permissionModel.hasAllPermissions(userId, permissionCodes)

    return {
      success: true,
      data: {
        hasAll,
        permissionCodes,
      },
    }
  }

  /**
   * 权限验证中间件（返回验证函数）
   */
  requirePermission(permissionCode) {
    return async (ctx, next) => {
      const userId = ctx.state.userId // 假设用户 ID 已存储在 ctx.state

      if (!userId) {
        ctx.status = 401
        ctx.body = {
          success: false,
          message: '未授权',
        }
        return
      }

      const hasPermission = await permissionModel.hasPermission(userId, permissionCode)

      if (!hasPermission) {
        ctx.status = 403
        ctx.body = {
          success: false,
          message: `权限不足：需要 ${permissionCode} 权限`,
        }
        return
      }

      await next()
    }
  }

  /**
   * 权限验证中间件（任一权限即可）
   */
  requireAnyPermission(permissionCodes) {
    return async (ctx, next) => {
      const userId = ctx.state.userId

      if (!userId) {
        ctx.status = 401
        ctx.body = {
          success: false,
          message: '未授权',
        }
        return
      }

      const hasAny = await permissionModel.hasAnyPermission(userId, permissionCodes)

      if (!hasAny) {
        ctx.status = 403
        ctx.body = {
          success: false,
          message: `权限不足：需要以下任一权限 [${permissionCodes.join(', ')}]`,
        }
        return
      }

      await next()
    }
  }

  /**
   * 权限验证中间件（需要所有权限）
   */
  requireAllPermissions(permissionCodes) {
    return async (ctx, next) => {
      const userId = ctx.state.userId

      if (!userId) {
        ctx.status = 401
        ctx.body = {
          success: false,
          message: '未授权',
        }
        return
      }

      const hasAll = await permissionModel.hasAllPermissions(userId, permissionCodes)

      if (!hasAll) {
        ctx.status = 403
        ctx.body = {
          success: false,
          message: `权限不足：需要所有权限 [${permissionCodes.join(', ')}]`,
        }
        return
      }

      await next()
    }
  }
}

module.exports = new PermissionService()
