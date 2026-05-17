/**
 * 按钮控制器 - 处理请求和响应
 * @description 管理 sys_button 表中的按钮权限数据，提供 RESTful API 接口
 * @author System
 * @date 2026-05-13
 */

const buttonService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class ButtonController {
  /**
   * 获取按钮列表（分页）
   */
  listButtons = asyncHandler(async (ctx) => {
    // 接收下划线命名参数（前后端统一使用下划线）
    const button_name = ctx.query.button_name
    // ✅ 显式转换为整数类型（HTTP 查询参数默认都是字符串）
    const parent_id = ctx.query.parent_id !== undefined && ctx.query.parent_id !== ''
      ? parseInt(ctx.query.parent_id, 10)
      : undefined
    const perms = ctx.query.perms
    const status = ctx.query.status
    const show_location = ctx.query.show_location
    const page_num = parseInt(ctx.query.page_num) || 1
    const page_size = parseInt(ctx.query.page_size) || 10

    const params = {
      button_name,
      parent_id,
      perms,
      status,
      show_location,
      page: page_num,
      page_size,
    }

    const result = await buttonService.getButtonList(params)

    // 使用统一的分页响应方法（与接口管理保持一致）
    ctx.pageSuccess(result.data, result.total, result.page, result.limit)
  })

  /**
   * 获取按钮详情
   */
  getButtonDetail = asyncHandler(async (ctx) => {
    const { button_id } = ctx.params

    if (!button_id) {
      throw new BadRequestError('缺少 button_id 参数')
    }

    const result = await buttonService.getButtonDetail(button_id)
    ctx.success(result.data)
  })

  /**
   * 创建按钮
   */
  createButton = asyncHandler(async (ctx) => {
    const buttonData = ctx.request.body

    if (!buttonData.button_name) {
      throw new BadRequestError('按钮名称不能为空')
    }

    const result = await buttonService.createButton(buttonData)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新按钮
   */
  updateButton = asyncHandler(async (ctx) => {
    const { button_id } = ctx.params
    const updates = ctx.request.body

    if (!button_id) {
      throw new BadRequestError('缺少 button_id 参数')
    }

    const result = await buttonService.updateButton(button_id, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除按钮
   */
  deleteButton = asyncHandler(async (ctx) => {
    const { button_id } = ctx.params

    if (!button_id) {
      throw new BadRequestError('缺少 button_id 参数')
    }

    const result = await buttonService.deleteButton(button_id)
    ctx.success(null, result.message)
  })

  /**
   * 批量删除按钮
   */
  batchDeleteButtons = asyncHandler(async (ctx) => {
    const { ids } = ctx.request.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('请选择要删除的按钮')
    }

    const result = await buttonService.batchDeleteButtons(ids)
    ctx.success(null, result.message)
  })

  /**
   * 根据菜单ID获取所有按钮
   */
  getButtonsByMenuId = asyncHandler(async (ctx) => {
    const { menu_id } = ctx.params

    if (!menu_id) {
      throw new BadRequestError('缺少 menu_id 参数')
    }

    const result = await buttonService.getButtonsByMenuId(menu_id)
    ctx.success(result.data)
  })
}

module.exports = new ButtonController()
