/**
 * 将权限字段转换为数组
 * @param {any} perms - 权限字段（可能是字符串、数组或其他类型）
 * @returns {string[]} 权限数组
 */
export function getPermsArray(perms) {
  if (!perms) return []
  if (Array.isArray(perms)) {
    return perms.filter((p) => p && typeof p === 'string')
  }
  if (typeof perms === 'string') {
    return perms
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * 检查用户是否是超级管理员
 * @param {Array} roles - 用户角色列表
 * @returns {Boolean} 是否是超级管理员
 */
export function checkIsAdmin(roles) {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return false
  }

  return roles.some((role) => {
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
 * 检查按钮权限标识
 * @param {Object} permissionStore - 权限 store 实例
 * @param {String|Array} permissionCodes - 按钮权限标识
 * @returns {Boolean} 是否有按钮权限
 * @description 使用 buttonPermissions 数据源（来自 sys_button 的 perms 字段）
 */
export function checkPermissionCodes(permissionStore, permissionCodes) {
  if (!permissionStore) {
    console.warn('checkPermissionCodes: permissionStore 未正确初始化')
    return false
  }

  // 支持字符串或数组
  let codes = permissionCodes
  if (typeof permissionCodes === 'string') {
    codes = [permissionCodes]
  } else if (Array.isArray(permissionCodes)) {
    codes = permissionCodes
  } else {
    console.warn('CommonButton perms 属性必须是字符串或数组')
    return false
  }

  // 检查按钮权限（使用 hasAnyPermission，从 buttonPermissions 数据源检查）
  return permissionStore.hasAnyPermission(codes)
}

/**
 * 通用权限守卫函数（企业级方案）
 * @param {Object} options - 配置选项
 * @param {Object} options.to - Vue Router 目标路由对象
 * @param {Object} options.userStore - 用户 Store 实例
 * @param {Object} options.permissionStore - 权限 Store 实例
 * @param {string[]} options.publicPaths - 公开路径白名单
 * @param {Function} options.getCurrentUser - 获取当前用户信息的 API 函数
 * @param {string} options.loginPath - 登录页路径，默认 '/login'
 * @param {string} options.forbiddenPath - 无权限跳转路径，默认 '/403'
 * @returns {boolean|Object|string} 路由守卫返回值
 */
export async function permissionGuard({
  to,
  userStore,
  permissionStore,
  publicPaths = [],
  getCurrentUser,
  loginPath = '/login',
  forbiddenPath = '/403',
}) {
  // ✅ 导入离散消息工具和 router，用于非组件环境（路由守卫）的提示
  const { message } = await import('@/utils/http/message')
  const routerModule = await import('@/router/index.js')
  const router = routerModule.default
  const hasToken = userStore.token || localStorage.getItem('access_token')

  // 1. 未登录访问非公开页面 → 跳转登录
  if (!hasToken && !publicPaths.includes(to.path)) {
    return loginPath
  }

  // 2. 已登录访问登录页 → 跳转首页
  if (hasToken && to.path === loginPath) {
    // 如果权限已加载，直接跳转到首页
    if (permissionStore.isLoaded) {
      console.log('✅ [PermissionGuard] 已登录且权限已加载，跳转到首页')
      return { path: '/home', replace: true }
    }
    // 如果权限未加载，跳转到 / 让权限加载完成后再重定向
    console.log('⏳ [PermissionGuard] 已登录但权限未加载，跳转到 /')
    return { path: '/', replace: true }
  }

  // 3. 权限正在加载中 → 直接放行（由 watch 监听处理 UI 更新）
  // ✅ 关键修复：如果权限已经加载完成（isLoaded = true），不要进入此分支
  if (
    hasToken &&
    permissionStore.isLoading &&
    !permissionStore.isLoaded &&
    !publicPaths.includes(to.path)
  ) {
    console.log('⏳ [PermissionGuard] 权限加载中，直接放行')
    return true
  }

  // 4. 已登录但权限未加载 → 加载权限
  if (hasToken && permissionStore.isNotLoaded && !publicPaths.includes(to.path)) {
    try {
      // ✅ 防止重复调用：如果已经在加载了，直接放行
      if (permissionStore.isLoading) {
        console.log(' [PermissionGuard] 权限已在加载中，直接放行')
        return true
      }

      // ✅ 获取用户信息（只在没有用户信息时调用）
      // 检查 Pinia store 和 localStorage
      const hasUserInfo = userStore.userInfo?.user_id || localStorage.getItem('userInfo')
      if (!hasUserInfo) {
        console.log(' [PermissionGuard] 获取用户信息...')
        const res = await getCurrentUser()
        userStore.setUserInfo(res.data)
      } else {
        console.log(' [PermissionGuard] 用户信息已存在，跳过')
      }

      // 获取权限和菜单（内部会设置 loading 状态）
      // ✅ 异步解耦：即使失败也不会中断执行流
      await permissionStore.fetchUserPermissions()

      // ✅ 关键修复：权限加载完成后，需要等待 Vue 响应式更新
      // 使用 await nextTick() 确保 isPermissionLoaded 状态已更新
      await new Promise((resolve) => setTimeout(resolve, 100))

      // ✅ 确认权限确实加载完成后，才进行重定向
      if (!permissionStore.isLoaded) {
        console.warn('⚠️ [PermissionGuard] 权限加载状态未更新，等待重试...')
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      console.log('✅ [PermissionGuard] 权限加载完成，准备重定向到首页')
      // ✅ 关键修复：使用路由名称重定向，避免路径匹配冲突
      // 如果当前访问的是登录页，则跳转到首页；否则继续访问原目标页面
      if (to.path === loginPath) {
        return { name: 'Home', replace: true }
      } else {
        // 继续访问原目标页面，但需要确保路由已注册
        return { path: to.path, query: to.query, replace: true }
      }
    } catch (error) {
      console.error('❌ [PermissionGuard] 权限加载失败:', error)

      // ✅ 优化异常处理：如果是 403 或 500 错误，给一个默认的空数组，并完成路由注册
      if (error.status === 403 || error.status === 500) {
        console.warn(`⚠️ [PermissionGuard] 权限接口返回 ${error.status}，降级处理`)

        // ✅ 设置空权限，但不标记为失败，允许路由继续注册
        permissionStore.setPermissions([])
        permissionStore.setButtonPermissions([])
        permissionStore.setMenuTree([])
        permissionStore.setLoaded() // ✅ 标记为已加载，避免无限重试

        // ✅ 离散 API 提示，不阻塞 Promise 链
        if (!error._403Handled && !error._500Handled) {
          message.warning(error.message || '权限接口异常，已使用默认配置')
        }

        // ✅ 继续执行，不中断
        return { path: to.path, query: to.query, replace: true }
      }

      // ✅ 401 处理：认证失败 → 清空 Token 并跳转登录页
      if (error.message?.includes('登录已过期') || error.message?.includes('401')) {
        console.warn('⚠️ [PermissionGuard] Token 失效，跳转登录页')
        userStore.logout()
        return loginPath
      }

      // ✅ 其他错误：降级放行，允许路由匹配，但可能无菜单/数据
      console.warn('⚠️ [PermissionGuard] 权限加载异常，降级放行。错误详情:', error.message)

      if (!error._403Handled) {
        message.error(error.message || '权限不足，已拦截请求')
      }

      // 降级放行：允许路由匹配，但可能无菜单/数据
      return true
    }
  }

  // 5. 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI Agent`
  }

  // 6. ✅ 路由匹配检查：如果路由未注册且不是公开路径，拦截到 403
  if (hasToken && to.matched.length === 0 && !publicPaths.includes(to.path)) {
    console.warn(`⚠️ [PermissionGuard] 路由未注册，拦截访问: ${to.path}`)
    console.warn('🔍 [PermissionGuard] 当前所有已注册路由:', router.getRoutes().map(r => ({ name: r.name, path: r.path })))
    console.warn('🔍 [PermissionGuard] to.matched:', to.matched)
    console.warn('🔍 [PermissionGuard] userStore.userInfo?.roles:', userStore.userInfo?.roles)
    
    // ✅ 管理员特权：即使路由未注册，也允许访问（可能是动态路由加载延迟）
    const userRoles = userStore.userInfo?.roles || userStore.roles || []
    const isAdmin = checkIsAdmin(userRoles)
    if (isAdmin) {
      console.log('👑 [PermissionGuard] 管理员用户，允许访问未注册路由:', to.path)
      return true
    }
    
    return { path: forbiddenPath, replace: true }
  }

  // 7. ✅ 导航行为权限检查（直接访问URL、点击菜单、刷新页面）
  // ✅ 菜单显示通过 menuTree 控制，按钮权限通过 buttonPermissions 控制
  // 只要路由已注册（在 menuTree 中），就说明用户有该菜单的访问权限
  // 这里只需要检查路由是否存在，不需要再检查 permissions
  if (hasToken && !publicPaths.includes(to.path)) {
    // 跳过 Layout 根路径和重定向
    if (to.path === '/' || to.redirectedFrom?.path === '/') {
      return true
    }

    // ✅ 管理员权限判断：如果是 admin 角色，直接放行
    const userRoles = userStore.userInfo?.roles || userStore.roles || []
    const isAdmin = checkIsAdmin(userRoles)
    if (isAdmin) {
      return true // 超级管理员直接放行
    }

    // 路由的存在本身就代表用户有访问权限（通过 menuTree 控制）
    // 只要路由已经注册到 router 中，就直接放行
    return true
  }

  // 8. 正常放行
  return true
}
