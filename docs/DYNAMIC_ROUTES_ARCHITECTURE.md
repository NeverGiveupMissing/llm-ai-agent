# 动态路由架构说明

## 📋 概述

本项目采用**完全动态的路由架构**，所有业务路由都从后端数据库的 `permissions` 表中获取，前端不再硬编码任何业务路由配置。

## 🎯 核心原则

### ❌ 错误做法（已废弃）

```javascript
// 前端写死所有路由 - 不推荐！
export const asyncRoutes = [
  {
    path: '/dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '工作台' },
  },
  {
    path: '/chat',
    component: () => import('@/views/chat/index.vue'),
    meta: { title: 'AI对话' },
  },
  // ... 更多硬编码路由
]
```

**问题**：

- ❌ 前后端重复维护路由配置
- ❌ 新增菜单需要修改前后端代码
- ❌ 权限控制不够灵活
- ❌ 不支持多租户、个性化菜单

### ✅ 正确做法（当前实现）

```javascript
// 前端只保留静态路由（登录、403、404等）
export const constantRoutes = [
  { path: '/login', ... },
  { path: '/403', ... },
  { path: '/404', ... },
]

// 业务路由完全从后端动态获取
export const asyncRoutes = [] // 空数组，仅作为占位符
```

**优势**：

- ✅ 路由配置统一在后端管理
- ✅ 新增菜单只需在数据库中添加
- ✅ 支持动态权限控制
- ✅ 支持多租户、个性化菜单
- ✅ 前后端真正分离

## 🔄 工作流程

```
┌─────────────────────────────────────────────────────────┐
│                    用户登录成功                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  1. 调用 /permissions/menu-tree 接口                     │
│     获取用户的菜单树（根据角色和权限过滤）                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. 前端接收菜单树数据                                    │
│     示例：                                               │
│     [                                                    │
│       {                                                  │
│         "id": 1,                                         │
│         "name": "工作台",                                │
│         "code": "dashboard",                             │
│         "path": "/dashboard",                            │
│         "icon": "dashboard",                             │
│         "component": "dashboard"                         │
│       },                                                 │
│       {                                                  │
│         "id": 2,                                         │
│         "name": "AI对话",                                │
│         "code": "chat:view",                             │
│         "path": "/chat",                                 │
│         "icon": "chat",                                  │
│         "component": "chat"                              │
│       }                                                  │
│     ]                                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. 调用 generateRoutesFromMenu(menuTree)                │
│     将菜单树转换为 Vue Router 路由配置                    │
│                                                          │
│     转换规则：                                           │
│     - path: 菜单的 path 字段                             │
│     - name: 菜单的 code 字段                             │
│     - component: 动态导入 @/views/{component}/index.vue  │
│     - meta.title: 菜单的 name 字段                       │
│     - meta.icon: 菜单的 icon 字段                        │
│     - meta.permission: 菜单的 code 字段                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. 使用 router.addRoute() 动态注册路由                  │
│     每个路由都会被添加到 Vue Router 实例中                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. 同时生成侧边栏菜单                                    │
│     menuStore.setMenuFromTree(menuTree)                  │
│     侧边栏根据菜单树自动渲染                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. 用户可以访问动态生成的路由                            │
│     例如：/dashboard, /chat, /memory 等                  │
└─────────────────────────────────────────────────────────┘
```

## 📊 数据库表结构

### permissions 表

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,           -- 权限名称（显示名称）
  code VARCHAR(100) UNIQUE NOT NULL,    -- 权限代码（唯一标识）
  type VARCHAR(20) NOT NULL,            -- 类型：menu | button
  parent_id UUID REFERENCES permissions(id), -- 父级权限ID
  path VARCHAR(200),                    -- 路由路径
  component VARCHAR(200),               -- 组件路径
  icon VARCHAR(50),                     -- 图标名称
  sort_order INTEGER DEFAULT 0,         -- 排序
  hidden BOOLEAN DEFAULT false,         -- 是否隐藏
  description TEXT,                     -- 描述
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 示例数据

