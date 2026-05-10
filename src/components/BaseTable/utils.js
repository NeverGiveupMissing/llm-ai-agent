import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/modules/permission'

/**
 * ✅ 从 permissionStore 中提取当前路由下的按钮权限
 * @param {Object} permissionStore - Pinia 权限仓库
 * @param {Object} route - Vue Router 路由对象
 * @returns {Array} 按钮权限数组 [{ perms, label, orderNum }]
 */
export function getCurrentRouteButtons(permissionStore, route) {
  // ✅ 修复：使用 menuTree 而不是 routes
  const menuTree = permissionStore.menuTree || permissionStore.routes
  if (!menuTree || menuTree.length === 0) {
    console.log('🔵 getCurrentRouteButtons - 菜单树为空')
    return []
  }

  // console.log('🔵 getCurrentRouteButtons - 当前路由:', route.path, route.name)
  // console.log('🔵 getCurrentRouteButtons - 菜单树:', menuTree)

  // 递归查找匹配当前路由的菜单节点
  const findMenu = (menus) => {
    for (const menu of menus) {
      const menuPath = menu.path
      const menuName = menu.name || menu.routeName || menu.route_name

      // ✅ 修复：匹配 path 或 name
      if ((menuPath && menuPath === route.path) || (menuName && menuName === route.name)) {
        // console.log('✅ 找到匹配菜单:', menu)
        return menu
      }
      if (menu.children) {
        const found = findMenu(menu.children)
        if (found) return found
      }
    }
    return null
  }

  const currentNode = findMenu(menuTree)
  if (!currentNode || !currentNode.children) {
    console.log('🔴 未找到当前路由对应的菜单节点或没有子节点')
    return []
  }

  console.log('🟢 找到当前菜单节点:', currentNode)
  console.log('🟢 子节点:', currentNode.children)

  // 过滤出按钮类型 (menu_type === 'F') 并按 order_num 排序
  return currentNode.children
    .filter((item) => item.menuType === 'F' || item.menu_type === 'F')
    .sort((a, b) => {
      const orderA = a.orderNum || a.order_num || 0
      const orderB = b.orderNum || b.order_num || 0
      return orderA - orderB
    })
    .map((item) => ({
      perms: item.perms,
      label: item.menuName || item.menu_name,
      orderNum: item.orderNum || item.order_num,
    }))
}

/**
 * ✅ 智能映射规则：perms 后缀 -> CommonButton type
 * @param {string} perms - 权限标识
 * @returns {string} CommonButton 的类型
 */
export function mapPermsToType(perms) {
  if (!perms) return 'primary'

  // ✅ 完整覆盖所有业务后缀（统一使用下划线命名 snake_case）
  const suffixMap = {
    // 新增操作
    ':add': 'add', // 通用新增
    ':create': 'add', // 通用新增（兼容写法）

    // 编辑操作
    ':edit': 'edit', // 通用编辑
    ':update': 'edit', // 通用编辑（兼容写法）

    // 删除操作
    ':remove': 'delete', // 通用删除（若依标准）
    ':delete': 'delete', // 通用删除（兼容写法）

    // 查询操作
    ':query': 'query', // 通用查询
    ':search': 'query', // 搜索（兼容写法）
    ':list': 'query', // 列表查询（兼容写法）

    // 导出操作
    ':export': 'export', // 通用导出

    // 分配操作
    ':assign_role': 'assign_role', // 用户管理-分配角色（下划线）
    ':assign_permission': 'assign_role', // 角色管理-分配权限（下划线）

    // 重置操作
    ':reset_pwd': 'reset', // 重置密码
    ':reset': 'reset', // 通用重置（兼容写法）

    // 导入操作
    ':import': 'import', // 通用导入
  }

  // ✅ 从后往前匹配，确保精确匹配
  for (const [suffix, type] of Object.entries(suffixMap)) {
    if (perms.endsWith(suffix)) {
      return type
    }
  }

  return 'primary'
}
