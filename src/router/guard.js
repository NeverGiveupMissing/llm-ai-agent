// 说明：路由守卫 - 权限验证和数据加载
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'

/**
 * 路由守卫
 * 处理权限验证、数据加载、页面标题等
 */

/**
 * 全局前置路由守卫
 */
export function setupRouterGuard(router) {
  // ✅ 公开访问路径白名单（无需登录）
  const publicPaths = ['/login', '/smithyuyi001']
  
  router.beforeEach(async (to) => {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    
    const hasToken = userStore.token

    console.log(`🔍 路由守卫触发: ${to.path}, hasToken: ${!!hasToken}, isPermissionLoaded: ${permissionStore.isPermissionLoaded}`)

    // 1. 未登录，访问非公开页面 → 跳转登录
    if (!hasToken && !publicPaths.includes(to.path)) {
      console.log('👉 未登录，重定向到 /login')
      return '/login'
    }

    // 2. 已登录，访问登录页 → 跳转首页
    if (hasToken && to.path === '/login') {
      console.log('👉 已登录，重定向到 /dashboard')
      return { path: '/dashboard', replace: true }
    }

    // 3. 已登录，但权限数据未加载 → 获取用户信息和菜单
    // ✅ 注意：'loading' 状态也要等待，不能放行
    if (hasToken && (!permissionStore.isPermissionLoaded || permissionStore.isPermissionLoaded === 'loading') && !publicPaths.includes(to.path)) {
      try {
        // 防止重复请求
        permissionStore.isPermissionLoaded = 'loading'
        
        // 获取用户权限和菜单数据
        await permissionStore.fetchUserPermissions()
        
        console.log('✅ 权限加载完成，准备跳转...')
        
        // ✅ 如果是首页或空路径，重定向到 dashboard
        if (to.path === '/' || to.path === '') {
          console.log('👉 重定向到 /dashboard')
          return { path: '/dashboard', replace: true }
        }
        
        // ✅ 关键修复：检查目标路由是否存在，不存在则重定向到 dashboard
        const matched = router.getRoutes().some(route => route.path === to.path)
        if (!matched) {
          console.warn(`⚠️ 目标路由 ${to.path} 不存在，重定向到 /dashboard`)
          return { path: '/dashboard', replace: true }
        }
        
        // 重新导航到目标路由（确保菜单和权限数据已加载）
        console.log(`👉 重新导航到 ${to.path}`)
        return { ...to, replace: true }
      } catch (error) {
        console.error('❌ 获取权限数据失败:', error)
        permissionStore.isPermissionLoaded = false
        
        // 如果是401错误，说明token失效，跳转登录
        if (error.response?.status === 401) {
          userStore.logout()
          return '/login'
        }
        
        // 其他错误，允许继续访问（使用空权限）
        return true
      }
    }

    // 4. 设置页面标题
    if (to.meta?.title) {
      document.title = `${to.meta.title} - AI Agent`
    }

    // 5. 放行
    return true
  })
}