```sql
-- 插入菜单权限
INSERT INTO permissions (name, code, type, path, component, icon, sort_order) VALUES
('工作台', 'dashboard', 'menu', '/dashboard', 'dashboard', 'dashboard', 1),
('AI对话', 'chat:view', 'menu', '/chat', 'chat', 'chat', 2),
('智能体', 'agent:view', 'menu', '/agent', 'agent', 'agent', 3),
('知识库', 'knowledge:view', 'menu', '/knowledge', 'knowledge', 'knowledge', 4),
('记忆管理', 'memory:view', 'menu', '/memory', 'memory', 'memory', 5),
('工具', 'tools:view', 'menu', '/tools', 'tools', 'tools', 6),
('系统设置', 'settings:view', 'menu', '/settings', 'settings', 'settings', 7),
('API文档', 'docs:view', 'menu', '/docs', 'ApiDocs', 'docs', 8),
('对话日志', 'logs:view', 'menu', '/ChatLogs', 'ChatLogs', 'logs', 9),
('用户管理', 'user:read', 'menu', '/user-management', 'user-management', 'people', 10),
('角色管理', 'role:read', 'menu', '/role-management', 'role-management', 'shield', 11),
('权限管理', 'permission:read', 'menu', '/permission-management', 'permission-management', 'key', 12);

-- 插入按钮权限（作为子节点）
INSERT INTO permissions (name, code, type, parent_id) VALUES
('创建用户', 'user:create', 'button', (SELECT id FROM permissions WHERE code = 'user:read')),
('编辑用户', 'user:update', 'button', (SELECT id FROM permissions WHERE code = 'user:read')),
('删除用户', 'user:delete', 'button', (SELECT id FROM permissions WHERE code = 'user:read'));
```

## 🔧 前端实现

### 1. 路由配置文件 (`src/router/routes.js`)

```javascript
import Layout from '@/layouts/index.vue'

// 静态路由（无需权限）
export const constantRoutes = [
  { path: '/login', ... },
  { path: '/403', ... },
  { path: '/404', ... },
]

// 异步路由（从后端动态获取）
export const asyncRoutes = [] // ⚠️ 不再硬编码！

/**
 * 将后端菜单树转换为路由配置
 */
export function generateRoutesFromMenu(menuTree) {
  const routes = []

  // 创建根路由（Layout）
  const rootRoute = {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [],
  }

  menuTree.forEach((menu) => {
    if (!menu.path) return

    const route = {
      path: menu.path.startsWith('/') ? menu.path.slice(1) : menu.path,
      name: menu.code || menu.name,
      component: () => import(`@/views/${menu.component || menu.path}/index.vue`),
      meta: {
        title: menu.name,
        icon: menu.icon,
        permission: menu.code,
        hidden: menu.hidden || false,
      },
    }

    // 处理子菜单
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children.map(child => ({
        path: child.path.slice(1),
        name: child.code,
        component: () => import(`@/views/${child.component || child.path}/index.vue`),
        meta: { ... }
      }))
    }

    rootRoute.children.push(route)
  })

  routes.push(rootRoute)
  return routes
}
```

### 2. 路由守卫 (`src/router/guard.js`)

