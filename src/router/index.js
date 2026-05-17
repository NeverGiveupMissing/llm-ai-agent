import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuard } from './guard'
import Layout from '@/layouts/index.vue'

/**
 * ✅ 路由架构规范：
 * 1. Layout 作为独立静态路由
 * 2. 所有需要公共布局（sidebar/header）的页面，全部作为 Layout 的子路由
 * 3. login/register/404 等独立页面不要使用 Layout
 * 4. 动态路由不要直接放在根级别
 * 5. 动态路由必须增加业务前缀（如 /system/user, /system/role）
 */

const routes = [
  // ========================================
  // ✅ 一级路由页面（不使用 Layout 布局）
  // ========================================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true, public: true },
  },
  {
    path: '/smithyuyi001',
    name: 'Smithyuyi001',
    component: () => import('@/views/smithyuyi001/index.vue'),
    meta: { hidden: true, public: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { hidden: true, public: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true, public: true },
  },
  // ========================================
  // ✅ Layout 作为独立静态路由
  // ✅ 所有需要公共布局的页面都作为其子路由
  // ========================================
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/home',
    children: [
      // ✅ 默认首页白名单：所有用户均可访问
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', hidden: false },
      },
      // ✅ 所有动态路由都往这里加
      // ✅ 通配路由也作为子路由（不拦截一级页面）
    ],
  },
]

console.log('🛣️ [Router] 初始路由配置:', routes)
console.log('🛣️ [Router] Layout 路由:', routes.find(r => r.name === 'Layout'))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

console.log('🛣️ [Router] Router 实例创建完成')
console.log('🛣️ [Router] 所有路由:', router.getRoutes())

// 应用路由守卫
setupRouterGuard(router)

// 监听路由变化
router.afterEach((to, from, failure) => {
  console.log('✅ [Router] 路由导航完成:', {
    to: to.path,
    toName: to.name,
    from: from.path,
    matched: to.matched.map(r => ({ name: r.name, path: r.path })),
    failure
  })
})

export default router
