/**
 * 菜单服务层 - 处理业务逻辑
 */

// 导入 model.js 以获取 JSDoc 类型定义
require('./model')

const menuModel = require('./model')

class MenuService {
  /**
   * 获取菜单列表（树形结构）
   * @param {Object} params - 查询参数
   * @returns {Promise<{success: boolean, data: SysMenu[]}>}
   */
  async getMenuList(params = {}) {
    const tree = await menuModel.getMenuTree(params)
    
    return {
      success: true,
      data: tree,
    }
  }

  /**
   * 获取菜单详情
   * @param {number} menu_id - 菜单ID
   * @returns {Promise<{success: boolean, data: SysMenu}>}
   */
  async getMenuDetail(menu_id) {
    const menu = await menuModel.getById(menu_id)
    
    if (!menu) {
      throw new Error('菜单不存在')
    }

    return {
      success: true,
      data: menu,
    }
  }

  /**
   * 创建菜单
   * @param {Object} menuData - 菜单数据（下划线格式，由中间件自动转换）
   * @returns {Promise<{success: boolean, data: SysMenu, message: string}>}
   */
  async createMenu(menuData) {
    // 验证父菜单是否存在
    if (menuData.parent_id && menuData.parent_id !== 0) {
      const parent = await menuModel.getById(menuData.parent_id)
      if (!parent) {
        throw new Error('父菜单不存在')
      }

      // ✅ 路由安全校验：禁止在已有菜单(C)下创建子节点
      if (parent.menu_type === 'C') {
        throw new Error('不能选择菜单作为父菜单，导航层级只能是：目录 -> 菜单')
      }
    }

    // ✅ 自动识别菜单类型：根据 component 字段是否为空
    if (!menuData.component || menuData.component.trim() === '') {
      menuData.menu_type = 'M' // 目录
    } else {
      menuData.menu_type = 'C' // 菜单
    }

    // 目录类型不能有 component
    if (menuData.menu_type === 'M') {
      menuData.component = null
    }

    const menu = await menuModel.create(menuData)

    return {
      success: true,
      data: menu,
      message: '菜单创建成功',
    }
  }

  /**
   * 更新菜单
   * @param {number} menu_id - 菜单ID
   * @param {Object} updates - 更新数据（下划线格式）
   * @returns {Promise<{success: boolean, data: SysMenu, message: string}>}
   */
  async updateMenu(menu_id, updates) {
    const menu = await menuModel.getById(menu_id)
    
    if (!menu) {
      throw new Error('菜单不存在')
    }

    // 不允许将菜单设置为自己的子菜单
    if (updates.parent_id === parseInt(menu_id)) {
      throw new Error('不能将菜单设置为自己的子菜单')
    }

    // 检查是否会导致循环引用
    if (updates.parent_id && updates.parent_id !== 0) {
      await this.checkCircularReference(menu_id, updates.parent_id)

      // ✅ 路由安全校验：禁止在已有菜单(C)下创建子节点
      const parent = await menuModel.getById(updates.parent_id)
      if (parent && parent.menu_type === 'C') {
        throw new Error('不能选择菜单作为父菜单，导航层级只能是：目录 -> 菜单')
      }
    }

    // ✅ 自动识别菜单类型：根据 component 字段是否为空
    if (updates.component !== undefined) {
      if (!updates.component || updates.component.trim() === '') {
        updates.menu_type = 'M' // 目录
        updates.component = null
      } else {
        updates.menu_type = 'C' // 菜单
      }
    }

    const updatedMenu = await menuModel.update(menu_id, updates)

    return {
      success: true,
      data: updatedMenu,
      message: '菜单更新成功',
    }
  }

  /**
   * 删除菜单
   * @param {number} menu_id - 菜单ID
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteMenu(menu_id) {
    const menu = await menuModel.getById(menu_id)
    
    if (!menu) {
      throw new Error('菜单不存在')
    }

    try {
      await menuModel.delete(menu_id)
      return {
        success: true,
        message: '菜单删除成功',
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * 检查循环引用
   */
  async checkCircularReference(menu_id, parentId) {
    // 如果parentId是menu_id的子节点，则会产生循环引用
    const checkParent = async (currentId, targetId) => {
      if (currentId === targetId) {
        throw new Error('不能选择子菜单作为父菜单，否则会产生循环引用')
      }
      
      const menu = await menuModel.getById(currentId)
      if (menu && menu.parent_id !== 0) {
        await checkParent(menu.parent_id, targetId)
      }
    }

    await checkParent(parentId, parseInt(menu_id))
  }

  /**
   * 获取用户菜单树
   * @param {number} user_id - 用户ID
   * @returns {Promise<{success: boolean, data: SysMenu[]}>}
   */
  async getUserMenus(user_id) {
    console.log('🔍 [MenuService] 获取用户菜单树, user_id:', user_id)
    
    // ✅ 管理员权限判断：如果是 admin 角色，直接返回所有菜单
    const isAdmin = await this.checkIsAdmin(user_id)
    if (isAdmin) {
      console.log('👑 [MenuService] 管理员用户，返回所有菜单（跳过角色关联）')
      // 获取所有状态正常的菜单
      const allMenus = await menuModel.getAllMenus()
      const tree = this.buildMenuTree(allMenus)
      
      // ✅ 多表聚合查询：挂载 sys_button 按钮到菜单树（管理员获取所有按钮）
      await menuModel.attachButtonsToTree(tree, user_id, isAdmin)
      
      return {
        success: true,
        data: tree,
      }
    }
    
    // 普通用户：通过角色关联查询菜单
    const tree = await menuModel.getUserMenuTree(user_id)
    
    // ✅ 多表聚合查询：挂载 sys_button 按钮到菜单树
    await menuModel.attachButtonsToTree(tree, user_id, isAdmin)
    
    return {
      success: true,
      data: tree,
    }
  }

  /**
   * 检查用户是否为超级管理员
   * @param {number} user_id - 用户ID
   * @returns {Promise<boolean>}
   */
  async checkIsAdmin(user_id) {
    try {
      const { pool } = require('../../config/db')
      const query = `
        SELECT COUNT(*) as count
        FROM sys_user_role ur
        INNER JOIN sys_role r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1::int
          AND r.status = '0'
          AND (r.role_key = 'admin' OR r.role_key LIKE '%admin%')
      `
      const result = await pool.query(query, [user_id])
      return parseInt(result.rows[0].count) > 0
    } catch (error) {
      console.error('❌ [MenuService] 检查管理员权限失败:', error.message)
      return false
    }
  }

  /**
   * 构建树形结构（辅助方法）
   * @param {Array} menus - 菜单列表
   * @param {number} parentId - 父ID
   * @returns {Array} 树形结构
   */
  buildMenuTree(menus, parentId = 0) {
    const tree = []
    
    for (const menu of menus) {
      // ✅ 关键修复：PostgreSQL 返回的 bigint 字段是字符串类型，需使用 == 或 Number() 转换
      if (Number(menu.parent_id) === Number(parentId)) {
        const children = this.buildMenuTree(menus, menu.menu_id)
        const node = { ...menu }
        if (children.length > 0) {
          node.children = children
        }
        tree.push(node)
      }
    }
    
    return tree
  }
}

module.exports = new MenuService()