```javascript
import { generateRoutesFromMenu } from './routes'

router.beforeEach(async (to, from) => {
  const hasToken = userStore.token

  if (hasToken) {
    if (to.path === '/login') {
      return '/' // 已登录重定向到首页
    }

    // 检查是否已生成动态路由
    if (!permissionStore.isRoutesGenerated) {
      try {
        // 标记为已生成，防止重复请求
        permissionStore.isRoutesGenerated = true

        // 从后端获取菜单树和权限
        await permissionStore.fetchUserPermissions()

        // ✅ 关键：根据菜单树动态生成路由
        const menuTree = permissionStore.menuTree
        const dynamicRoutes = generateRoutesFromMenu(menuTree)

        // 动态注册路由
        dynamicRoutes.forEach((route) => {
          router.addRoute(route)
        })

        // 生成侧边栏菜单
        menuStore.setMenuFromTree(menuTree)

        // 重新导航到目标路由
        return { ...to, replace: true }
      } catch (error) {
        // 失败则退出登录
        userStore.logout()
        return '/login'
      }
    }

    return true // 已生成路由，直接放行
  } else {
    // 未登录，检查白名单
    if (whiteList.includes(to.path)) {
      return true
    }
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

### 3. Permission Store (`src/stores/modules/permission.js`)

```javascript
export const usePermissionStore = defineStore('permission', () => {
  const menuTree = ref([]) // 菜单树
  const permissions = ref([]) // 权限代码列表

  /**
   * 从后端获取用户权限和菜单数据
   */
  async function fetchUserPermissions() {
    const [menuTreeRes, permissionsRes] = await Promise.all([
      getMenuTree(), // GET /permissions/menu-tree
      getMyPermissions(), // GET /permissions/my-permissions
    ])

    // 设置菜单树
    setMenuTree(menuTreeRes.data)

    // 提取权限代码
    const permissionCodes = permissionsRes.data.map((p) => p.code)
    setPermissions(permissionCodes)
  }

  return {
    menuTree,
    permissions,
    fetchUserPermissions,
    // ... 其他方法
  }
})
```

## 📝 新增菜单步骤

### 方式一：通过数据库直接添加（推荐用于开发环境）

```sql
-- 1. 在 permissions 表中插入新菜单
INSERT INTO permissions (name, code, type, path, component, icon, sort_order)
VALUES (
  '新功能',              -- 显示名称
  'feature:view',        -- 权限代码
  'menu',                -- 类型
  '/feature',            -- 路由路径
  'feature',             -- 组件路径
  'flash',               -- 图标
  20                     -- 排序
);

-- 2. 给角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'admin'),
  (SELECT id FROM permissions WHERE code = 'feature:view');
```

### 方式二：通过权限管理页面添加（推荐用于生产环境）

1. 登录系统（使用 admin 账号）
2. 进入 **权限管理** 页面
3. 点击 **新增根菜单** 按钮
4. 填写表单：
   - 权限名称：新功能
   - 权限代码：feature:view
   - 权限类型：菜单
   - 路由路径：/feature
   - 组件路径：feature
   - 图标：flash
   - 排序：20
5. 保存后，刷新页面即可看到新菜单

### 前端需要做的事

✅ **只需要创建对应的 Vue 组件文件**：

```
src/views/feature/
  └── index.vue  ← 新建这个文件
```

```vue
<template>
  <div class="feature-container">
    <h1>新功能页面</h1>
  </div>
</template>

<script setup>
// 你的业务逻辑
</script>
```

❌ **不需要修改**：

- ~~routes.js~~ （不需要添加路由配置）
- ~~guard.js~~ （不需要修改路由守卫）
- ~~menu.js~~ （不需要手动添加菜单项）

## 🎨 菜单与路由的映射关系

| 数据库字段   | 路由配置字段            | 说明                       |
| ------------ | ----------------------- | -------------------------- |
| `path`       | `route.path`            | 路由路径（去掉开头的 `/`） |
| `code`       | `route.name`            | 路由名称（唯一标识）       |
| `component`  | `route.component`       | 组件路径（动态导入）       |
| `name`       | `route.meta.title`      | 页面标题                   |
| `icon`       | `route.meta.icon`       | 菜单图标                   |
| `code`       | `route.meta.permission` | 权限代码                   |
| `hidden`     | `route.meta.hidden`     | 是否隐藏                   |
| `sort_order` | -                       | 菜单排序（前端处理）       |

## 🔒 权限控制

### 路由级别权限

```javascript
// 路由守卫中自动检查
if (to.meta?.permission) {
  const hasPermission = permissionStore.hasPermission(to.meta.permission)
  if (!hasPermission) {
    return '/403' // 没有权限跳转到 403 页面
  }
}
```

### 按钮级别权限

```vue
<template>
  <!-- 没有权限的按钮自动隐藏 -->
  <n-button v-permission="'user:create'"> 创建用户 </n-button>

  <n-button v-permission="'user:delete'"> 删除用户 </n-button>
