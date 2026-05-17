// 说明：权限状态管理 - 管理用户权限和动态菜单
// 路径：src/stores/modules/permission.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserMenus } from '@/api/menu'
import { useMenuStore } from './menu'
import router from '@/router'
import { buildMenuTreeWithFullPath, extractRoutesFromMenuTree } from '@/utils/route-helper'
import { getRoleAllPermissions, getRoleButtonIds } from '@/api/role'
import { useUserStore } from './user'
// ✅ 使用离散 API 替代 naive-ui 的直接导入
import { message } from '@/utils/http/message'

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

export const usePermissionStore = defineStore('permission', () => {
  // 路由控制通过 menuTree
  const permissions = ref([])

  // 用户按钮权限列表（从 sys_button 获取，perms 字符串数组，用于按钮级权限控制）
  const buttonPermissions = ref([])

  // ✅ 角色 ID 数组（数字类型，直接来自后端 login/getUserInfo 接口）
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

  // 计算属性：检查是否拥有某个按钮权限
  const hasPermission = computed(() => {
    return (permissionCode) => {
      if (!permissionCode) return true
      // ✅ 通配符支持：如果权限列表包含 *:*:* 或包含具体权限，则放行
      if (buttonPermissions.value.includes('*:*:*')) return true
      return buttonPermissions.value.includes(permissionCode)
    }
  })

  // 计算属性：检查是否拥有任一按钮权限
  const hasAnyPermission = computed(() => {
    return (permissionCodes) => {
      if (!permissionCodes || permissionCodes.length === 0) return true
      // ✅ 通配符支持：如果权限列表包含 *:*:*，直接放行
      if (buttonPermissions.value.includes('*:*:*')) return true
      return permissionCodes.some((code) => buttonPermissions.value.includes(code))
    }
  })

  // 计算属性：检查是否拥有所有权限
  const hasAllPermissions = computed(() => {
    return (permissionCodes) => {
      if (!permissionCodes || permissionCodes.length === 0) return true
      // ✅ 通配符支持：如果权限列表包含 *:*:*，直接放行
      if (permissions.value.includes('*:*:*')) return true
      return permissionCodes.every((code) => permissions.value.includes(code))
    }
  })

  // 设置权限列表（菜单权限，用于路由控制）
  function setPermissions(permissionList) {
    permissions.value = permissionList || []
  }

  // 设置按钮权限列表（用于按钮级权限控制）
  function setButtonPermissions(permissionList) {
    buttonPermissions.value = permissionList || []
    // ✅ 持久化到 localStorage，防止刷新页面丢失
    try {
      localStorage.setItem('buttonPermissions', JSON.stringify(buttonPermissions.value))
    } catch (error) {
      console.warn('⚠️ [PermissionStore] 保存按钮权限到 localStorage 失败:', error)
    }
  }

  // 设置角色列表
  function setRoles(roleList) {
    // ✅ 确保角色 ID 为数字类型
    if (roleList && Array.isArray(roleList)) {
      roles.value = roleList.map((role) => {
        if (role && typeof role === 'object' && role.role_id !== undefined) {
          return { ...role, role_id: parseInt(role.role_id, 10) }
        }
        return role
      })
    } else {
      roles.value = roleList || []
    }
  }

  // 设置菜单树
  function setMenuTree(menuList) {
    menuTree.value = menuList || []
  }

  /**
   * 检查用户是否为超级管理员
   * @returns {Boolean}
   */
  function checkIsAdmin() {
    const userStore = useUserStore()
    const userRoles = userStore.userInfo?.roles || userStore.roles || []

    if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
      return false
    }

    return userRoles.some((role) => {
      // 支持字符串格式：['admin', 'common']
      if (typeof role === 'string') {
        return role.toLowerCase().includes('admin')
      }
      // 支持对象格式：[{ roleKey: 'admin' }, { role_key: 'superAdmin' }]
      else if (role && typeof role === 'object') {
        const roleKey = role.roleKey || role.role_key || ''
        return roleKey.toLowerCase().includes('admin')
      }
      return false
    })
  }

  /**
   * 从后端获取用户权限和菜单数据
   *
   * - permissions: 空数组（菜单不再存储 perms，路由控制通过 menuTree）
   * - buttonPermissions: 从登录接口获取（sys_button.perms）
   * - roles: 数字数组（role_ids），来自 userStore
   *
   * ✅ 异步解耦：菜单加载与按钮权限加载分开，确保即使按钮权限请求失败，菜单和基础路由也能正常注册
   */
  async function fetchUserPermissions() {
    // ✅ 防止重复加载：如果已加载，直接返回
    if (isPermissionLoaded.value === true) {
      console.log('✅ [PermissionStore] 权限已加载，跳过')
      // ✅ 从 localStorage 恢复按钮权限（如果 API 获取失败）
      try {
        const cached = localStorage.getItem('buttonPermissions')
        if (cached && buttonPermissions.value.length === 0) {
          buttonPermissions.value = JSON.parse(cached)
          console.log(
            '✅ [PermissionStore] 从缓存恢复按钮权限:',
            buttonPermissions.value.length,
            '个',
          )
        }
      } catch (error) {
        console.warn('⚠️ [PermissionStore] 恢复按钮权限缓存失败:', error)
      }
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

        // 获取 menuStore 和 userStore 实例
        const menuStore = useMenuStore()
        const userStore = useUserStore()

        // ✅ 步骤1：加载菜单树（关键路径，必须成功）
        console.log('📡 [PermissionStore] 步骤1: 调用 getUserMenus 接口（仅 M/C 菜单）...')
        let menuTreeData = []

        // ✅ 管理员权限判断：如果是 admin 角色，通过后端接口获取所有菜单
        const isAdmin = checkIsAdmin()
        if (isAdmin) {
          console.log('👑 [PermissionStore] 管理员用户，通过后端接口获取所有菜单')
          // 管理员也需要调用后端接口，但后端会返回所有菜单（跳过角色关联）
          try {
            const menuTreeRes = await getUserMenus()

            if (menuTreeRes?.data && Array.isArray(menuTreeRes.data)) {
              menuTreeData = menuTreeRes.data
              console.log('✅ [PermissionStore] 管理员获取到菜单数:', menuTreeData.length)
            } else {
              console.warn('⚠️ [PermissionStore] 管理员菜单数据为空')
              menuTreeData = []
            }

            setMenuTree(menuTreeData)
            menuStore.setMenuFromTree(menuTreeData)

            // ✅ 设置通配符权限
            setPermissions(['*:*:*'])
            setButtonPermissions(['*:*:*'])
            console.log('✅ [PermissionStore] 管理员权限设置完成')
          } catch (error) {
            console.error('❌ [PermissionStore] 管理员菜单加载失败:', error.message)
            menuTreeData = []
            setMenuTree([])
            setPermissions([])
            setButtonPermissions([])
            message.warning('管理员菜单加载失败，将使用默认配置')
          }
        } else {
          // 普通用户：通过后端接口获取菜单
          try {
            const menuTreeRes = await getUserMenus()

            // ✅ 防御逻辑1：检查是否为字符串响应（后端报错时可能返回 HTML 或纯文本）
            if (typeof menuTreeRes === 'string') {
              console.error(
                ' [PermissionStore] 后端返回了非法的字符串响应:',
                menuTreeRes.substring(0, 200),
              )
              message.error('后端服务异常，请检查控制台日志')
              menuTreeData = []
            }
            // ✅ 防御逻辑2：检查响应是否为 null 或 undefined
            else if (menuTreeRes === null || menuTreeRes === undefined) {
              console.error(' [PermissionStore] 后端返回了空响应')
              message.error('后端响应为空，请刷新页面重试')
              menuTreeData = []
            } else {
              // ✅ 详细调试：查看响应结构
              console.log(
                '🔍 [PermissionStore] getUserMenus 完整响应:',
                JSON.stringify(menuTreeRes, null, 2),
              )
              console.log('🔍 [PermissionStore] response.data:', menuTreeRes?.data)
              console.log('🔍 [PermissionStore] response.data 类型:', typeof menuTreeRes?.data)
              console.log(
                '🔍 [PermissionStore] response.data 是否为数组:',
                Array.isArray(menuTreeRes?.data),
              )

              // ✅ 增强容错：确保 data 是数组
              if (menuTreeRes?.data) {
                if (Array.isArray(menuTreeRes.data)) {
                  menuTreeData = menuTreeRes.data
                } else {
                  // ⚠️ data 不是数组，降级处理
                  console.warn('⚠️ [PermissionStore] 菜单数据不是数组，已初始化为空数组')
                  console.warn('⚠️ 原始数据类型:', typeof menuTreeRes.data)
                  console.warn('⚠️ 原始数据值:', menuTreeRes.data)
                  menuTreeData = []
                }
              } else {
                console.warn('⚠️ [PermissionStore] 菜单树数据为空')
                console.warn('⚠️ 可能原因:')
                console.warn('  1. 后端返回空数组 []')
                console.warn('  2. 后端返回 null 或 undefined')
                console.warn('  3. 响应格式不正确（缺少 data 字段）')
                console.warn('  4. 用户没有分配角色或菜单')
                console.warn('  5. 304 缓存响应导致数据未更新')
              }
            }

            // ✅ 即使 menuTreeData 为空数组，也要继续执行（降级策略）
            setMenuTree(menuTreeData)
            menuStore.setMenuFromTree(menuTreeData)

            setPermissions([])

            if (menuTreeData.length > 0) {
              console.log(
                '✅ [PermissionStore] 菜单树数据（前2个）:',
                JSON.stringify(menuTreeData.slice(0, 2), null, 2),
              )
            }
          } catch (error) {
            console.error('❌ [PermissionStore] 菜单加载失败:', error.message)
            console.error('❌ [PermissionStore] 错误堆栈:', error.stack)
            console.error('❌ [PermissionStore] 错误详情:', error)
            console.error(
              '❌ [PermissionStore] 错误状态码:',
              error.status || error.response?.status,
            )
            console.error('❌ [PermissionStore] 错误响应数据:', error.response?.data)

            // ✅ 降级处理：使用空数组，不中断执行
            menuTreeData = [] // 确保即使 catch 也有值
            setMenuTree([])
            setPermissions([])
            message.warning('菜单加载失败，将使用默认配置')
          }
        }

        // ✅ 步骤2：动态注册路由（基于已加载的菜单）
        if (menuTreeData.length > 0) {
          console.log('📡 [PermissionStore] 步骤2: 开始注册动态路由...')
          try {
            await registerDynamicRoutes(menuTreeData)
            console.log('✅ [PermissionStore] 动态路由注册完成')
          } catch (error) {
            console.error('❌ [PermissionStore] 路由注册失败:', error.message)
            message.error('路由注册失败，请刷新页面重试')
          }
        }

        // ✅ 步骤3：加载按钮权限（非关键路径，失败不影响菜单和路由）
        console.log('📡 [PermissionStore] 步骤3: 加载按钮权限...')
        try {
          // 从 userStore 获取按钮权限（后端已从 sys_button 聚合 perms）
          const buttonPerms = userStore.userInfo?.permissions || userStore.permissions || []
          if (buttonPerms && buttonPerms.length > 0) {
            setButtonPermissions(buttonPerms)
            console.log('✅ [PermissionStore] 从 userStore 获取按钮权限:', buttonPerms.length, '个')
          } else {
            // 降级方案：通过 role_ids 获取按钮权限 ID 列表
            const roleIds = userStore.userInfo?.role_ids || userStore.role_ids || []
            if (roleIds.length > 0) {
              // ✅ 修正参数传递：确保传递 Integer ID 而不是字符串
              const roleId = parseInt(roleIds[0], 10)
              if (!isNaN(roleId)) {
                const buttonRes = await getRoleButtonIds(roleId)
                const buttonIds = buttonRes?.data || []

                console.log('📌 [PermissionStore] 获取到按钮 ID 列表:', buttonIds)
                // 由于无法从树中提取 perms，保持使用 userStore 的聚合权限
              } else {
                console.warn('⚠️ [PermissionStore] role_id 转换失败:', roleIds[0])
              }
            } else {
              console.warn('⚠️ [PermissionStore] 用户没有 role_ids，按钮权限为空')
              setButtonPermissions([])
            }
          }
        } catch (error) {
          console.error('❌ [PermissionStore] 获取按钮权限失败:', error.message)
          // ✅ 离散 API 提示，不阻塞 Promise 链
          if (!error._403Handled && !error._500Handled) {
            message.warning('按钮权限加载失败，部分功能可能受限')
          }
          // ✅ 降级处理：使用空数组
          setButtonPermissions([])
        }

        // ✅ 设置加载完成（无论按钮权限是否成功，菜单和路由已注册）
        isPermissionLoaded.value = true
        setLoaded()
        console.log('✅ [PermissionStore] 权限加载完成，isLoaded:', isPermissionLoaded.value)
        return true
      } catch (error) {
        console.error('❌ [PermissionStore] 权限加载异常:', error)
        // ✅ 异常处理：给一个默认的空数组，并完成路由注册
        isPermissionLoaded.value = true // ✅ 标记为已加载，避免无限重试
        setPermissions([])
        setButtonPermissions([])
        setMenuTree([])
        setLoaded()

        // ✅ 离散 API 提示，不阻塞 Promise 链
        if (error.status === 403 || error.status === 500) {
          message.warning('权限接口异常，已使用默认配置')
        } else {
          message.error('权限加载失败，请刷新页面重试')
        }

        return true // ✅ 返回 true，不中断执行流
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

        // ✅ 如果是外链（is_frame === 0），不注册为路由
        // 数据库定义：is_frame = 0 是外链，is_frame = 1 是内部路由
        if (is_frame === 0) {
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

        console.log(`    📄 注册路由: ${menu_name} -> path: ${path}, name: ${uniqueName}`)

        // ✅ 关键修复：作为 Layout 子路由注册时，path 必须是相对路径（去掉前导 /）
        // 这样 Vue Router 才能正确拼接成 /dashboard 而不是 /
        const childPath = path.startsWith('/') ? path.slice(1) : path

        validRoutes.push({
          path: childPath, // ✅ 相对路径
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

        // ✅ 步骤5：通配路由必须作为 Layout 的子路由，避免拦截一级独立页面
        // 先删除旧的通配路由（防止重复注册）
        if (router.hasRoute('CatchAll')) {
          router.removeRoute('CatchAll')
          console.log('🗑️ 已删除旧的通配路由')
        }

        // ✅ 关键修复：通配路由作为子路由时，path 必须是相对路径（去掉前导 /）
        // 否则它会匹配根路径 /，导致所有路由都被拦截
        router.addRoute('Layout', {
          path: ':pathMatch(.*)*', // ✅ 相对路径，不带 /
          name: 'CatchAll',
          component: () => import('@/views/error/404.vue'),
          meta: { hidden: true },
        })

        console.log(`✅ 成功注册 ${validRoutes.length} 个动态路由 + 通配路由（均为 Layout 子路由）`)
      } else {
        console.error('❌ 未找到 Layout 路由')
        throw new Error('Layout 路由不存在，请检查路由配置')
      }
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
      const children = menu.children
      // ✅ 高级属性字段
      const isFrame = menu.is_frame !== undefined ? menu.is_frame : 1 // 默认是内部路由（1表示内部路由）
      const isCache = menu.is_cache !== undefined ? menu.is_cache : 0

      // ✅ 防止循环引用导致的栈溢出
      if (menu_id && visited.has(menu_id)) {
        console.warn(`⚠️ 检测到菜单循环引用或重复 ID: ${menu_id} (${menuName})，已跳过`)
        return
      }
      if (menu_id) visited.add(menu_id)

      // ✅ 过滤按钮类型、停用菜单
      // ✅ 注意：visible === '1' 的菜单不注册到侧边栏，但仍然需要注册为路由（如个人资料）
      if (menuType === 'F') return
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
        // ✅ 如果是外链（isFrame === 0），不注册为路由
        // 数据库定义：is_frame = 0 是外链，is_frame = 1 是内部路由
        if (isFrame === 0) {
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
            // ✅ 按钮权限来自 menu.buttons
            perms: [],
            keepAlive: isCache === 1, // ✅ 缓存控制
            isFrame: isFrame === 0, // ✅ 外链标识（0=外链，1=内部路由）
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
    buttonPermissions.value = []
    roles.value = []
    menuTree.value = []
    dynamicRoutes.value = []
    isRoutesGenerated.value = false
    isPermissionLoaded.value = false

    // ✅ 清除按钮权限缓存
    localStorage.removeItem('buttonPermissions')
    console.log('🗑️ 已重置权限状态')

    // ✅ 移除 Layout 下的所有动态子路由（包括通配路由）
    // ✅ 关键修复：保留静态路由（home），只清除动态路由
    if (router.hasRoute('Layout')) {
      router.removeRoute('Layout')
      router.addRoute({
        path: '/',
        name: 'Layout',
        component: () => import('@/layouts/index.vue'),
        redirect: '/home', // ✅ 重置后重定向到首页
        children: [
          // ✅ 保留静态定义的 home 路由
          {
            path: 'home',
            name: 'Home',
            component: () => import('@/views/home/index.vue'),
            meta: { title: '首页', hidden: false },
          },
        ],
      })
      console.log('🗑️ 已重置 Layout 路由（保留静态 home 路由）')
    }

    // 同时重置 menuStore
    const menuStore = useMenuStore()
    menuStore.resetMenu()
  }

  return {
    // State
    permissions,
    buttonPermissions,
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
    setButtonPermissions,
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
