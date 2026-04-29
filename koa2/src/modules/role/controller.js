// 说明：角色控制器 - 处理角色的 HTTP 请求

const roleService = require('../../services/roleService')
const ResponseUtil = require('../../utils/response')

class RoleController {
  /**
   * 创建角色
   */
  async createRole(ctx) {
    try {
      const { name, displayName, description, isSystem } = ctx.request.body

      if (!name) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('角色名称不能为空')
        return
      }

      const result = await roleService.createRole({
        name,
        displayName,
        description,
        isSystem,
      })

      ctx.status = 201
      ctx.body = ResponseUtil.success(result.data, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '创建角色失败')
    }
  }

  /**
   * 获取角色列表
   */
  async listRoles(ctx) {
    try {
      const params = {
        page: parseInt(ctx.query.page) || 1,
        limit: parseInt(ctx.query.limit) || 20,
        keyword: ctx.query.keyword,
      }

      const result = await roleService.listRoles(params)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取角色列表失败')
    }
  }

  /**
   * 获取角色详情
   */
  async getRoleDetail(ctx) {
    try {
      const { roleId } = ctx.params

      if (!roleId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 参数')
        return
      }

      const result = await roleService.getRoleDetail(roleId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取角色详情失败')
    }
  }

  /**
   * 更新角色信息
   */
  async updateRole(ctx) {
    try {
      const { roleId } = ctx.params
      const updates = ctx.request.body

      if (!roleId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 参数')
        return
      }

      const result = await roleService.updateRole(roleId, updates)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '更新角色失败')
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(ctx) {
    try {
      const { roleId } = ctx.params

      if (!roleId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 参数')
        return
      }

      const result = await roleService.deleteRole(roleId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '删除角色失败')
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermission(ctx) {
    try {
      const { roleId } = ctx.params
      const { permissionId } = ctx.request.body

      if (!roleId || !permissionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 或 permissionId 参数')
        return
      }

      const result = await roleService.assignPermission(roleId, permissionId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '分配权限失败')
    }
  }

  /**
   * 移除角色权限
   */
  async removePermission(ctx) {
    try {
      const { roleId, permissionId } = ctx.params

      if (!roleId || !permissionId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 或 permissionId 参数')
        return
      }

      const result = await roleService.removePermission(roleId, permissionId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '移除权限失败')
    }
  }

  /**
   * 批量为角色分配权限
   */
  async assignPermissions(ctx) {
    try {
      const { roleId } = ctx.params
      const { permissionIds } = ctx.request.body

      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 或 permissionIds 参数')
        return
      }

      const result = await roleService.assignPermissions(roleId, permissionIds)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '批量分配权限失败')
    }
  }

  /**
   * 获取角色的所有用户
   */
  async getRoleUsers(ctx) {
    try {
      const { roleId } = ctx.params
      const params = {
        page: parseInt(ctx.query.page) || 1,
        limit: parseInt(ctx.query.limit) || 20,
      }

      if (!roleId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 roleId 参数')
        return
      }

      const result = await roleService.getRoleUsers(roleId, params)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取角色用户列表失败')
    }
  }
}

module.exports = new RoleController()
