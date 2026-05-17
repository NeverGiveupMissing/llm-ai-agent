// 说明：动态路由配置 - 根据后端菜单数据注册路由
// 路径：src/router/routes.js

import Layout from '@/layouts/index.vue'

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
 * 将后端菜单树转换为路由配置
 * @param {Array} menuList - 后端返回的菜单树
 * @returns {Array} 路由配置数组
 */
export function generateRoutesFromMenu(menuList) {
  const routes = []

  // ⭐ 创建根路由（Layout）
  const rootRoute = {
    path: '/',
    component: Layout,
    redirect: '/home', // 默认重定向到首页
    children: [],
  }

  menuList.forEach((menu) => {
    // 跳过没有 path 的菜单
    if (!menu.path) return

    // 构建路由对象
    const route = {
      path: menu.path.startsWith('/') ? menu.path.slice(1) : menu.path,
      name: menu.code || menu.name,
      component: null, // 稍后动态设置
      meta: {
        title: menu.name,
        icon: menu.icon,
        permission: menu.code,
        hidden: menu.hidden || false,
      },
    }

    // ⭐ 动态导入组件
    // 根据菜单的 path 或 component 字段确定组件路径
    const rawPath = menu.component || menu.path
        
    // ✅ 强力清洗路径：移除所有前导斜杠、尾随斜杠和重复斜杠，并检查是否为空
    const cleanPath = rawPath ? rawPath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/') : ''
    
    if (!cleanPath) {
      console.warn(`⚠️ 菜单 [${menu.name}] 路径无效，使用 404 页面`)
      route.component = () => import('@/views/error/404.vue')
    } else {
      try {
        console.log(`[路由生成] 菜单: ${menu.name}, 原始路径: ${rawPath}, 清洗后: ${cleanPath}`)
        route.component = () => import(`@/views/${cleanPath}/index.vue`)
      } catch (error) {
        console.warn(`️ 组件加载失败: ${cleanPath}`, error)
        route.component = () => import('@/views/error/404.vue')
      }
    }

    // 如果有子菜单，递归处理
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children.map((child) => {
        if (!child.path) return null
        
        const childRoute = {
          path: child.path.startsWith('/') ? child.path.slice(1) : child.path,
          name: child.code || child.name,
          meta: {
            title: child.name,
            icon: child.icon,
            permission: child.code,
            hidden: child.hidden || false,
          },
        }
        
        // 子节点也动态导入组件
        const childRawPath = child.component || child.path
        const childCleanPath = childRawPath ? childRawPath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/') : ''
        
        if (!childCleanPath) {
          console.warn(`️ 子菜单 [${child.name}] 路径无效，使用 404 页面`)
          childRoute.component = () => import('@/views/error/404.vue')
        } else {
          try {
            childRoute.component = () => import(`@/views/${childCleanPath}/index.vue`)
          } catch (error) {
            console.warn(`⚠️ 子组件加载失败: ${childCleanPath}`, error)
            childRoute.component = () => import('@/views/error/404.vue')
          }
        }
        
        return childRoute
      }).filter(Boolean)
    }

    rootRoute.children.push(route)
  })

  routes.push(rootRoute)
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
