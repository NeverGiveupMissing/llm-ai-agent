// 说明：路由守卫 - 权限验证和数据加载
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { getCurrentUser } from '@/api/auth'
import { permissionGuard } from '@/utils/permission'

/**
 * 路由守卫
 * 处理权限验证、数据加载、页面标题等
 */

/**
 * 全局前置路由守卫
 */
export function setupRouterGuard(router) {
  // 公开访问路径白名单（无需登录）
  const publicPaths = ['/login', '/smithyuyi001', '/403', '/404']

  // 🔒 防循环重定向保护
  let redirectCount = 0
  const MAX_REDIRECTS = 5
  let lastRedirectPath = ''

  router.beforeEach(async (to, from) => {
    // 🔍 调试：输出路由跳转信息
    console.log('🔄 路由跳转:', {
      from: from.path,
      to: to.path,
      redirect: to.redirectedFrom?.path,
      name: to.name,
      matched: to.matched.map(r => ({ name: r.name, path: r.path }))
    })

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // ✅ 全局错误捕获：监听未处理的 Promise rejection（包括 API 403 错误）
    // 这样可以在路由级别捕获到 API 请求的 403 错误，防止强制跳转登录页
    const handleUnhandledRejection = (event) => {
      const error = event.reason
      if (error && error._403Handled) {
        // 403 错误已在拦截器中处理，阻止默认行为
        event.preventDefault()
        console.log('✅ [Router Guard] 已捕获并处理 403 错误，用户留在当前页')
      }
    }
    
    // 添加全局错误监听器
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 使用通用权限守卫函数
    const result = await permissionGuard({
      to,
      userStore,
      permissionStore,
      publicPaths,
      getCurrentUser,
      loginPath: '/login',
      forbiddenPath: '/403'
    })

    // ✅ 循环检测：只检测真正的循环（连续重定向到同一个路径）
    if (result && typeof result === 'object' && result.path) {
      redirectCount++
      
      // 如果重定向次数过多，直接跳到 404
      if (redirectCount > MAX_REDIRECTS) {
        console.error(`❌ 路由重定向循环检测！已重定向 ${redirectCount} 次`)
        console.error(`   当前重定向到: ${result.path}`)
        console.error(`   上次重定向到: ${lastRedirectPath}`)
        redirectCount = 0
        return { path: '/404', replace: true }
      }
      
      // 只有当连续两次重定向到同一个路径时才认为是循环
      // 例如：/dashboard → /dashboard → /dashboard（连续 3 次重定向）
      if (result.path === lastRedirectPath) {
        console.error(`❌ 检测到循环重定向: ${result.path}`)
        redirectCount = 0
        return { path: '/404', replace: true }
      }
      
      lastRedirectPath = result.path
    } else {
      // 如果不是重定向（return true 或 return false），重置计数器
      // 这很重要！权限守卫返回 true 表示正常导航，不应该被误判为循环
      redirectCount = 0
      lastRedirectPath = ''
    }

    // ✅ 清理错误监听器
    setTimeout(() => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }, 1000)

    return result
  })
}
