# 动态路由系统使用说明

## 📋 概述

动态路由系统根据后端返回的权限数据，动态注册路由和生成侧边栏菜单，实现细粒度的权限控制。

##  核心功能

### 1. 动态路由注册
- 登录后从后端获取用户权限列表
- 根据权限过滤可访问的路由
- 动态注册到 Vue Router

### 2. 权限验证
- 路由级权限检查
- 无权限自动跳转 403 页面
- 未登录自动跳转登录页

### 3. 动态菜单生成
- 根据后端菜单树生成侧边栏
- 自动匹配图标
- 支持多级嵌套菜单

## 📁 相关文件

```
src/
├── router/
│   ├── index.js              # 路由入口
│   ├── guard.js              # 路由守卫（权限验证）
│   ── routes.js             # 路由配置（静态+异步）
├── stores/modules/
│   ├── permission.js         # 权限状态管理
│   └── menu.js               # 菜单状态管理
└── views/
    ── error/
        └── 403.vue           # 无权限页面
```

## 🔄 工作流程

```
用户登录
  ↓
保存 Token
  ↓
路由守卫触发
  ↓
获取用户权限和菜单树
  ├─ GET /permissions/menu-tree → 菜单树
  └─ GET /permissions/my-permissions → 权限列表
  ↓
根据权限过滤路由
  ↓
动态注册路由 (router.addRoute)
  ↓
生成侧边栏菜单
  ↓
用户访问页面
  ├─ 有权限 → 正常访问
  └─ 无权限 → 跳转 403
```

## 🎯 路由配置

### 静态路由（无需权限）
```javascript
// src/router/routes.js
export const constantRoutes = [
  { path: '/login', name: 'Login', ... },
  { path: '/403', name: 'Forbidden', ... },
  { path: '/404', name: 'NotFound', ... },
]
```

### 异步路由（需要权限）
```javascript
export const asyncRoutes = [
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/chat/index.vue'),
    meta: {
      title: 'AI对话',
      icon: 'chat',
      permission: 'chat:view', // 需要的权限代码
    },
  },
]
```

## 🔐 权限控制

### 路由级权限
在路由 meta 中声明需要的权限：

```javascript
{
  path: '/settings',
  name: 'Settings',
  meta: {
    permission: 'settings:view', // 需要 settings:view 权限
  }
}
```

### 按钮级权限
在组件中使用 permission store：

```vue
<template>
  <n-button v-if="hasPermission('user:create')">
    新建用户
  </n-button>
</template>

<script setup>
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()
const { hasPermission } = permissionStore
</script>
```

##  菜单图标映射

系统支持以下图标类型：

| 图标类型 | 说明 |
|---------|------|
| `dashboard` | 工作台 |
| `chat` | AI对话 |
| `agent` | 智能体 |
| `knowledge` | 知识库 |
| `memory` | 记忆管理 |
| `tools` | 工具 |
| `logs` | 对话日志 |
| `docs` | API文档 |
| `settings` | 系统设置 |

## 📊 Store 状态

### Permission Store
```javascript
{
  permissions: ['chat:view', 'user:read', ...],  // 权限列表
  menuTree: [...],                                // 菜单树
  isRoutesGenerated: true,                        // 路由是否已生成
  hasPermission(code)                             // 检查权限方法
}
```

### Menu Store
```javascript
{
  menuOptions: [...],                             // 菜单配置
  setMenuFromTree(tree)                           // 从菜单树生成配置
}
```

## ️ 注意事项

1. **权限代码格式** - 建议使用 `模块:操作` 格式，如 `user:create`
2. **路由名称唯一** - 每个路由的 name 必须唯一
3. **组件路径正确** - 确保 `@/views/` 路径正确
4. **刷新页面** - 路由守卫会自动重新获取权限
5. **403 页面** - 无权限时自动跳转，无需手动处理

## 🐛 调试技巧

```javascript
// 在浏览器控制台查看路由和权限
import { usePermissionStore } from '@/stores/modules/permission'
import { useMenuStore } from '@/stores/modules/menu'

const permissionStore = usePermissionStore()
const menuStore = useMenuStore()

console.log('权限列表:', permissionStore.permissions)
console.log('菜单树:', permissionStore.menuTree)
console.log('菜单选项:', menuStore.menuOptions)
console.log('路由是否生成:', permissionStore.isRoutesGenerated)

// 查看当前路由
import router from '@/router'
console.log('已注册路由:', router.getRoutes())
```

##  后端数据格式

### 菜单树格式
```json
[
  {
    "id": "uuid",
    "name": "AI对话",
    "code": "chat:view",
    "path": "/chat",
    "icon": "chat",
    "type": "menu",
    "children": []
  }
]
```

### 权限列表格式
```json
[
  {
    "id": "uuid",
    "name": "查看对话",
    "code": "chat:view",
    "type": "button"
  }
]
```

---

**提示**：所有路由和菜单都从后端动态生成，前端无需硬编码！
