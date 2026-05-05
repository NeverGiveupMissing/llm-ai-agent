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

  console.log('🔵 getCurrentRouteButtons - 当前路由:', route.path, route.name)
  console.log('🔵 getCurrentRouteButtons - 菜单树:', menuTree)

  // 递归查找匹配当前路由的菜单节点
  const findMenu = (menus) => {
    for (const menu of menus) {
      const menuPath = menu.path
      const menuName = menu.name || menu.routeName || menu.route_name

      console.log('🔍 检查菜单:', {
        menuPath,
        menuName,
        routePath: route.path,
        routeName: route.name,
      })

      // ✅ 修复：匹配 path 或 name
      if ((menuPath && menuPath === route.path) || (menuName && menuName === route.name)) {
        console.log('✅ 找到匹配菜单:', menu)
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

  // ✅ 完整覆盖所有业务后缀
  const suffixMap = {
    ':add': 'add',
    ':create': 'add',
    ':edit': 'edit',
    ':update': 'edit',
    ':remove': 'delete',
    ':delete': 'delete',
    ':query': 'query',
    ':search': 'query',
    ':list': 'query',
    ':export': 'export',
    ':assign_role': 'assign_role',
    ':assign': 'assign_role',
    ':reset_pwd': 'reset',
    ':reset': 'reset',
    ':import': 'import',
  }

  // ✅ 从后往前匹配，确保精确匹配
  for (const [suffix, type] of Object.entries(suffixMap)) {
    if (perms.endsWith(suffix)) {
      return type
    }
  }

  return 'primary'
}
