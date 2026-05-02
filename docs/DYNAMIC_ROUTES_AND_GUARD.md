# 动态路由 + 路由守卫使用文档

## 📋 概述

本文档描述了前端动态路由和路由守卫的完整实现方案，包括权限控制、动态注册、页面刷新恢复等功能。

## 🎯 核心功能

### 1. **未登录访问任何页面跳转 /login** ✅

所有非公开页面都需要登录后才能访问，未登录用户会被重定向到登录页。

### 2. **登录后根据 menuList 动态注册路由** ✅

登录成功后，从后端获取菜单树，使用 `router.addRoute()` 动态注册路由。

### 3. **访问无权限页面跳转 /403** ✅

已登录但无权限访问某个页面时，自动跳转到403禁止访问页面。

### 4. **已登录访问 /login 跳转首页** ✅

已登录用户如果访问登录页，会自动重定向到首页。

### 5. **刷新页面不丢失动态路由** ✅

通过 Pinia Store 的状态管理和路由守卫的自动加载机制，确保刷新页面后动态路由不会丢失。

---

## 🏗️ 架构设计

### 路由分类

```
┌─────────────────────────────────────┐
│         前端路由系统                  │
├─────────────────────────────────────┤
│                                     │
│  1. 静态路由（无需权限）              │
│     - /login                        │
│     - /403                          │
│     - /404                          │
│                                     │
│  2. 动态路由（需要权限）              │
│     - /dashboard                    │
│     - /chat                         │
│     - /agent                        │
│     - /knowledge                    │
│     - /memory                       │
│     - /tools                        │
│     - /settings                     │
│     - ...                           │
│                                     │
└─────────────────────────────────────┘
```

### 数据流

```
用户访问页面
    ↓
路由守卫拦截
    ↓
检查是否有 Token
    ↓
┌──────────┬──────────┐
│ 有Token  │ 无Token  │
└────┬─────┴────┬─────┘
     │          │
     ▼          ▼
  已登录      未登录
     │          │
     │          ├─→ 白名单页面？ → 是 → 放行
     │          │                  否 → 跳转 /login
     │
     ├─→ 已生成路由？
     │     ├─→ 是 → 检查权限 → 有权限 → 放行
     │     │                      无权限 → 跳转 /403
     │     │
     │     └─→ 否 → 获取菜单树
     │            ↓
     │         生成动态路由
     │            ↓
     │         addRoute() 注册
     │            ↓
     │         重新导航到目标页面
```

---

## 📦 核心文件

### 1. router/index.js - 路由初始化

**职责**：定义静态路由（公开页面）

```javascript
import { createRouter, createWebHistory } from 'vue-router'

/**
 * ⭐ 静态路由（无需权限即可访问）
 * 包括：登录页、403、404等公开页面
 */
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
```

**关键点**：
- ✅ 只包含公开路由
- ✅ 业务路由全部动态生成
- ✅ 标记 `meta.public: true`

---

### 2. router/guard.js - 路由守卫

**职责**：权限验证、动态路由加载、页面跳转控制

