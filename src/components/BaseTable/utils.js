/**
 * BaseTable 工具函数
 * @description 处理按钮权限获取、映射等逻辑，支持按需加载 sys_button 数据
 * @author System
 * @date 2026-05-13
 */
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/modules/permission'
import { useUserStore } from '@/stores/modules/user'
import { checkIsAdmin } from '@/utils/permission'
import { getButtonsByMenuId } from '@/api/button'

/**
 * 按钮展现位置枚举
 * 0-工具栏, 1-行内, 2-搜索, 3-隐藏
 */
export const ButtonLocation = {
  TOOLBAR: '0',
  ROW: '1',
  SEARCH: '2',
  HIDDEN: '3',
}

/**
 * ✅ 从 permissionStore 中提取当前路由下的按钮权限
 * @param {Object} permissionStore - Pinia 权限仓库
 * @param {Object} route - Vue Router 路由对象
 * @returns {Object} 按位置分组的按钮权限 { toolbar: [], row: [], search: [] }
 */
export async function getCurrentRouteButtons(permissionStore, route) {
  const menuTree = permissionStore.menuTree || permissionStore.routes
  if (!menuTree || menuTree.length === 0) {
    console.log('getCurrentRouteButtons - 菜单树为空')
    return { toolbar: [], row: [], search: [] }
  }

  // 递归查找匹配当前路由的菜单节点（先递归子菜单，确保找到最深层的匹配）
  const findMenu = (menus, depth = 0) => {
    const indent = '  '.repeat(depth)

    for (const menu of menus) {
      const rawPath = menu.path || ''
      const trimmedMenuPath = rawPath.replace(/^\/+|\/+$/g, '')
      const trimmedRoutePath = (route.path || '').replace(/^\/+|\/+$/g, '')
      const menuName = menu.name || menu.routeName || menu.route_name

      // ✅ 先递归查找子菜单（确保找到最深层的匹配菜单）
      if (menu.children && menu.children.length > 0 && menu.menu_type !== 'F') {
        console.log(
          `${indent}[findMenu] 检查菜单: ${menu.menu_name}, path: ${rawPath}, type: ${menu.menu_type}`,
        )
        const found = findMenu(menu.children, depth + 1)
        if (found) {
          console.log(`${indent}[findMenu] 在子菜单中找到: ${found.menu_name}`)
          return found
        }
      }

      // ✅ 再匹配当前菜单
      const pathMatch = trimmedMenuPath && trimmedRoutePath.endsWith(trimmedMenuPath)
      const nameMatch = menuName && menuName === route.name

      console.log(
        `${indent}[findMenu] 匹配检查 - ${menu.menu_name}: pathMatch=${pathMatch} (menu: "${trimmedMenuPath}" vs route: "${trimmedRoutePath}"), nameMatch=${nameMatch} (menu: "${menuName}" vs route: "${route.name}")`,
      )

      if (pathMatch || nameMatch) {
        console.log(
          `${indent}[findMenu] ✅ 找到匹配菜单: ${menu.menu_name}, menu_id: ${menu.menu_id}`,
        )
        return menu
      }
    }
    return null
  }

  const currentNode = findMenu(menuTree)
  if (!currentNode) {
    console.log('未找到当前路由对应的菜单节点, route.path:', route.path)
    return { toolbar: [], row: [], search: [] }
  }

  console.log('找到当前菜单节点:', currentNode.menu_name, 'menu_id:', currentNode.menu_id)

  // ✅ 管理员特权：直接返回当前菜单的所有按钮
  const userStore = useUserStore()
  const isAdmin = checkIsAdmin(userStore.roles)

  if (isAdmin) {
    console.log('BaseTable [Admin] 管理员特权：按需加载当前菜单的所有按钮')
  }

  // ✅ 统一处理按钮数据的辅助函数
  const processButtons = (buttons) => {
    const result = buttons
      .filter((btn) => {
        if (isAdmin) return true
        return btn.status === '0' || !btn.status
      })
      .sort((a, b) => {
        const orderA = a.order_num || a.orderNum || 0
        const orderB = b.order_num || b.orderNum || 0
        return orderA - orderB
      })
      .map((btn) => ({
        perms: btn.perms,
        label: btn.button_name || btn.label || btn.name,
        orderNum: btn.order_num || btn.orderNum || 0,
        show_location: btn.show_location || btn.location || ButtonLocation.ROW, // 默认行内
      }))

    // 按位置分组（支持多选逗号分隔，如 "0,1"）
    return {
      toolbar: result.filter((btn) => {
        const loc = btn.show_location || ''
        return loc.includes(ButtonLocation.TOOLBAR)
      }),
      row: result.filter((btn) => {
        const loc = btn.show_location || ''
        return loc.includes(ButtonLocation.ROW)
      }),
      search: result.filter((btn) => {
        const loc = btn.show_location || ''
        return loc.includes(ButtonLocation.SEARCH)
      }),
    }
  }

  // ✅ 优先从 buttons 数组获取（如果后端仍返回了 buttons）
  if (currentNode.buttons && Array.isArray(currentNode.buttons) && currentNode.buttons.length > 0) {
    console.log('从本地 buttons 数组获取按钮:', currentNode.buttons.length, '个')
    return processButtons(currentNode.buttons)
  }

  // ✅ 按需从后端加载当前菜单的按钮
  if (currentNode.menu_id) {
    try {
      console.log('按需从后端加载菜单按钮, menu_id:', currentNode.menu_id)
      const res = await getButtonsByMenuId(currentNode.menu_id)
      const buttons = res.data || res || []
      console.log('后端返回按钮数:', buttons.length)
      return processButtons(buttons)
    } catch (error) {
      console.warn('按需加载按钮失败:', error.message)
    }
  }

  // ✅ 兼容旧数据：从 children 中查找 F 类型节点（默认行内）
  if (currentNode.children) {
    console.log('从 children 子节点获取按钮')
    const buttons = currentNode.children
      .filter((item) => {
        const isButton = item.menu_type === 'F' || item.menuType === 'F'
        if (isAdmin) return isButton
        return isButton && (item.status === '0' || !item.status)
      })
      .sort((a, b) => {
        const orderA = a.orderNum || a.order_num || 0
        const orderB = b.orderNum || b.order_num || 0
        return orderA - orderB
      })
      .map((item) => ({
        // ✅ 按钮权限来自 item.buttons
        perms: item.perms,
        label: item.menuName || item.menu_name,
        orderNum: item.orderNum || item.order_num,
        show_location: ButtonLocation.ROW, // 兼容旧数据，默认行内
      }))
    return {
      toolbar: [],
      row: buttons,
      search: [],
    }
  }

  return { toolbar: [], row: [], search: [] }
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
