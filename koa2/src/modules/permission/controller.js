// 说明：权限控制器 - 处理权限的 HTTP 请求

const permissionService = require('../../services/permissionService')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class PermissionController {
  /**
   * 获取权限列表
   */
  listPermissions = asyncHandler(async (ctx) => {
    const params = {
      module: ctx.query.module,
      action: ctx.query.action,
      resource: ctx.query.resource,
      keyword: ctx.query.keyword,
    }

    const result = await permissionService.listPermissions(params)

    ctx.body = ResponseUtil.success(result)
  })

  /**
   * 按模块分组获取权限
   */
  getPermissionsByModule = asyncHandler(async (ctx) => {
    const result = await permissionService.getPermissionsByModule()

    ctx.body = ResponseUtil.success(result)
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

    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 获取用户的所有权限
   */
  getUserPermissions = asyncHandler(async (ctx) => {
    const { userId } = ctx.params

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    const result = await permissionService.getUserPermissions(userId)

    ctx.body = ResponseUtil.success(result)
  })

  /**
   * 检查用户权限
   */
  checkPermission = asyncHandler(async (ctx) => {
    const { userId, permissionCode } = ctx.params

    if (!userId || !permissionCode) {
      throw new BadRequestError('缺少 userId 或 permissionCode 参数')
    }

    const result = await permissionService.checkPermission(userId, permissionCode)

    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 检查用户是否拥有任一权限
   */
  checkAnyPermission = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const { permissionCodes } = ctx.request.body

    if (!userId || !permissionCodes || !Array.isArray(permissionCodes)) {
      throw new BadRequestError('缺少 userId 或 permissionCodes 参数')
    }

    const result = await permissionService.checkAnyPermission(userId, permissionCodes)

    ctx.body = ResponseUtil.success(result.data)
  })

  /**
   * 检查用户是否拥有所有权限
   */
  checkAllPermissions = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const { permissionCodes } = ctx.request.body

    if (!userId || !permissionCodes || !Array.isArray(permissionCodes)) {
      throw new BadRequestError('缺少 userId 或 permissionCodes 参数')
    }

    const result = await permissionService.checkAllPermissions(userId, permissionCodes)

    ctx.body = ResponseUtil.success(result.data)
  })
}

module.exports = new PermissionController()