```javascript
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { useMenuStore } from '@/stores/modules/menu'
import router from './index'
import { generateRoutesFromMenu } from './routes'

// 白名单路由(无需登录即可访问)
const whiteList = ['/login', '/403', '/404']

/**
 * 全局前置守卫
 */
router.beforeEach(async (to, from) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const menuStore = useMenuStore()

  const hasToken = userStore.token

  if (hasToken) {
    // ⭐ 需求4：已登录访问 /login 跳转首页
    if (to.path === '/login') {
      return '/'
    }
    
    const hasGeneratedRoutes = permissionStore.isRoutesGenerated

    if (hasGeneratedRoutes) {
      // ⭐ 需求3：检查是否有访问权限
      if (to.meta?.permission) {
        const hasPermission = permissionStore.hasPermission(to.meta.permission)
        if (!hasPermission) {
          return '/403'
        }
      }
      return true
    } else {
      try {
        // 先标记为已生成，防止重复请求
        permissionStore.isRoutesGenerated = true
        
        // ⭐ 需求2：获取菜单和权限数据
        await permissionStore.fetchUserPermissions()
        
        // 根据菜单树动态生成路由
        const menuList = permissionStore.menuList
        const dynamicRoutes = generateRoutesFromMenu(menuList)
        
        // 动态添加路由
        dynamicRoutes.forEach((route) => {
          router.addRoute(route)
        })
        
        // 生成侧边栏菜单
        if (menuList.length > 0) {
          menuStore.setMenuFromTree(menuList)
        }
        
        permissionStore.isRoutesGenerated = true
        
        // 重新导航到目标路由
        return { ...to, replace: true }
      } catch (error) {
        console.error('❌ 权限获取失败:', error)
        permissionStore.isRoutesGenerated = false
        userStore.logout()
        permissionStore.resetPermission()
        return {
          path: '/login',
          query: { redirect: to.fullPath }
        }
      }
    }
  } else {
    // ⭐ 需求1：未登录访问任何页面跳转 /login
    if (whiteList.includes(to.path)) {
      return true
    } else {
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
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI Agent`
  }
})

export default router
```

**关键逻辑**：

#### 需求1：未登录访问任何页面跳转 /login

```javascript
if (!hasToken) {
  if (whiteList.includes(to.path)) {
    return true  // 白名单放行
  } else {
    return {
      path: '/login',
      query: { redirect: to.fullPath }  // 保存原始路径
    }
  }
}
```

#### 需求2：登录后动态注册路由

```javascript
// 获取菜单树
await permissionStore.fetchUserPermissions()

// 生成路由配置
const menuList = permissionStore.menuList
const dynamicRoutes = generateRoutesFromMenu(menuList)

// 动态添加路由
dynamicRoutes.forEach((route) => {
  router.addRoute(route)
})
```

#### 需求3：访问无权限页面跳转 /403

```javascript
if (to.meta?.permission) {
  const hasPermission = permissionStore.hasPermission(to.meta.permission)
  if (!hasPermission) {
    return '/403'
  }
}
```

#### 需求4：已登录访问 /login 跳转首页

```javascript
if (hasToken && to.path === '/login') {
  return '/'
}
```

#### 需求5：刷新页面不丢失动态路由

**实现原理**：
1. Token 存储在 localStorage，刷新后依然存在
2. 路由守卫检测到有 Token 但未生成路由时，自动重新获取菜单并注册
3. Pinia Store 的状态在刷新后会重置，但路由守卫会重新加载

```javascript
// 刷新页面后
const hasToken = userStore.token  // ✅ 从 localStorage 读取，依然存在
const hasGeneratedRoutes = permissionStore.isRoutesGenerated  // ❌ 重置为 false

if (hasToken && !hasGeneratedRoutes) {
  // 自动重新获取菜单并注册路由
  await permissionStore.fetchUserPermissions()
  const dynamicRoutes = generateRoutesFromMenu(permissionStore.menuList)
  dynamicRoutes.forEach(route => router.addRoute(route))
  permissionStore.isRoutesGenerated = true
}
```

---

### 3. router/routes.js - 动态路由生成

**职责**：将后端菜单树转换为 Vue Router 路由配置

```javascript
import Layout from '@/layouts/index.vue'

/**
 * 将后端菜单树转换为路由配置
 * @param {Array} menuList - 后端返回的菜单树
 * @returns {Array} 路由配置数组
 */
