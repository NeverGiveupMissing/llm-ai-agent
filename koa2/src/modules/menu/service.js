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
    }

    // 验证菜单类型
    const validTypes = ['M', 'C', 'F'] // M目录 C菜单 F按钮
    if (!validTypes.includes(menuData.menu_type)) {
      throw new Error('无效的菜单类型')
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
    const tree = await menuModel.getUserMenuTree(user_id)
    
    return {
      success: true,
      data: tree,
    }
  }
}

module.exports = new MenuService()
