// 说明：动态路由配置 - 根据后端菜单数据注册路由
// 路径：src/router/routes.js

import Layout from '@/layouts/index.vue'

// ✅ 使用 Vite 的 glob 自动扫描 views 目录下所有 index.vue 文件
const modules = import.meta.glob('@/views/**/index.vue')

/**
 * 动态加载组件
 * @param {string} path - 组件路径（如 'system/user/index', 'dashboard/index'）
 * @returns {Function} Vue 组件加载函数
 */
function loadComponent(path) {
  if (!path) {
    console.warn(`⚠️ [loadComponent] path 为空`)
    return null
  }
  
  // 移除前导/尾随斜杠
  const cleanPath = path.replace(/^\/+/g, '').replace(/\/index$/, '').replace(/\/+/g, '/')
  
  // 构建完整路径：/src/views/{path}/index.vue
  const fullPath = `/src/views/${cleanPath}/index.vue`
  
  console.log(`🔍 [loadComponent] 尝试加载组件:`)
  console.log(`   - 原始 path: ${path}`)
  console.log(`   - 清理后 cleanPath: ${cleanPath}`)
  console.log(`   - 完整路径 fullPath: ${fullPath}`)
  console.log(`   - modules 中是否有: ${!!modules[fullPath]}`)
  
  if (modules[fullPath]) {
    console.log(`✅ [loadComponent] 找到组件: ${fullPath}`)
    return modules[fullPath]
  }
  
  console.warn(`⚠️ [loadComponent] 未找到组件: ${fullPath}`)
  console.warn(`📂 可用的模块路径示例:`, Object.keys(modules).slice(0, 10))
  return null
}

/**
 * 静态路由（无需权限即可访问）
 * 包括：登录页、403、404等公开页面
 */
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true, public: true },
  },
  {
    path: '/smithyuyi001',
    name: 'Smithyuyi001',
    component: () => import('@/views/smithyuyi001/index.vue'),
    meta: { hidden: true, public: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { hidden: true, public: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true, public: true },
  },
  // ✅ 关键：添加 Layout 路由，作为动态路由的容器
  // ✅ 优化：重定向逻辑交由路由守卫处理，这里仅作为占位符
  {
    path: '/',
    name: 'Layout', // ✅ 与 index.js 保持一致
    component: Layout,
    redirect: '/home', // 默认重定向，实际跳转由守卫控制
    children: [],
  },
  // ✅ 注意：通配路由 /:pathMatch(.*)* 不在这里注册
  // 它将在动态路由注册完成后最后添加，确保不会误拦截正常路由
]

/**
 * 通用路由（所有登录用户都能访问）
 * 注意：dashboard 和 profile 现在通过数据库菜单动态生成，不需要在这里定义
 * 这里只保留真正的静态路由（如分享链接等）
 */
export const commonRoutes = []

/**
 * ⚠️ 重要说明：
 * asyncRoutes 不再需要在前端写死！
 * 所有业务路由都应该从后端数据库的 permissions 表中动态获取
 * 
 * 工作流程：
 * 1. 用户登录后，调用 /permissions/menu-tree 接口获取菜单树
 * 2. 前端根据菜单树动态生成路由配置
 * 3. 使用 router.addRoute() 动态注册路由
 * 4. 侧边栏菜单也根据菜单树自动生成
 * 
 * 这样的好处：
 * ✅ 前后端分离，路由配置统一在后端管理
 * ✅ 新增菜单只需在数据库中添加，无需修改前端代码
 * ✅ 权限控制更加灵活，可以动态调整
 * ✅ 支持多租户、个性化菜单等高级功能
 */

// ❌ 删除硬编码的 asyncRoutes，改为空数组
// 实际路由会从后端动态生成
export const asyncRoutes = []

/**
 * 将后端菜单树转换为路由配置（企业级两层嵌套守卫）
 *
 * 核心设计：
 * 1. 每个一级菜单都创建一个以 Layout 为 component 的顶级路由壳
 * 2. 有子菜单的 → 子菜单作为 Layout 壳的 children，自动重定向到第一个子页面
 * 3. 无子菜单的 → 自动生成 'index' 子路由承载实际页面组件
 * 4. 彻底消除"一级路由 404，二级路由正常"的层级割裂 Bug
 *
 * @param {Array} menuList - 后端返回的菜单树（snake_case 字段）
 * @returns {Array} 路由配置数组
 */
