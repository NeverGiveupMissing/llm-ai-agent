// 说明:路由守卫 - 权限验证和动态路由加载
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import router from './index'

// 白名单路由(无需登录即可访问)
const whiteList = ['/login']

/**
 * 全局前置守卫
 * Vue Router 5+ 推荐使用返回值替代 next() 回调
 */
router.beforeEach(async (to, from) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  // 获取 token
  const hasToken = userStore.token

  if (hasToken) {
    // 已登录
    if (to.path === '/login') {
      // 已登录状态下访问登录页,重定向到首页
      return '/'
    } else {
      // 检查是否已生成动态路由
      const hasGeneratedRoutes = permissionStore.isRoutesGenerated

      if (hasGeneratedRoutes) {
        // 已生成路由,直接放行
        return true
      } else {
        try {
          // TODO: 从后端获取用户权限列表
          // 示例:const { data } = await getUserPermissions()
          // permissionStore.setPermissions(data.permissions)
          // permissionStore.setRoles(data.roles)

          // 临时模拟权限数据(实际应从后端接口获取)
          const mockPermissions = [
            'user:read',
            'user:create',
            'user:update',
            'user:delete',
            'role:read',
            'role:create',
            'role:update',
            'role:delete',
            'permission:read',
            'chat:read',
            'chat:create',
            'chat:update',
            'chat:delete',
            'memory:read',
            'memory:create',
            'memory:update',
            'memory:delete',
          ]
          permissionStore.setPermissions(mockPermissions)

          // 生成可访问的路由
          // TODO: 这里应该从路由配置中筛选需要权限的路由
          // const accessRoutes = permissionStore.generateRoutes(asyncRoutes)
          // router.addRoute(accessRoutes)

          // 标记路由已生成
          permissionStore.isRoutesGenerated = true
          
          // 返回目标路由,继续导航
          return { ...to, replace: true }
        } catch (error) {
          console.error('权限获取失败:', error)
          // 获取权限失败,重置 token 并跳转登录页
          userStore.logout()
          permissionStore.resetPermission()
          return {
            path: '/login',
            query: { redirect: to.fullPath }
          }
        }
      }
    }
  } else {
    // 未登录
    if (whiteList.includes(to.path)) {
      // 在白名单中,直接放行
      return true
    } else {
      // 不在白名单,重定向到登录页
      return {
        path: '/login',
        query: { redirect: to.fullPath }
      }
    }
  }
})

/**
 * 全局后置钩子
 */
router.afterEach((to) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI Agent`
  }
})

export default router