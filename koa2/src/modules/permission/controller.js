/**
 * 权限控制器
 * 位置：koa2/src/modules/permission/controller.js
 */

const permissionService = require('./service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class PermissionController {
  /**
   * 获取权限列表
   */
  listPermissions = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.limit) || 100,
      module: ctx.query.module,
    }

    const result = await permissionService.listPermissions(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(
      result.data,
      result.total,
      result.page,
      result.limit
    )
  })

  /**
   * 获取权限树形结构
   */
  getPermissionTree = asyncHandler(async (ctx) => {
    const result = await permissionService.getPermissionTree()
    ctx.success(result.data)
  })

  /**
   * 按模块分组获取权限
   */
  getPermissionsByModule = asyncHandler(async (ctx) => {
    const result = await permissionService.getPermissionsByModule()
    ctx.success(result.data)
  })

  /**
   * 获取权限详情
   */
  getPermissionDetail = asyncHandler(async (ctx) => {
    const { permissionId } = ctx.params

    if (!permissionId) {
      throw new BadRequestError('缺少 permissionId 参数')
    }

    const result = await permissionService.getPermissionDetail(permissionId)
    ctx.success(result.data)
  })

  /**
   * 创建权限
   */
  createPermission = asyncHandler(async (ctx) => {
    const { name, code, type, parentId, path, icon, sortOrder, description } = ctx.request.body

    if (!name || !code) {
      throw new BadRequestError('权限名称和编码不能为空')
    }

    const result = await permissionService.createPermission({
      name,
      code,
      type: type || 'button',
      parentId: parentId || null,
      path,
      icon,
      sortOrder: sortOrder || 0,
      description,
    })

    ctx.success(result.data, result.message)
  })

  /**
   * 更新权限
   */
  updatePermission = asyncHandler(async (ctx) => {
    const { permissionId } = ctx.params
    const updates = ctx.request.body

    if (!permissionId) {
      throw new BadRequestError('缺少 permissionId 参数')
    }

    const result = await permissionService.updatePermission(permissionId, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除权限
   */
  deletePermission = asyncHandler(async (ctx) => {
    const { permissionId } = ctx.params

    if (!permissionId) {
      throw new BadRequestError('缺少 permissionId 参数')
    }

    const result = await permissionService.deletePermission(permissionId)
    ctx.success(null, result.message)
  })

  /**
   * 获取当前用户的菜单树
   */
  getUserMenuTree = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId

    if (!userId) {
      throw new BadRequestError('未登录')
    }

    const result = await permissionService.getUserMenuTree(userId)
    ctx.success(result.data)
  })

  /**
   * 获取用户的所有权限
   */
  getUserPermissions = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId

    if (!userId) {
      throw new BadRequestError('未登录')
    }

    const result = await permissionService.getUserPermissions(userId)
    ctx.success(result.data)
  })

  /**
   * 检查用户权限
   */
  checkPermission = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId
    const { permissionCode } = ctx.request.body

    if (!userId) {
      throw new BadRequestError('未登录')
    }

    if (!permissionCode) {
      throw new BadRequestError('缺少 permissionCode 参数')
    }

    const result = await permissionService.checkPermission(userId, permissionCode)
    ctx.success(result.data)
  })
}

module.exports = new PermissionController()
