/**
 * 路由路径拼接工具
 * 用于将菜单树中的相对路径拼接为完整的路由路径
 */

/**
 * 构建完整的菜单树（带完整路径）
 * @param {Array} menuTree - 原始菜单树数据
 * @returns {Array} 处理后的菜单树，每个节点包含 full_path
 */
export function buildMenuTreeWithFullPath(menuTree) {
  if (!menuTree || !Array.isArray(menuTree)) {
    return []
  }

  // 递归处理每个菜单项
  return processMenuNodes(menuTree, '')
}

/**
 * 递归处理菜单节点，拼接完整路径
 * @param {Array} nodes - 当前层级的菜单节点
 * @param {String} parentPath - 父级完整路径
 * @returns {Array} 处理后的节点数组
 */
function processMenuNodes(nodes, parentPath) {
  if (!nodes || nodes.length === 0) {
    return []
  }

  return nodes.map((node) => {
    // ✅ 使用下划线命名规范
    const { menu_id, menu_name, menu_type, path, parent_id, children } = node

    // 计算当前节点的完整路径
    let fullPath = ''
    
    if (path && path !== '') {
      // 如果有 path，则拼接父路径
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      
      if (parentPath && parentPath !== '') {
        // 非顶级菜单，拼接父路径
        fullPath = `${parentPath}/${cleanPath}`
      } else {
        // 顶级菜单，直接使用 path
        fullPath = `/${cleanPath}`
      }
    } else {
      // 没有 path 的节点（如目录类型），fullPath 为空
      fullPath = ''
    }

    // 创建新节点，保留所有原始字段
    const processedNode = {
      ...node,
      full_path: fullPath, // 添加完整路径字段
    }

    // 递归处理子节点
    if (children && children.length > 0) {
      processedNode.children = processMenuNodes(children, fullPath)
    }

    return processedNode
  })
}

/**
 * 从菜单树中提取路由配置（带完整路径）
 * @param {Array} menuTree - 已处理的菜单树（带 full_path）
 * @returns {Array} 路由配置数组
 */
export function extractRoutesFromMenuTree(menuTree) {
  if (!menuTree || !Array.isArray(menuTree)) {
    return []
  }

  const routes = []
  
  menuTree.forEach((menu) => {
    // ✅ 使用下划线命名规范
    const { menu_type, full_path, children } = menu

    // 跳过按钮类型
    if (menu_type === 'F') {
      return
    }

    // 如果是目录类型（M），不注册为路由，只处理子节点
    if (menu_type === 'M') {
      if (children && children.length > 0) {
        const childRoutes = extractRoutesFromMenuTree(children)
        routes.push(...childRoutes)
      }
      return
    }

    // 菜单类型（C），注册为路由
    if (menu_type === 'C' && full_path) {
      routes.push({
        path: full_path,
        menu,
      })
    }
  })

  return routes
}

/**
 * 获取菜单项的跳转路径
 * @param {Object} menu - 菜单项（包含 full_path）
 * @returns {String} 跳转路径
 */
export function getMenuLink(menu) {
  // ✅ 使用下划线命名规范
  return menu.full_path || menu.path || ''
}