</template>
```

## 🚀 优势总结

### 1. 灵活性

- ✅ 新增菜单只需在数据库中添加记录
- ✅ 可以为不同用户/角色定制不同的菜单
- ✅ 支持动态调整菜单顺序、图标等

### 2. 可维护性

- ✅ 路由配置集中管理，避免前后端不一致
- ✅ 减少前端代码量，降低维护成本
- ✅ 支持热更新，无需重新部署前端

### 3. 安全性

- ✅ 后端控制哪些菜单对用户可见
- ✅ 权限验证在后端进行，前端只是展示
- ✅ 防止前端篡改路由配置

### 4. 扩展性

- ✅ 支持多租户场景（不同租户有不同的菜单）
- ✅ 支持个性化菜单（根据用户偏好定制）
- ✅ 支持 A/B 测试（不同用户看到不同的菜单）

## ⚠️ 注意事项

### 1. 组件路径规范

数据库中 `component` 字段的值应该对应 `src/views/` 下的目录名：

```
component: 'dashboard'  →  src/views/dashboard/index.vue
component: 'chat'       →  src/views/chat/index.vue
component: 'ApiDocs'    →  src/views/ApiDocs/index.vue
```

### 2. 路由路径规范

- 必须以 `/` 开头
- 建议使用小写字母和连字符
- 避免使用特殊字符

```
✅ /dashboard
✅ /user-management
✅ /chat-logs

❌ dashboard        （缺少 /）
❌ /UserManagement  （大写字母）
❌ /user_management （下划线）
```

### 3. 权限代码规范

建议使用 `模块:操作` 格式：

```
✅ chat:view
✅ user:create
✅ role:update
✅ permission:delete

❌ view_chat
❌ create_user
❌ updateRole
```

### 4. 首次加载性能

- 菜单树数据应该在登录后一次性获取
- 使用 Pinia Store 缓存，避免重复请求
- 可以考虑使用 Service Worker 缓存静态资源

### 5. 错误处理

- 如果组件文件不存在，会抛出导入错误
- 建议在开发阶段确保组件文件存在
- 可以添加全局错误处理，捕获路由加载错误

## 🧪 测试方法

### 1. 查看动态生成的路由

```javascript
// 浏览器控制台
import router from '@/router'
console.log('所有路由:', router.getRoutes())
```

### 2. 查看菜单树

```javascript
// 浏览器控制台
import { usePermissionStore } from '@/stores/modules/permission'
const store = usePermissionStore()
console.log('菜单树:', store.menuTree)
console.log('权限列表:', store.permissions)
```

### 3. 测试新增菜单

```sql
-- 1. 添加新菜单
INSERT INTO permissions (name, code, type, path, component, icon, sort_order)
VALUES ('测试菜单', 'test:view', 'menu', '/test', 'test', 'flash', 99);

-- 2. 给 admin 角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'admin'),
  (SELECT id FROM permissions WHERE code = 'test:view');

-- 3. 刷新页面，应该能看到新菜单
```

### 4. 测试权限控制

```javascript
// 1. 使用普通用户登录（没有 test:view 权限）
// 2. 尝试访问 /test 页面
// 3. 应该被重定向到 403 页面
```

## 📚 相关文档

- [v-permission指令完全指南](./V_PERMISSION_COMPLETE_GUIDE.md)
- [RBAC权限系统架构](../koa2/docs/rbac-system.md)
- [数据库初始化指南](../koa2/docs/database-init-guide.md)

---

**提示**：这种动态路由架构是现代前端应用的最佳实践，特别适合中大型项目和多租户场景！