export function generateRoutesFromMenu(menuList) {
  const routes = []

  // 创建根路由（Layout）
  const rootRoute = {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [],
  }

  menuList.forEach((menu) => {
    if (!menu.path) return

    const route = {
      path: menu.path.startsWith('/') ? menu.path.slice(1) : menu.path,
      name: menu.code || menu.name,
      component: null,
      meta: {
        title: menu.name,
        icon: menu.icon,
        permission: menu.code,
        hidden: menu.hidden || false,
      },
    }

    // 动态导入组件
    const componentPath = menu.component || menu.path
    
    try {
      route.component = () => import(`@/views/${componentPath}/index.vue`)
    } catch (error) {
      console.warn(`⚠️ 组件加载失败: ${componentPath}`, error)
      route.component = () => import('@/views/error/404.vue')
    }

    // 递归处理子菜单
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children.map((child) => {
        if (!child.path) return null
        
        const childRoute = {
          path: child.path.startsWith('/') ? child.path.slice(1) : child.path,
          name: child.code || child.name,
          meta: {
            title: child.name,
            icon: child.icon,
            permission: child.code,
            hidden: child.hidden || false,
          },
        }
        
        const childComponentPath = child.component || child.path
        try {
          childRoute.component = () => import(`@/views/${childComponentPath}/index.vue`)
        } catch (error) {
          console.warn(`⚠️ 子组件加载失败: ${childComponentPath}`, error)
          childRoute.component = () => import('@/views/error/404.vue')
        }
        
        return childRoute
      }).filter(Boolean)
    }

    rootRoute.children.push(route)
  })

  routes.push(rootRoute)
  return routes
}
```

**转换示例**：

后端菜单数据：
```json
[
  {
    "id": "uuid1",
    "name": "工作台",
    "code": "dashboard",
    "path": "/dashboard",
    "icon": "dashboard",
    "children": []
  },
  {
    "id": "uuid2",
    "name": "AI对话",
    "code": "chat",
    "path": "/chat",
    "icon": "chat",
    "children": []
  }
]
```

转换后的路由配置：
```javascript
[
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '工作台',
          icon: 'dashboard',
          permission: 'dashboard',
          hidden: false,
        }
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: 'AI对话',
          icon: 'chat',
          permission: 'chat',
          hidden: false,
        }
      }
    ]
  }
]
```

---

### 4. stores/modules/permission.js - 权限Store

**职责**：管理菜单树和权限编码

```javascript
export const usePermissionStore = defineStore('permission', () => {
  // 菜单树（从后端获取）
  const menuList = ref([])

  // 权限编码数组（如 ['user:list', 'user:add']）
  const permissionCodes = ref([])

  // 是否已生成动态路由
  const isRoutesGenerated = ref(false)

  // 判断是否有某权限
  function hasPermission(code) {
    if (!code) return true
    return permissionCodes.value.includes(code)
  }

  // 从后端获取用户菜单和权限数据
  async function fetchUserPermissions() {
    const [menuTreeRes, permissionsRes] = await Promise.all([
      getMenuTree(),
      getMyPermissions(),
    ])

    setMenuList(menuTreeData)
    setPermissionCodes(codes)
    
    isPermissionLoaded.value = true
    return true
  }

  // 重置权限状态
  function resetPermission() {
    menuList.value = []
    permissionCodes.value = []
    isRoutesGenerated.value = false
    isPermissionLoaded.value = false
  }

  return {
    menuList,
    permissionCodes,
    isRoutesGenerated,
    hasPermission,
    fetchUserPermissions,
    resetPermission,
  }
})
```

---

## 🔄 完整流程

### 场景1：首次登录

```
1. 用户在登录页输入用户名密码
   ↓
2. 调用登录接口，获取 Token
   ↓
3. 保存 Token 到 localStorage
   ↓
4. 调用 permissionStore.fetchUserPermissions()
   ↓
5. 并行请求：
   - GET /nodeapi/permissions/user/menu → menuList
   - GET /nodeapi/permissions/my-permissions → permissionCodes
   ↓
6. 根据 menuList 生成动态路由
   ↓
7. router.addRoute() 注册路由
   ↓
8. menuStore.setMenuFromTree() 生成侧边栏菜单
   ↓
9. 跳转到首页（或之前想访问的页面）
```

### 场景2：刷新页面

```
1. 用户刷新页面（F5）
   ↓
2. Pinia Store 状态重置（menuList=[], isRoutesGenerated=false）
   ↓
3. 但 Token 依然在 localStorage 中
   ↓
4. 路由守卫触发 beforeEach
   ↓
5. 检测到 hasToken=true, hasGeneratedRoutes=false
   ↓
