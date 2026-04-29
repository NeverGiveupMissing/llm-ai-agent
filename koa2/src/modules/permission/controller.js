// 说明：权限控制器 - 处理权限的 HTTP 请求

const permissionService = require('../../services/permissionService')
const ResponseUtil = require('../../utils/response')

class PermissionController {
  /**
   * 获取权限列表
   */
  async listPermissions(ctx) {
    try {
      const params = {
        module: ctx.query.module,
        action: ctx.query.action,
        resource: ctx.query.resource,
        keyword: ctx.query.keyword,
      }

      const result = await permissionService.listPermissions(params)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取权限列表失败')
    }
  }

  /**
   * 按模块分组获取权限
   */
  async getPermissionsByModule(ctx) {
    try {
      const result = await permissionService.getPermissionsByModule()

      ctx.status = 200
      ctx.body = ResponseUtil.success(result)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取权限分组失败')
    }
  }

  /**
   * 获取权限详情
   */
  async getPermissionDetail(ctx) {
    try {
      const { permissionId } = ctx.params

      if (!permissionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 permissionId 参数')
        return
      }

      const result = await permissionService.getPermissionDetail(permissionId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取权限详情失败')
    }
  }

  /**
   * 获取用户的所有权限
   */
  async getUserPermissions(ctx) {
    try {
      const { userId } = ctx.params

      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 参数')
        return
      }

      const result = await permissionService.getUserPermissions(userId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取用户权限失败')
    }
  }

  /**
   * 检查用户权限
   */
  async checkPermission(ctx) {
    try {
      const { userId, permissionCode } = ctx.params

      if (!userId || !permissionCode) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 或 permissionCode 参数')
        return
      }

      const result = await permissionService.checkPermission(userId, permissionCode)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '检查权限失败')
    }
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async checkAnyPermission(ctx) {
    try {
      const { userId } = ctx.params
      const { permissionCodes } = ctx.request.body

      if (!userId || !permissionCodes || !Array.isArray(permissionCodes)) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 或 permissionCodes 参数')
        return
      }

      const result = await permissionService.checkAnyPermission(userId, permissionCodes)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '检查权限失败')
    }
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async checkAllPermissions(ctx) {
    try {
      const { userId } = ctx.params
      const { permissionCodes } = ctx.request.body

      if (!userId || !permissionCodes || !Array.isArray(permissionCodes)) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 或 permissionCodes 参数')
        return
      }

      const result = await permissionService.checkAllPermissions(userId, permissionCodes)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '检查权限失败')
    }
  }
}

module.exports = new PermissionController()
