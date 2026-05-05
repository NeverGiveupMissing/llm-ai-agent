/**
 * 角色控制器
 * 位置：koa2/src/modules/role/controller.js
 */

const roleService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class RoleController {
  /**
   * 获取角色列表
   */
  listRoles = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.pageSize) || 10,
      keyword: ctx.query.keyword,
    }

    const result = await roleService.listRoles(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(
      result.data,
      result.total,
      result.page,
      result.limit
    )
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
    ctx.success(result.data)
  })

  /**
   * 创建角色
   */
  createRole = asyncHandler(async (ctx) => {
    const { name, displayName, description, isSystem } = ctx.request.body

    if (!name || !displayName) {
      throw new BadRequestError('角色名称和显示名称不能为空')
    }

    const result = await roleService.createRole({
      name,
      displayName,
      description,
      isSystem: isSystem || false,
    })

    ctx.success(result.data, result.message)
  })

  /**
   * 更新角色
   */
  updateRole = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const updates = ctx.request.body

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.updateRole(roleId, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新角色状态
   */
  updateRoleStatus = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const { status } = ctx.request.body

    if (!roleId || !status) {
      throw new BadRequestError('缺少 roleId 或 status 参数')
    }

    const result = await roleService.updateRoleStatus(roleId, status)
    ctx.success(result.data, result.message)
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
    ctx.success(null, result.message)
  })

  /**
   * 为角色分配单个权限
   */
  assignPermission = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const { permissionId } = ctx.request.body

    if (!roleId || !permissionId) {
      throw new BadRequestError('缺少 roleId 或 permissionId 参数')
    }

    const result = await roleService.assignPermission(roleId, permissionId)
    ctx.success(result.data, result.message)
  })

  /**
   * 批量为角色分配权限
   */
  assignPermissions = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const { permissionIds } = ctx.request.body

    if (!roleId || !permissionIds) {
      throw new BadRequestError('缺少 roleId 或 permissionIds 参数')
    }

    const result = await roleService.assignPermissions(roleId, permissionIds)
    ctx.success(result.data, result.message)
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
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的所有权限
   */
  getRolePermissions = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.getRolePermissions(roleId)
    ctx.success(result.data)
  })

  /**
   * 获取角色的所有用户
   */
  getRoleUsers = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.pageSize) || 10,
    }

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.getRoleUsers(roleId, params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(
      result.data,
      result.total,
      result.page,
      result.limit
    )
  })

  /**
   * 获取角色的菜单权限 ID 列表
   */
  getRoleMenuIds = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    const result = await roleService.getRoleMenuIds(roleId)
    ctx.success(result.data)
  })

  /**
   * 保存角色的菜单权限（覆盖更新）
   */
  saveRoleMenus = asyncHandler(async (ctx) => {
    const { roleId } = ctx.params
    const { menuIds } = ctx.request.body

    if (!roleId) {
      throw new BadRequestError('缺少 roleId 参数')
    }

    if (!Array.isArray(menuIds)) {
      throw new BadRequestError('menuIds 必须为数组')
    }

    const result = await roleService.saveRoleMenus(roleId, menuIds)
    ctx.success(null, result.message)
  })
}

module.exports = new RoleController()
