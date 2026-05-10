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
      page_num: parseInt(ctx.query.page_num) || 1,
      page_size: parseInt(ctx.query.page_size) || 10,
      role_name: ctx.query.role_name,
      role_key: ctx.query.role_key,
      status: ctx.query.status,
    }

    const result = await roleService.listRoles(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page_num, result.page_size)
  })

  /**
   * 获取角色详情
   */
  getRoleDetail = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRoleDetail(role_id)
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
    const { role_id } = ctx.params
    const updates = ctx.request.body

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.updateRole(role_id, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新角色状态
   */
  updateRoleStatus = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params
    const { status } = ctx.request.body

    if (!role_id || !status) {
      throw new BadRequestError('缺少 role_id 或 status 参数')
    }

    const result = await roleService.updateRoleStatus(role_id, status)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除角色
   */
  deleteRole = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.deleteRole(role_id)
    ctx.success(null, result.message)
  })

  /**
   * 批量删除角色
   */
  batchDeleteRoles = asyncHandler(async (ctx) => {
    const { role_ids } = ctx.request.body

    if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      throw new BadRequestError('缺少 role_ids 参数或参数格式错误')
    }

    const result = await roleService.batchDeleteRoles(role_ids)
    ctx.success(null, result.message)
  })

  /**
   * 为角色分配单个权限
   */
  assignPermission = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params
    const { permissionId } = ctx.request.body

    if (!role_id || !permissionId) {
      throw new BadRequestError('缺少 role_id 或 permissionId 参数')
    }

    const result = await roleService.assignPermission(role_id, permissionId)
    ctx.success(result.data, result.message)
  })

  /**
   * 批量为角色分配权限
   */
  assignPermissions = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params
    const { permissionIds } = ctx.request.body

    if (!role_id || !permissionIds) {
      throw new BadRequestError('缺少 role_id 或 permissionIds 参数')
    }

    const result = await roleService.assignPermissions(role_id, permissionIds)
    ctx.success(result.data, result.message)
  })

  /**
   * 移除角色权限
   */
  removePermission = asyncHandler(async (ctx) => {
    const { role_id, permissionId } = ctx.params

    if (!role_id || !permissionId) {
      throw new BadRequestError('缺少 role_id 或 permissionId 参数')
    }

    const result = await roleService.removePermission(role_id, permissionId)
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的所有权限
   */
  getRolePermissions = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRolePermissions(role_id)
    ctx.success(result.data)
  })

  /**
   * 获取角色的所有用户
   */
  getRoleUsers = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params
    const params = {
      page_num: parseInt(ctx.query.page_num) || 1,
      page_size: parseInt(ctx.query.page_size) || 10,
    }

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRoleUsers(role_id, params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page_num, result.page_size)
  })

  /**
   * 获取角色的菜单权限 ID 列表
   */
  getRolemenu_ids = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRolemenu_ids(role_id)
    ctx.success(result.data)
  })

  /**
   * 保存角色的菜单权限（覆盖更新）
   */
  saveRoleMenus = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params
    const { menu_ids } = ctx.request.body

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    if (!Array.isArray(menu_ids)) {
      throw new BadRequestError('menu_ids 必须为数组')
    }

    const result = await roleService.saveRoleMenus(role_id, menu_ids)
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的接口权限路径列表
   */
  getRoleApiPaths = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRoleApiPaths(role_id)
    ctx.success(result.data)
  })

  /**
   * 保存角色的接口权限（覆盖更新）
   */
  saveRoleApis = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params
    const { api_paths } = ctx.request.body

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    if (!Array.isArray(api_paths)) {
      throw new BadRequestError('api_paths 必须为数组')
    }

    const result = await roleService.saveRoleApis(role_id, api_paths)
    ctx.success(null, result.message)
  })
}

module.exports = new RoleController()
