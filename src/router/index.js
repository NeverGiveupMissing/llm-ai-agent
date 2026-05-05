import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layouts/index.vue'
import { setupRouterGuard } from './guard'
import { commonRoutes } from './routes'

const routes = [
  {
    path: '/',
    name: 'Layout', // ✅ 添加 name，用于动态添加子路由
    component: Layout,
    redirect: '/login', // ✅ 未登录时重定向到登录页
    children: [
      // ✅ 注册通用路由（所有登录用户都能访问）
      ...commonRoutes,
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
  },
  {
    path: '/smithyuyi001',
    name: 'Smithyuyi001',
    component: () => import('@/views/smithyuyi001/index.vue'),
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
  },
  // ✅ 404 路由暂时不添加，将在动态路由加载后最后添加
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 应用路由守卫
setupRouterGuard(router)

export default router