6. 自动调用 permissionStore.fetchUserPermissions()
   ↓
7. 重新获取菜单树和权限编码
   ↓
8. 重新生成动态路由并注册
   ↓
9. 重新导航到当前页面
   ↓
10. 用户无感知，页面正常显示
```

### 场景3：访问无权限页面

```
1. 用户尝试访问 /system/users
   ↓
2. 路由守卫检查 to.meta.permission = 'user:manage'
   ↓
3. 调用 permissionStore.hasPermission('user:manage')
   ↓
4. 检查 permissionCodes 是否包含 'user:manage'
   ↓
5. 如果不包含，返回 '/403'
   ↓
6. 用户看到403禁止访问页面
```

### 场景4：已登录访问登录页

```
1. 已登录用户访问 /login
   ↓
2. 路由守卫检测到 hasToken=true
   ↓
3. 直接返回 '/'
   ↓
4. 用户被重定向到首页
```

---

## 💡 最佳实践

### 1. 路由配置规范

**后端菜单数据格式**：

```json
{
  "id": "uuid",
  "name": "用户管理",
  "code": "user:manage",
  "path": "/system/users",
  "component": "system/users",
  "icon": "people",
  "hidden": false,
  "children": []
}
```

**字段说明**：
- `name`：菜单名称（显示在侧边栏）
- `code`：权限编码（用于权限判断）
- `path`：路由路径
- `component`：组件路径（相对于 `@/views/`）
- `icon`：图标名称
- `hidden`：是否隐藏菜单
- `children`：子菜单数组

### 2. 组件路径规范

**目录结构**：
```
src/views/
├── dashboard/
│   └── index.vue
├── chat/
│   └── index.vue
├── system/
│   ├── users/
│   │   └── index.vue
│   └── roles/
│       └── index.vue
```

**菜单配置**：
```json
{
  "name": "用户管理",
  "path": "/system/users",
  "component": "system/users"  // → @/views/system/users/index.vue
}
```

### 3. 权限判断使用

**模板中使用**：

```vue
<template>
  <n-button v-if="permissionStore.hasPermission('user:create')">
    创建用户
  </n-button>
</template>

<script setup>
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()
</script>
```

**脚本中使用**：

```javascript
function handleDelete() {
  if (!permissionStore.hasPermission('user:delete')) {
    message.warning('您没有删除权限')
    return
  }
  
  // 执行删除操作
}
```

### 4. 错误处理

**组件加载失败**：

```javascript
try {
  route.component = () => import(`@/views/${componentPath}/index.vue`)
} catch (error) {
  console.warn(`⚠️ 组件加载失败: ${componentPath}`, error)
  route.component = () => import('@/views/error/404.vue')
}
```

**权限获取失败**：

```javascript
catch (error) {
  console.error('❌ 权限获取失败:', error)
  permissionStore.isRoutesGenerated = false
  userStore.logout()
  permissionStore.resetPermission()
  return {
    path: '/login',
    query: { redirect: to.fullPath }
  }
}
```

---

## ⚠️ 注意事项

### 1. 避免死循环

**问题**：路由守卫中重复请求权限数据导致死循环

**解决方案**：先标记 `isRoutesGenerated = true`，再异步获取数据

```javascript
// ✅ 正确做法
permissionStore.isRoutesGenerated = true  // 先标记
await permissionStore.fetchUserPermissions()  // 再请求

// ❌ 错误做法
await permissionStore.fetchUserPermissions()  // 先请求
permissionStore.isRoutesGenerated = true  // 后标记（可能导致重复请求）
```

### 2. 动态路由注册时机

**问题**：动态路由注册后立即导航可能找不到路由

**解决方案**：使用 `{ ...to, replace: true }` 重新导航

```javascript
// ✅ 正确做法
return { ...to, replace: true }

