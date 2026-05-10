/**
 * 将权限字段转换为数组
 * @param {any} perms - 权限字段（可能是字符串、数组或其他类型）
 * @returns {string[]} 权限数组
 */
export function getPermsArray(perms) {
  if (!perms) return []
  if (Array.isArray(perms)) {
    return perms.filter(p => p && typeof p === 'string')
  }
  if (typeof perms === 'string') {
    return perms.split(',').map(p => p.trim()).filter(Boolean)
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
  
  return roles.some(role => {
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
 * 检查权限标识
 * @param {Object} permissionStore - 权限 store 实例
 * @param {String|Array} permissionCodes - 权限标识
 * @returns {Boolean} 是否有权限
 */
export function checkPermissionCodes(permissionStore, permissionCodes) {
  if (!permissionStore || !permissionStore.hasAnyPermission) {
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
  
  // 检查权限（使用 hasAnyPermission，任一权限即可）
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
  forbiddenPath = '/403'
}) {
  const hasToken = userStore.token || localStorage.getItem('access_token')

  // 1. 未登录访问非公开页面 → 跳转登录
  if (!hasToken && !publicPaths.includes(to.path)) {
    return loginPath
  }

  // 2. 已登录访问登录页 → 跳转首页
  if (hasToken && to.path === loginPath) {
    // 如果权限已加载，直接跳转到 dashboard
    if (permissionStore.isLoaded) {
      console.log('✅ [PermissionGuard] 已登录且权限已加载，跳转到 dashboard')
      return { path: '/dashboard', replace: true }
    }
    // 如果权限未加载，跳转到 / 让权限加载完成后再重定向
    console.log('⏳ [PermissionGuard] 已登录但权限未加载，跳转到 /')
    return { path: '/', replace: true }
  }

  // 3. 权限正在加载中 → 直接放行（由 watch 监听处理 UI 更新）
  if (hasToken && permissionStore.isLoading && !publicPaths.includes(to.path)) {
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
      await permissionStore.fetchUserPermissions()

      // ✅ 权限加载完成，路由已注册
      // router.addRoute() 在导航过程中注册的路由，当前导航的 matched 不会更新
      // 必须返回重定向对象，让 Vue Router 使用新的路由表重新匹配
      console.log('✅ [PermissionGuard] 权限加载完成，路由已注册，重新导航到:', to.path)
      return { path: to.path, query: to.query, replace: true }
    } catch (error) {
      console.error('❌ [PermissionGuard] 权限加载失败:', error)
      permissionStore.setFailed()

      // Token 失效 → 跳转登录
      if (error.message?.includes('登录已过期') || error.message?.includes('401')) {
        console.warn('⚠️ [PermissionGuard] Token 失效，跳转登录页')
        userStore.logout()
        return loginPath
      }

      // 其他错误 → 降级放行（允许访问，但可能无菜单）
      console.warn('⚠️ [PermissionGuard] 权限加载失败，降级放行')
      return true
    }
  }

  // 5. 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI Agent`
  }

  // 6. 正常放行
  return true
}
