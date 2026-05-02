// 说明：权限状态管理 - 管理用户权限和动态菜单
// 路径：src/stores/modules/permission.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMenuTree, getMyPermissions } from '@/api/permission'
import { useMenuStore } from './menu'
import router from '@/router'

// ✅ 使用 Vite 的 glob 自动扫描 views 目录下所有 index.vue 文件
const modules = import.meta.glob('@/views/**/index.vue')

/**
 * 动态加载组件
 * 根据数据库中的 path 自动匹配对应的 Vue 组件
 * @param {string} path - 路由路径（如 'dashboard', 'user-management'）
 * @returns {Function} Vue 组件
 */
function loadComponent(path) {
  if (!path) return null
  
  // 构建完整路径：/src/views/{path}/index.vue
  const fullPath = `/src/views/${path}/index.vue`
  
  if (modules[fullPath]) {
    return modules[fullPath]
  }
  
  console.warn(`⚠️ 未找到组件: ${fullPath}`)
  console.warn(`💡 请检查：`)  
  console.warn(`   1. 文件夹名称是否与数据库 path 一致（推荐 kebab-case）`)
  console.warn(`   2. 组件文件是否为 index.vue`)
  console.warn(`   3. 路径深度是否为 views/{path}/index.vue`)
  
  return null
}

