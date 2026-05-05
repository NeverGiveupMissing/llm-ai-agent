/**
 * 菜单控制器 - 处理请求和响应
 */

const menuService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class MenuController {
  /**
   * 获取菜单列表（树形结构）
   */
  listMenus = asyncHandler(async (ctx) => {
    const params = {
      menu_id: ctx.query.menu_id,
      menu_name: ctx.query.menu_name,
      menu_type: ctx.query.menu_type,
      perms: ctx.query.perms,
      visible: ctx.query.visible,
      status: ctx.query.status,
    }

    const result = await menuService.getMenuList(params)
    ctx.success(result.data)
  })

  /**
   * 获取菜单详情
   */
  getMenuDetail = asyncHandler(async (ctx) => {
    const { menuId } = ctx.params

    if (!menuId) {
      throw new BadRequestError('缺少 menuId 参数')
    }

    const result = await menuService.getMenuDetail(menuId)
    ctx.success(result.data)
  })

  /**
   * 创建菜单
   */
  createMenu = asyncHandler(async (ctx) => {
    const menuData = ctx.request.body

    if (!menuData.menuName) {
      throw new BadRequestError('菜单名称不能为空')
    }

    const result = await menuService.createMenu(menuData)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新菜单
   */
  updateMenu = asyncHandler(async (ctx) => {
    const { menuId } = ctx.params
    const updates = ctx.request.body

    if (!menuId) {
      throw new BadRequestError('缺少 menuId 参数')
    }

    const result = await menuService.updateMenu(menuId, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除菜单
   */
  deleteMenu = asyncHandler(async (ctx) => {
    const { menuId } = ctx.params

    if (!menuId) {
      throw new BadRequestError('缺少 menuId 参数')
    }

    const result = await menuService.deleteMenu(menuId)
    ctx.success(null, result.message)
  })

  /**
   * 获取用户菜单树
   */
  getUserMenus = asyncHandler(async (ctx) => {
    // 从认证中间件中获取用户ID
    const user_id = ctx.state.user_id // ✅ 使用 ctx.state.user_id

    if (!user_id) {
      throw new BadRequestError('未登录或会话已过期')
    }

    const result = await menuService.getUserMenus(user_id)
    ctx.success(result.data)
  })
}

module.exports = new MenuController()
