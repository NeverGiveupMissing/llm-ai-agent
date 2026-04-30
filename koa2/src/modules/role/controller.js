// 说明：角色控制器 - 处理角色的 HTTP 请求

const roleService = require('../../services/roleService')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class RoleController {
  /**
   * 创建角色
   */
  createRole = asyncHandler(async (ctx) => {
    const { name, displayName, description, isSystem } = ctx.request.body

    if (!name) {
      throw new BadRequestError('角色名称不能为空')
    }

    const result = await roleService.createRole({
      name,
      displayName,
      description,
      isSystem,
    })

    ctx.body = ResponseUtil.success(result.data, result.message)
  })

  /**
   * 获取角色列表
   */
  listRoles = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.limit) || 20,
      keyword: ctx.query.keyword,
    }

    const result = await roleService.listRoles(params)

    ctx.body = ResponseUtil.success(result)
  })

  /**
   * 获取角色详情
   */
  getRoleDetail = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.getRoleDetail(roleId)

    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 更新角色信息
   */
  updateRole = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const updates = ctx.request.body

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.updateRole(roleId, updates)

    ctx.body = ResponseUtil.success(result.data, result.message)
  })

  /**
   * 删除角色
   */
  deleteRole = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.deleteRole(roleId)

    ctx.body = ResponseUtil.success(null, result.message)
  })

  /**
   * 为角色分配权限
   */
  assignPermission = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const { permissionId } = ctx.request.body

    if (!roleId || !permissionId) {
      throw new BadRequestError('缺少 roleId 或 permissionId 参数')
    }

    const result = await roleService.assignPermission(roleId, permissionId)

    ctx.body = ResponseUtil.success(null, result.message)
  })

  /**
   * 移除角色权限
   */
  removePermission = asyncHandler(async (ctx) => {
    const { roleId, permissionId } = ctx.params

    if (!roleId || !permissionId) {
      throw new BadRequestError('缺少 roleId 或 permissionId 参数')
    }

    const result = await roleService.removePermission(roleId, permissionId)

    ctx.body = ResponseUtil.success(null, result.message)
  })

  /**
   * 批量为角色分配权限
   */
  assignPermissions = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const { permissionIds } = ctx.request.body

    if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
      throw new BadRequestError('缺少 roleId 或 permissionIds 参数')
    }

    const result = await roleService.assignPermissions(roleId, permissionIds)

    ctx.body = ResponseUtil.success(null, result.message)
  })

  /**
   * 获取角色的所有用户
   */
  getRoleUsers = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.limit) || 20,
    }

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.getRoleUsers(roleId, params)

    ctx.body = ResponseUtil.success(result)
  })
}

module.exports = new RoleController()