export const usePermissionStore = defineStore('permission', () => {
  // 用户权限列表（从后端获取）
  const permissions = ref([])

  // 用户角色列表
  const roles = ref([])

  // 用户菜单树（从后端获取）
  const menuTree = ref([])

  // 动态路由（根据权限过滤后的路由）
  const dynamicRoutes = ref([])

  // 是否已生成动态路由
  const isRoutesGenerated = ref(false)

  // 是否已加载权限数据
  const isPermissionLoaded = ref(false)

  // 计算属性：检查是否拥有某个权限
  const hasPermission = computed(() => {
    return (permissionCode) => {
      if (!permissionCode) return true
      return permissions.value.includes(permissionCode)
    }
  })

  // 计算属性：检查是否拥有任一权限
  const hasAnyPermission = computed(() => {
    return (permissionCodes) => {
      if (!permissionCodes || permissionCodes.length === 0) return true
      return permissionCodes.some((code) => permissions.value.includes(code))
    }
  })

  // 计算属性：检查是否拥有所有权限
  const hasAllPermissions = computed(() => {
    return (permissionCodes) => {
      if (!permissionCodes || permissionCodes.length === 0) return true
      return permissionCodes.every((code) => permissions.value.includes(code))
    }
  })

  // 设置权限列表
  function setPermissions(permissionList) {
    permissions.value = permissionList || []
  }

  // 设置角色列表
  function setRoles(roleList) {
    roles.value = roleList || []
  }

  // 设置菜单树
  function setMenuTree(menuList) {
    menuTree.value = menuList || []
  }

  /**
   * 从后端获取用户权限和菜单数据
   * 登录后调用此方法
   */
  async function fetchUserPermissions() {
    try {
      // 获取 menuStore 实例
      const menuStore = useMenuStore()

      // 并行请求菜单树和权限列表
      const [menuTreeRes, permissionsRes] = await Promise.all([
        getMenuTree(),
        getMyPermissions(),
      ])

      // 设置菜单树
      // ✅ 拦截器返回完整对象 { code, message, data }
      if (menuTreeRes?.data) {
        setMenuTree(menuTreeRes.data)
        // 将菜单树传递给 menuStore，生成菜单配置
        menuStore.setMenuFromTree(menuTreeRes.data)
        console.log('✅ 菜单树加载成功:', menuTreeRes.data)
        
        // ✅ 动态注册路由
        await registerDynamicRoutes(menuTreeRes.data)
      }

      // 设置权限列表（提取权限 code）
      // ✅ 拦截器返回完整对象 { code, message, data }
      if (permissionsRes?.data) {
        // permissionsRes.data 是权限数组
        const permissionCodes = permissionsRes.data.map((p) => p.code)
        setPermissions(permissionCodes)
        console.log('✅ 权限列表加载成功:', permissionCodes)
      }

      isPermissionLoaded.value = true
      return true
    } catch (error) {
      console.error('❌ 获取用户权限失败:', error)
      isPermissionLoaded.value = false
      throw error
    }
  }

  /**
   * 动态注册路由
   * @param {Array} menuTree - 菜单树数据
   */
  async function registerDynamicRoutes(menuTree) {
    try {
      console.log('🛣️ 开始注册动态路由...')
      
      const routes = buildRoutesFromMenu(menuTree)
      
      // ✅ 关键：过滤掉 path: null 的父菜单（它们只用于侧边栏菜单显示，不作为路由）
      const validRoutes = routes.filter(route => route.path && route.path !== null)
      
      console.log(`📊 构建的路由: ${routes.length} 个，有效路由: ${validRoutes.length} 个（已过滤 ${routes.length - validRoutes.length} 个父菜单）`)
      
      // 将有效路由添加到 Layout 的 children 中
      validRoutes.forEach((route) => {
        router.addRoute('Layout', route)
      })
      
      // ✅ 关键：在所有动态路由添加完成后，最后添加 404 路由
      // 这样 404 路由会在所有有效路由之后匹配
      router.addRoute({
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/error/404.vue'),
      })
      
      console.log(`✅ 成功注册 ${validRoutes.length} 个动态路由 + 404 路由`)
    } catch (error) {
      console.error('❌ 注册动态路由失败:', error)
      throw error
    }
  }

  /**
   * 从菜单树构建路由配置
   * @param {Array} menus - 菜单树
   * @returns {Array} 路由配置数组
   */
  function buildRoutesFromMenu(menus) {
    if (!menus || menus.length === 0) return []

    return menus
      .flatMap((menu) => {
        // ✅ 如果有 path，注册为路由
        if (menu.path) {
          const routePath = menu.path.startsWith('/') ? menu.path : `/${menu.path}`
          
          // ✅ 动态加载组件，无需维护映射表
          const component = loadComponent(menu.path)
          
          // 如果组件加载失败，警告但跳过
          if (!component) {
            console.warn(`⚠️ 未找到组件: @/views/${menu.path}/index.vue`)
            return null
          }

          const route = {
            path: routePath,
            name: menu.name || menu.path,
            component,
            meta: {
              title: menu.name,
              icon: menu.icon,
            },
          }

          // 递归处理子菜单
          if (menu.children && menu.children.length > 0) {
            route.children = buildRoutesFromMenu(menu.children)
          }

          return route
        } else {
          // ✅ 父菜单（无 path），将其子菜单提升到顶层
          if (menu.children && menu.children.length > 0) {
            console.log(`  父菜单 "${menu.name}" 的子菜单将提升到顶层注册`)
            return buildRoutesFromMenu(menu.children)
          }
          return null
        }
      })
      .flat() // ✅ 扁平化数组
      .filter(Boolean) // 过滤掉 null
  }

  // 根据权限过滤路由
  function filterRoutesByPermission(routes, accessRoutes = []) {
    routes.forEach((route) => {
      // 如果路由没有 meta.permission，则不需要权限验证
      if (!route.meta?.permission) {
        accessRoutes.push(route)
        return
      }

      // 检查权限
      const hasAuth = hasPermission.value(route.meta.permission)
      if (hasAuth) {
        // 有权限，添加该路由
        accessRoutes.push(route)
      }
    })
    return accessRoutes
  }

  // 生成动态路由
  function generateRoutes(asyncRoutes) {
    const accessRoutes = filterRoutesByPermission(asyncRoutes)
    dynamicRoutes.value = accessRoutes
    isRoutesGenerated.value = true
    return accessRoutes
  }

  // 重置权限状态
  function resetPermission() {
    permissions.value = []
    roles.value = []
    menuTree.value = []
    dynamicRoutes.value = []
    isRoutesGenerated.value = false
    isPermissionLoaded.value = false
    
    // ✅ 移除 Layout 下的所有动态子路由
    // 通过重新创建 Layout 路由来清除所有子路由
    if (router.hasRoute('Layout')) {
      router.removeRoute('Layout')
      router.addRoute({
        path: '/',
        name: 'Layout',
        component: () => import('@/layouts/index.vue'),
        redirect: '/login', // ✅ 重置后重定向到登录页
        children: [],
      })
    }
    
    // ✅ 移除 404 路由（如果存在）
    if (router.hasRoute('NotFound')) {
      router.removeRoute('NotFound')
    }
    
    // 同时重置 menuStore
    const menuStore = useMenuStore()
    menuStore.resetMenu()
  }

  return {
    // State
    permissions,
    roles,
    menuTree,
    dynamicRoutes,
    isRoutesGenerated,
    isPermissionLoaded,
    // Computed
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Actions
    setPermissions,
    setRoles,
    setMenuTree,
    fetchUserPermissions,
    filterRoutesByPermission,
    generateRoutes,
    resetPermission,
  }
})