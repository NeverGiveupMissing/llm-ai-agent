/**
 * 权限控制器 - 基于若依菜单权限体系
 * 位置：koa2/src/modules/permission/controller.js
 * ✅ 已废弃旧的 permissions 表相关功能，仅保留权限验证接口
 */

const permissionService = require('./service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class PermissionController {
  /**
   * 获取当前用户的所有权限标识
   */
  getUserPermissions = asyncHandler(async (ctx) => {
    const user_id = ctx.state.user_id

    if (!user_id) {
      throw new BadRequestError('未登录')
    }

    const result = await permissionService.getUserPermissions(user_id)
    ctx.success(result.data)
  })

  /**
   * 检查用户权限
   */
  checkPermission = asyncHandler(async (ctx) => {
    const user_id = ctx.state.user_id
    const { permissionCode } = ctx.request.body

    if (!user_id) {
      throw new BadRequestError('未登录')
    }

    if (!permissionCode) {
      throw new BadRequestError('缺少 permissionCode 参数')
    }

    const result = await permissionService.checkPermission(user_id, permissionCode)
    ctx.success(result.data)
  })
}

module.exports = new PermissionController()