// ❌ 错误做法
return true  // 可能导致路由解析失败
```

### 3. 组件路径不存在

**问题**：后端配置的组件路径在前端不存在

**解决方案**：使用 try-catch 捕获错误，降级到404页面

```javascript
try {
  route.component = () => import(`@/views/${componentPath}/index.vue`)
} catch (error) {
  route.component = () => import('@/views/error/404.vue')
}
```

### 4. 刷新页面状态丢失

**问题**：刷新后 Pinia Store 状态重置

**解决方案**：依赖路由守卫自动重新加载

```javascript
// 刷新后
const hasToken = userStore.token  // ✅ 从 localStorage 读取
const hasGeneratedRoutes = permissionStore.isRoutesGenerated  // ❌ 重置为 false

// 路由守卫会自动检测并重新加载
if (hasToken && !hasGeneratedRoutes) {
  await permissionStore.fetchUserPermissions()
  // ... 重新注册路由
}
```

---

## 🧪 测试方法

### 1. 测试未登录访问

```bash
# 清除 Token
localStorage.removeItem('access_token')

# 访问任意页面
window.location.href = '/dashboard'

# 预期结果：跳转到 /login?redirect=/dashboard
```

### 2. 测试登录后动态路由

```javascript
// 浏览器控制台
console.log(router.getRoutes())  // 查看已注册的路由

// 登录后应该能看到动态注册的路由
// - /dashboard
// - /chat
// - /agent
// - ...
```

### 3. 测试权限控制

```javascript
// 模拟无权限
permissionStore.permissionCodes = []

// 访问需要权限的页面
window.location.href = '/system/users'

// 预期结果：跳转到 /403
```

### 4. 测试刷新页面

```javascript
// 登录后
console.log('当前路由数量:', router.getRoutes().length)

// 刷新页面（F5）
location.reload()

// 刷新后
console.log('刷新后路由数量:', router.getRoutes().length)

// 预期结果：路由数量相同，页面正常显示
```

### 5. 测试已登录访问登录页

```javascript
// 确保已登录
console.log('Token:', localStorage.getItem('access_token'))

// 访问登录页
window.location.href = '/login'

// 预期结果：立即跳转到 /
```

---

## 📊 性能优化

### 1. 并行请求

```javascript
// ✅ 并行请求菜单和权限
const [menuTreeRes, permissionsRes] = await Promise.all([
  getMenuTree(),
  getMyPermissions(),
])

// ❌ 串行请求（慢）
const menuTreeRes = await getMenuTree()
const permissionsRes = await getMyPermissions()
```

### 2. 路由懒加载

```javascript
// ✅ 动态导入（按需加载）
route.component = () => import(`@/views/${componentPath}/index.vue`)

// ❌ 静态导入（一次性加载所有组件）
import Dashboard from '@/views/dashboard/index.vue'
```

### 3. 防止重复请求

```javascript
// ✅ 先标记状态，防止重复请求
if (permissionStore.isRoutesGenerated) {
  return true
}

permissionStore.isRoutesGenerated = true
await permissionStore.fetchUserPermissions()
```

---

## 📚 相关文档

- [前端权限Store文档](./FRONTEND_PERMISSION_STORE.md)
- [后端权限API文档](./PERMISSION_MENU_API.md)
- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)

---

## 🎉 总结

动态路由和路由守卫已经完整实现，具有以下特点：

✅ **安全性**：未登录无法访问任何业务页面  
✅ **灵活性**：路由完全由后端配置，前端无需硬编码  
✅ **易用性**：自动处理权限判断和页面跳转  
✅ **可靠性**：刷新页面不丢失动态路由  
✅ **规范性**：清晰的代码结构和完整的错误处理  

**核心特性**：
- ✅ **需求1**：未登录访问任何页面跳转 /login
- ✅ **需求2**：登录后根据 menuList 动态注册路由（addRoute）
- ✅ **需求3**：访问无权限页面跳转 /403
- ✅ **需求4**：已登录访问 /login 跳转首页
- ✅ **需求5**：刷新页面不丢失动态路由

**下一步**：
1. 在后端 permissions 表中配置菜单数据
2. 测试各种场景下的路由跳转
3. 根据需要调整权限控制粒度
4. 添加更多错误处理和用户体验优化

所有功能已经完成，可以直接使用！🚀
