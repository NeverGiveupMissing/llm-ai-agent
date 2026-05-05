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
      name: to.name
    })

    // 🔒 检测循环重定向
    if (to.redirectedFrom) {
      redirectCount++
      if (redirectCount > MAX_REDIRECTS) {
        console.error(`❌ 路由重定向循环检测！已重定向 ${redirectCount} 次，最后路径: ${to.path}`)
        redirectCount = 0
        return { path: '/404', replace: true }
      }
      if (to.path === lastRedirectPath) {
        console.error(`❌ 检测到循环重定向: ${to.path}`)
        redirectCount = 0
        return { path: '/404', replace: true }
      }
      lastRedirectPath = to.path
    } else {
      redirectCount = 0
      lastRedirectPath = ''
    }

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    // 使用通用权限守卫函数
    return permissionGuard({
      to,
      userStore,
      permissionStore,
      publicPaths,
      getCurrentUser,
      loginPath: '/login',
      forbiddenPath: '/403'
    })
  })
}
