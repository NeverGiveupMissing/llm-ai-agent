// 说明：权限状态管理 - 管理用户权限和动态菜单
// 路径：src/stores/modules/permission.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserMenus } from '@/api/menu'
import { useMenuStore } from './menu'
import router from '@/router'
import { buildMenuTreeWithFullPath, extractRoutesFromMenuTree } from '@/utils/route-helper'

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

    items.forEach((menu) => {
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
   * 登录后调用此方法（若依标准流程）
   */
  async function fetchUserPermissions() {
    console.log('🔵 [PermissionStore] fetchUserPermissions 被调用')
    console.log('🔵 [PermissionStore] 当前 isPermissionLoaded:', isPermissionLoaded.value)

    // ✅ 防止重复加载：如果已加载，直接返回
    if (isPermissionLoaded.value === true) {
      console.log('✅ [PermissionStore] 权限已加载，跳过')
      return true
    }

    // ✅ 如果正在加载，返回缓存的 Promise（防止并发请求）
    if (loadingPromise) {
      console.log('🔄 [PermissionStore] 权限加载中，等待完成...')
      return loadingPromise
    }

    // ✅ 创建新的加载 Promise
    loadingPromise = (async () => {
      try {
        // 设置加载中状态
        setLoading()

        // 获取 menuStore 实例
        const menuStore = useMenuStore()

        // ✅ 调用后端接口获取菜单树
        console.log('📡 [PermissionStore] 调用 getUserMenus 接口...')
        const menuTreeRes = await getUserMenus()

        // 设置菜单树
        if (menuTreeRes?.data) {
          setMenuTree(menuTreeRes.data)
          menuStore.setMenuFromTree(menuTreeRes.data)

          // ✅ 从菜单树中提取所有权限标识
          const permissionCodes = extractPermissionsFromMenu(menuTreeRes.data)
          setPermissions(permissionCodes)
          console.log('✅ [PermissionStore] 权限列表:', permissionCodes)

          // ✅ 动态注册路由
          await registerDynamicRoutes(menuTreeRes.data)
        } else {
          console.warn('⚠️ [PermissionStore] 菜单树数据为空')
        }

        // 设置加载完成
        isPermissionLoaded.value = true
        setLoaded()
        return true
      } catch (error) {
        console.error('❌ [PermissionStore] 获取用户权限失败:', error)
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

      // ✅ 步骤1：构建带完整路径的菜单树
      const menuTreeWithFullPath = buildMenuTreeWithFullPath(menuTree)
      console.log('✅ 菜单树路径拼接完成:', menuTreeWithFullPath)

      // ✅ 步骤2：从菜单树中提取路由配置（已包含完整路径）
      const routeConfigs = extractRoutesFromMenuTree(menuTreeWithFullPath)
      console.log(`📊 提取到 ${routeConfigs.length} 个路由配置`)

      // ✅ 步骤3：为每个路由配置加载组件并注册
      const validRoutes = []

      routeConfigs.forEach(({ path, menu }) => {
        // ✅ 使用下划线命名规范
        const {
          menu_name,
          component,
          route_name,
          icon,
          perms,
          menu_type,
          menu_id,
          is_frame,
          is_cache,
        } = menu

        // ✅ 如果是外链（is_frame === 1），不注册为路由
        if (is_frame === 1) {
          console.log(`    🔗 外链菜单 ${menu_name} 不注册为路由（path: ${path}）`)
          return
        }

        // 确定组件路径
        const componentKey = component ? component.replace(/\/index$/, '') : path.split('/').pop()
        const vueComponent = loadComponent(componentKey)

        if (!vueComponent) {
          console.error(`❌ 菜单 ${menu_name} 组件加载失败: ${componentKey}`)
          return
        }

        // 生成唯一的路由名称
        const uniqueName = route_name || path.replace(/\//g, '-').replace(/^-/, '')

        console.log(`     注册路由: ${menu_name} -> path: ${path}, name: ${uniqueName}`)

        validRoutes.push({
          path: path,
          name: uniqueName,
          component: vueComponent,
          meta: {
            title: menu_name,
            icon: icon,
            menu_id: menu_id,
            menuType: menu_type,
            perms: perms ? (Array.isArray(perms) ? perms : [perms]) : [],
            keepAlive: is_cache === 1, // ✅ 缓存控制
            isFrame: is_frame === 1, // ✅ 外链标识
          },
        })
      })

      console.log(` 有效路由数量: ${validRoutes.length}`)

      // ✅ 步骤4：将有效路由添加到 Layout 父路由下
      // 这样这些路由才会使用 BasicLayout 布局组件（包含侧边栏）
      const layoutRoute = router.getRoutes().find((route) => route.name === 'Layout')

      if (layoutRoute) {
        console.log('🔍 找到 Layout 父路由:', layoutRoute.name)

        // 将每个动态路由添加为 Layout 的子路由
        validRoutes.forEach((route) => {
          router.addRoute('Layout', route)
          console.log(`    ✅ 已添加子路由到 Layout: ${route.path}`)
        })
      } else {
        console.error('❌ 未找到 Layout 路由，将直接添加到顶层')
        // 降级方案：直接添加到顶层
        validRoutes.forEach((route) => {
          router.addRoute(route)
          console.log(`    ✅ 已添加路由到顶层: ${route.path}`)
        })
      }

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
      console.error(' 注册动态路由失败:', error)
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
      console.warn('️ [buildRoutesFromMenu] 菜单数据为空')
      return []
    }

    console.log(`🔍 [buildRoutesFromMenu] 开始处理 ${menus.length} 个菜单项`)
    console.log('🔍 第一个菜单项示例:', menus[0])

    const routes = []

    menus.forEach((menu) => {
      // ✅ 严格使用下划线命名规范
      const menu_id = menu.menu_id
      const menuName = menu.menu_name
      const menuType = menu.menu_type
      const path = menu.path
      const visible = menu.visible
      const status = menu.status
      const component = menu.component
      const routeName = menu.route_name
      const icon = menu.icon
      const perms = menu.perms
      const children = menu.children
      // ✅ 高级属性字段
      const isFrame = menu.is_frame !== undefined ? menu.is_frame : 0 // 默认非外链
      const isCache = menu.is_cache !== undefined ? menu.is_cache : 0

      // ✅ 防止循环引用导致的栈溢出
      if (menu_id && visited.has(menu_id)) {
        console.warn(`⚠️ 检测到菜单循环引用或重复 ID: ${menu_id} (${menuName})，已跳过`)
        return
      }
      if (menu_id) visited.add(menu_id)

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
        console.warn(`⚠️ 菜单 ${menuName} 无有效 path，使用后备: ${routePath}`)
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
        // ✅ 如果是外链（is_frame === 1），不注册为路由
        if (isFrame === 1) {
          console.log(`    🔗 外链菜单 ${menuName} 不注册为路由（path: ${routePath}）`)
          return
        }

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
            menu_id: menu_id,
            menuType: menuType,
            perms: perms ? (Array.isArray(perms) ? perms : [perms]) : [],
            keepAlive: isCache === 1, // ✅ 缓存控制
            isFrame: isFrame === 1, // ✅ 外链标识
          },
        })
      }
    })

    console.log(
      `📊 [buildRoutesFromMenu] 返回 ${routes.length} 个路由:`,
      routes.map((r) => ({ path: r.path, name: r.name })),
    )
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