export function generateRoutesFromMenu(menuList) {
  const routes = []

  menuList.forEach((menu) => {
    // 跳过没有 path 的菜单
    if (!menu.path) return

    // 跳过按钮类型（F）
    if (menu.menu_type === 'F') return

    // 跳过已停用的菜单
    if (String(menu.status) === '1') return

    // 跳过外链菜单（is_frame === 0 表示外链）
    if (menu.is_frame === 0) return

    // 是否有可见的子菜单（过滤掉按钮类型和隐藏/停用的子项）
    const validChildren = (menu.children || []).filter((child) => {
      if (!child.path) return false
      if (child.menu_type === 'F') return false
      if (String(child.status) === '1') return false
      if (String(child.visible) !== '0') return false
      return true
    })
    const hasChildren = validChildren.length > 0

    // 确保一级路径以 / 开头
    const routePath = menu.path.startsWith('/') ? menu.path : `/${menu.path}`
    // ✅ 修复：路由名称必须唯一且为英文，优先使用 route_name，其次使用 path 生成
    // 避免使用 menu_name（中文）作为路由名称，防止重复和国际化问题
    let routeName = menu.route_name
    if (!routeName) {
      // 将 path 转换为驼峰命名作为路由名称（如 'sys-admin' -> 'SysAdmin'）
      routeName = menu.path
        .replace(/[-_/](.)/g, (_, char) => char.toUpperCase())
        .replace(/^[a-z]/, (char) => char.toUpperCase())
    }

    // ═══════════════════════════════════════════════
    // 🔧 核心修复：所有一级菜单都使用 Layout 作为组件壳
    // ═══════════════════════════════════════════════
    const route = {
      path: routePath,
      name: routeName,
      component: Layout, // ← 顶级路由壳，保证侧边栏/顶栏正常渲染
      meta: {
        title: menu.menu_name,
        icon: menu.icon,
        perms: menu.perms ? (Array.isArray(menu.perms) ? menu.perms : [menu.perms]) : [],
        menu_id: menu.menu_id,
        menuType: menu.menu_type,
        hidden: String(menu.visible) !== '0',
        keepAlive: menu.is_cache === 1,
        isFrame: menu.is_frame === 1,
      },
      children: [],
    }

    if (hasChildren) {
      // ═══════════════════════════════════════════════
      // 场景 A：带子节点的模块壳（如"系统管理"下有用户/角色/菜单）
      // ═══════════════════════════════════════════════
      route.children = validChildren.map((child) => {
        const childRawPath = child.component || child.path
        
        // ✅ 使用 import.meta.glob 加载组件，避免 Vite 动态导入限制
        const vueComponent = loadComponent(childRawPath)

        return {
          // 子路由路径：去掉前导 /，如 "user"、"role"
          path: child.path.startsWith('/') ? child.path.slice(1) : child.path,
          name: child.route_name || child.menu_name || child.path.replace(/[^a-zA-Z0-9]/g, '_'),
          component: vueComponent || (() => import('@/views/error/404.vue')),
          meta: {
            title: child.menu_name,
            icon: child.icon,
            perms: child.perms
              ? Array.isArray(child.perms)
                ? child.perms
                : [child.perms]
              : [],
            menu_id: child.menu_id,
            menuType: child.menu_type,
            hidden: String(child.visible) !== '0',
            keepAlive: child.is_cache === 1,
            isFrame: child.is_frame === 1,
          },
        }
      })

      // 🔧 自动重定向到第一个有效子页面，防止点击一级菜单报 404
      if (route.children.length > 0) {
        route.redirect = `${route.path}/${route.children[0].path}`
      }
    } else {
      // ═══════════════════════════════════════════════
      // 场景 B：独立一级页面（如"AI 对话"，无子节点）
      // ═══════════════════════════════════════════════
      const rawPath = menu.component || menu.path
      
      // ✅ 使用 import.meta.glob 加载组件，避免 Vite 动态导入限制
      const vueComponent = loadComponent(rawPath)

      route.children = [
        {
          // 空字符串 path：直接匹配父级路径，无需重定向
          path: '',
          name: `${routeName}Index`,
          component: vueComponent || (() => import('@/views/error/404.vue')),
          meta: {
            title: menu.menu_name,
            icon: menu.icon,
            perms: menu.perms
              ? Array.isArray(menu.perms)
                ? menu.perms
                : [menu.perms]
              : [],
            menu_id: menu.menu_id,
            menuType: menu.menu_type,
            hidden: String(menu.visible) !== '0',
            keepAlive: menu.is_cache === 1,
            isFrame: menu.is_frame === 1,
          },
        },
      ]
      // 无子节点的独立页面不需要 redirect —— 空 path 子路由自动匹配
    }

    // 推入最终路由表
    routes.push(route)

    if (hasChildren) {
      console.log(
        `  📁 [generateRoutesFromMenu] 模块壳: ${menu.menu_name} → ${route.path} (重定向到 ${route.redirect})`,
      )
    } else {
      console.log(
        `  📄 [generateRoutesFromMenu] 独立页: ${menu.menu_name} → ${route.path}`,
      )
    }
  })

  console.log(`✅ [generateRoutesFromMenu] 共生成 ${routes.length} 个顶级路由`)
  return routes
}

/**
 * 根据权限过滤路由
 * @param {Array} routes - 路由配置数组
 * @param {Array} permissions - 用户权限列表
 * @returns {Array} 过滤后的路由数组
 */
export function filterRoutesByPermission(routes, permissions) {
  const accessibleRoutes = []

  routes.forEach((route) => {
    const tmp = { ...route }

    // 如果没有权限要求，直接添加
    if (!tmp.meta?.permission) {
      accessibleRoutes.push(tmp)
      return
    }

    // 检查权限
    const hasPermission = permissions.includes(tmp.meta.permission)

    if (hasPermission) {
      // 有子路由，递归过滤
      if (tmp.children) {
        tmp.children = filterRoutesByPermission(tmp.children, permissions)
        // 如果过滤后还有子路由，或者自身有权限，就添加
        if (tmp.children.length > 0 || !tmp.meta?.permission) {
          accessibleRoutes.push(tmp)
        }
      } else {
        accessibleRoutes.push(tmp)
      }
    }
  })

  return accessibleRoutes
}
