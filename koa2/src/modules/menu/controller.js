/**
 * 菜单控制器 - 处理请求和响应
 */

const menuService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')
const { exportToExcel } = require('../../utils/excel-exporter')

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
    const { menu_id } = ctx.params

    if (!menu_id) {
      throw new BadRequestError('缺少 menu_id 参数')
    }

    const result = await menuService.getMenuDetail(menu_id)
    ctx.success(result.data)
  })

  /**
   * 创建菜单
   */
  createMenu = asyncHandler(async (ctx) => {
    const menuData = ctx.request.body

    if (!menuData.menu_name) {
      throw new BadRequestError('菜单名称不能为空')
    }

    const result = await menuService.createMenu(menuData)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新菜单
   */
  updateMenu = asyncHandler(async (ctx) => {
    const { menu_id } = ctx.params
    const updates = ctx.request.body

    if (!menu_id) {
      throw new BadRequestError('缺少 menu_id 参数')
    }

    const result = await menuService.updateMenu(menu_id, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除菜单
   */
  deleteMenu = asyncHandler(async (ctx) => {
    const { menu_id } = ctx.params

    if (!menu_id) {
      throw new BadRequestError('缺少 menu_id 参数')
    }

    const result = await menuService.deleteMenu(menu_id)
    ctx.success(null, result.message)
  })

  /**
   * 获取用户菜单树
   */
  getUserMenus = asyncHandler(async (ctx) => {
    // 从认证中间件中获取用户 ID
    const user_id = ctx.state.user_id // ✅ 使用 ctx.state.user_id
  
    if (!user_id) {
      throw new BadRequestError('未登录或会话已过期')
    }
  
    const result = await menuService.getUserMenus(user_id)
    
    // ✅ 调试日志：确认数据确实返回了
    console.log('📤 [Controller] Returning menu data:', result.data?.length || 0, 'items')
      
    // ✅ 防止 304 缓存响应，确保每次请求都返回最新数据
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    ctx.set('Pragma', 'no-cache')
    ctx.set('Expires', '0')
      
    // ✅ 显式返回标准格式：{ code: 200, data: [], message: 'success' }
    // 即使 data 为空数组，也要返回，不返回 null
    ctx.success(result.data || [])
  })

  /**
   * 导出菜单数据为 Excel
   */
  exportMenus = asyncHandler(async (ctx) => {
    const params = {
      menu_name: ctx.query.menu_name,
      menu_type: ctx.query.menu_type,
      status: ctx.query.status,
    }

    const result = await menuService.getMenuList(params)
    const menus = result.data || []

    // ✅ 将树形结构扁平化（递归展开所有子菜单）
    const flatMenus = this.flattenMenuTree(menus)

    // 定义表头
    const headers = [
      { header: '菜单ID', key: 'menu_id', width: 10 },
      { header: '菜单名称', key: 'menu_name', width: 20 },
      { header: '父菜单ID', key: 'parent_id', width: 12 },
      { header: '显示排序', key: 'order_num', width: 10 },
      { header: '路由地址', key: 'path', width: 25 },
      { header: '组件路径', key: 'component', width: 25 },
      { header: '权限标识', key: 'perms', width: 25 },
      { header: '菜单类型', key: 'menu_type', width: 12 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建时间', key: 'create_time', width: 20 },
    ]

    // 格式化数据
    const data = flatMenus.map((menu) => ({
      ...menu,
      menu_type: this.getMenuTypeText(menu.menu_type),
      status: menu.status === '0' ? '正常' : '停用',
      create_time: menu.create_time
        ? new Date(menu.create_time).toLocaleString('zh-CN')
        : '',
    }))

    // 导出 Excel
    await exportToExcel(ctx, {
      filename: 'menu',
      sheetName: '菜单列表',
      headers,
      data,
    })
  })

  /**
   * 将树形菜单结构扁平化为平面列表
   * @param {Array} tree - 树形菜单数组
   * @returns {Array} 平面菜单数组
   */
  flattenMenuTree(tree) {
    const result = []
    
    const traverse = (nodes) => {
      for (const node of nodes) {
        // 创建一个新对象，排除 children 字段
        const { children, ...menuWithoutChildren } = node
        result.push(menuWithoutChildren)
        
        // 递归处理子节点
        if (children && children.length > 0) {
          traverse(children)
        }
      }
    }
    
    traverse(tree)
    return result
  }

  /**
   * 获取菜单类型文本
   */
  getMenuTypeText(menuType) {
    const typeMap = {
      M: '目录',
      C: '菜单',
      F: '按钮',
    }
    return typeMap[menuType] || menuType
  }
}

module.exports = new MenuController()
