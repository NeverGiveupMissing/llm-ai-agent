// 说明：权限状态管理 - 管理用户权限和动态菜单
// 路径：src/stores/modules/permission.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserMenus } from '@/api/menu'
import { useMenuStore } from './menu'
import router from '@/router'

// ✅ Promise 缓存，防止并发请求
let loadingPromise = null

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
  
  // ✅ 修复：移除前导斜杠，避免路径变成 //profile
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // 构建完整路径：/src/views/{path}/index.vue
  const fullPath = `/src/views/${cleanPath}/index.vue`
  
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

/**
 * 从菜单树中提取所有权限标识
 * @param {Array} menus - 菜单树
 * @returns {Array} 权限标识数组
 */
function extractPermissionsFromMenu(menus) {
  const permissions = []
  
  const traverse = (items) => {
    if (!items || items.length === 0) return
    
    items.forEach(menu => {
      // 兼容驼峰和下划线
      const perms = menu.perms
      
      // 如果有权限标识，添加到数组
      if (perms) {
        permissions.push(perms)
      }
      
      // 递归处理子菜单
      if (menu.children && menu.children.length > 0) {
        traverse(menu.children)
      }
    })
  }
  
  traverse(menus)
  
  console.log('🔍 提取到的权限标识:', permissions)
  return permissions
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

  // 权限加载状态：true=已加载, false=未加载, 'loading'=加载中
  const isPermissionLoaded = ref(false)

  // Getters
  const isLoaded = computed(() => isPermissionLoaded.value === true)
  const isLoading = computed(() => isPermissionLoaded.value === 'loading')
  const isNotLoaded = computed(() => isPermissionLoaded.value === false)

  // 设置加载状态
  function setLoading() {
    isPermissionLoaded.value = 'loading'
  }

  // 设置加载完成
  function setLoaded() {
    isPermissionLoaded.value = true
  }

  // 设置加载失败
  function setFailed() {
    isPermissionLoaded.value = false
  }

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
    // ✅ 防止重复加载：如果已加载，直接返回
    if (isPermissionLoaded.value === true) {
      console.log('✅ 权限已加载，跳过')
      return true
    }
    
    // ✅ 如果正在加载，返回缓存的 Promise（防止并发请求）
    if (loadingPromise) {
      console.log('🔄 权限加载中，等待完成...')
      return loadingPromise
    }
    
    // ✅ 创建新的加载 Promise
    loadingPromise = (async () => {
      try {
        // 设置加载中状态
        setLoading()
        
        // 获取 menuStore 实例
        const menuStore = useMenuStore()
        
        // ✅ 不使用缓存，每次刷新都从后端获取最新数据
        console.log('📡 从后端获取菜单和权限...')
        const menuTreeRes = await getUserMenus()

        // 设置菜单树
        if (menuTreeRes?.data) {
          setMenuTree(menuTreeRes.data)
          menuStore.setMenuFromTree(menuTreeRes.data)
          console.log('✅ 菜单树加载成功:', menuTreeRes.data)
          
          // ✅ 从菜单树中提取所有权限标识
          const permissionCodes = extractPermissionsFromMenu(menuTreeRes.data)
          setPermissions(permissionCodes)
          console.log('✅ 权限列表加载成功:', permissionCodes)
          
          // ✅ 动态注册路由
          await registerDynamicRoutes(menuTreeRes.data)
        }

        isPermissionLoaded.value = true
        setLoaded()
        return true
      } catch (error) {
        console.error('❌ 获取用户权限失败:', error)
        isPermissionLoaded.value = false
        setFailed()
        throw error
      } finally {
        // ✅ 清除 Promise 缓存，允许下次重新加载
        loadingPromise = null
      }
    })()
    
    return loadingPromise
  }
  
  /**
   * 后台异步刷新权限缓存
   * ❌ 已禁用：避免并发请求导致空数据问题
   * 用户退出重新登录即可获取最新数据
   */
  async function refreshPermissionsCache() {
    // 暂不启用，避免并发请求问题
    // try {
    //   console.log('🔄 后台刷新权限缓存...')
    //   const [menuTreeRes, permissionsRes] = await Promise.all([
    //     getMenuTree(),
    //     getMyPermissions(),
    //   ])
    //   
    //   if (menuTreeRes?.data) {
    //     localStorage.setItem('menuTree', JSON.stringify(menuTreeRes.data))
    //   }
    //   
    //   if (permissionsRes?.data) {
    //     localStorage.setItem('permissions', JSON.stringify(permissionsRes.data))
    //   }
    //   
    //   console.log('✅ 权限缓存刷新完成')
    // } catch (error) {
    //   console.warn('⚠️ 后台刷新权限缓存失败:', error)
    // }
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
      
      // ✅ 关键：在所有动态路由添加完成后，最后添加通配路由
      // 这样通配路由会在所有有效路由之后匹配，不会误拦截正常路由
      
      // 先删除旧的通配路由（防止重复注册）
      if (router.hasRoute('CatchAll')) {
        router.removeRoute('CatchAll')
        console.log('🗑️ 已删除旧的通配路由')
      }
      
      // 注册新的通配路由
      router.addRoute({
        path: '/:pathMatch(.*)*',
        name: 'CatchAll',
        redirect: '/404',
        meta: { hidden: true },
      })
      
      console.log(`✅ 成功注册 ${validRoutes.length} 个动态路由 + 通配路由`)
    } catch (error) {
      console.error('❌ 注册动态路由失败:', error)
      throw error
    }
  }

  /**
   * 从菜单树构建路由配置
   * @param {Array} menus - 菜单树（可能是 snake_case 或 camelCase）
   * @param {String} parentPath - 父级路径（用于调试）
   * @param {Set} visited - 已访问的菜单 ID 集合（防止循环引用）
   * @returns {Array} 路由配置数组
   */
  function buildRoutesFromMenu(menus, parentPath = '', visited = new Set()) {
    if (!menus || menus.length === 0) {
      console.warn('⚠️ [buildRoutesFromMenu] 菜单数据为空')
      return []
    }

    console.log(` [buildRoutesFromMenu] 开始处理 ${menus.length} 个菜单项`)
    console.log('🔍 第一个菜单项示例:', menus[0])

    const routes = []

    menus.forEach((menu) => {
      // ✅ 兼容驼峰和下划线命名
      const menuId = menu.menuId || menu.menu_id
      const menuName = menu.menuName || menu.menu_name
      const menuType = menu.menuType || menu.menu_type
      const path = menu.path
      const visible = menu.visible
      const status = menu.status
      const component = menu.component
      const routeName = menu.routeName || menu.route_name
      const icon = menu.icon
      const perms = menu.perms
      const children = menu.children

      // ✅ 防止循环引用导致的栈溢出
      if (menuId && visited.has(menuId)) {
        console.warn(`⚠️ 检测到菜单循环引用或重复 ID: ${menuId} (${menuName})，已跳过`)
        return
      }
      if (menuId) visited.add(menuId)

      // ✅ 过滤按钮类型、隐藏菜单、停用菜单
      if (menuType === 'F') return
      if (visible === '1') return
      if (status === '1') return

      // 安全 path 处理
      let routePath = ''
      if (path && path !== '/' && path !== '') {
        routePath = path.startsWith('/') ? path.slice(1) : path
      } else {
        routePath = (menuName || 'unknown').toLowerCase().replace(/\s+/g, '-')
        console.warn(`️ 菜单 ${menuName} 无有效 path，使用后备: ${routePath}`)
      }

      // 目录类型 (M) - 不注册为路由，仅用于菜单树结构
      if (menuType === 'M') {
        console.log(`    ℹ️ 目录 ${menuName} 不注册为路由，仅用于菜单结构`)
        // 不将目录注册为路由，只处理其子菜单
        if (children?.length) {
          const childRoutes = buildRoutesFromMenu(children, parentPath, visited)
          routes.push(...childRoutes)
        }
        return
      }

      // 菜单类型 (C)
      if (menuType === 'C') {
        const componentKey = component ? component.replace(/\/index$/, '') : path
        const vueComponent = loadComponent(componentKey)
        if (!vueComponent) {
          console.error(`❌ 菜单 ${menuName} 组件加载失败: ${componentKey}`)
          return
        }
        const uniqueName = routeName || `${parentPath.replace(/\//g, '-')}-${menuName}`
        console.log(`    📄 菜单 ${menuName} -> path: ${routePath}, name: ${uniqueName}`)
        routes.push({
          path: routePath,
          name: uniqueName,
          component: vueComponent,
          meta: {
            title: menuName,
            icon: icon,
            menuId: menuId,
            menuType: menuType,
            perms: perms ? (Array.isArray(perms) ? perms : [perms]) : [],
          },
        })
      }
    })

    console.log(`📊 [buildRoutesFromMenu] 返回 ${routes.length} 个路由:`, routes.map(r => ({ path: r.path, name: r.name })))
    return routes
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
    
    // ✅ 不再使用缓存，所以不需要清除 localStorage
    // localStorage.removeItem('menuTree')
    // localStorage.removeItem('permissions')
    console.log('🗑️ 已重置权限状态')
    
    // ✅ 移除 Layout 下的所有动态子路由
    // 通过重新创建 Layout 路由来清除所有子路由
    if (router.hasRoute('LayoutRoot')) {
      router.removeRoute('LayoutRoot')
      router.addRoute({
        path: '/',
        name: 'LayoutRoot',
        component: () => import('@/layouts/index.vue'),
        redirect: '/login', // ✅ 重置后重定向到登录页
        children: [],
      })
    }
    
    // ✅ 移除通配路由（如果存在）
    if (router.hasRoute('CatchAll')) {
      router.removeRoute('CatchAll')
      console.log('🗑️ 已清除通配路由')
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
    // Getters
    isLoaded,
    isLoading,
    isNotLoaded,
    // Computed
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Actions
    setPermissions,
    setRoles,
    setMenuTree,
    setLoading,
    setLoaded,
    setFailed,
    fetchUserPermissions,
    filterRoutesByPermission,
    generateRoutes,
    resetPermission,
  }
})