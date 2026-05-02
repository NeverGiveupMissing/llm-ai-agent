# 权限 Store 使用说明

## 📋 概述

权限 Store 用于管理用户的权限数据和菜单树，实现基于 RBAC 的前端权限控制。

## 🔧 核心功能

### 1. 登录后自动获取权限数据

用户登录成功后，系统会自动从后端获取：
- **用户菜单树** - 用于动态生成侧边栏菜单
- **用户权限列表** - 用于按钮级权限控制

### 2. 数据持久化

- Token 存储在 `localStorage`
- 刷新页面后，路由守卫会自动重新获取权限数据

## 📁 相关文件

```
src/
├── api/
│   └── permission.js          # 权限相关 API 接口
├── stores/modules/
│   ├── user.js                # 用户状态管理
│   └── permission.js          # 权限状态管理 ✨
├── router/
│   └── guard.js               # 路由守卫（自动获取权限）
└── views/login/
    └── index.vue              # 登录页面（登录后获取权限）
```

## 🎯 使用示例

### 在组件中使用权限判断

```vue
<template>
  <div>
    <!-- 按钮级权限控制 -->
    <n-button v-if="hasPermission('user:create')">
      新建用户
    </n-button>
    
    <!-- 任一权限判断 -->
    <n-button v-if="hasAnyPermission(['user:update', 'user:delete'])">
      编辑或删除
    </n-button>
    
    <!-- 所有权限判断 -->
    <n-button v-if="hasAllPermissions(['user:read', 'user:update'])">
      查看并编辑
    </n-button>
  </div>
</template>

<script setup>
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// 解构获取方法
const { hasPermission, hasAnyPermission, hasAllPermissions } = permissionStore

// 或者直接调用
// permissionStore.hasPermission('user:create')
</script>
```

### 获取用户菜单树

```vue
<script setup>
import { usePermissionStore } from '@/stores/modules/permission'
import { storeToRefs } from 'pinia'

const permissionStore = usePermissionStore()

// 使用 storeToRefs 保持响应式
const { menuTree } = storeToRefs(permissionStore)

// menuTree.value 就是用户的菜单树数据
console.log('用户菜单:', menuTree.value)
</script>
```

### 手动刷新权限数据

```vue
<script setup>
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// 重新获取权限（例如：角色变更后）
async function refreshPermissions() {
  try {
    await permissionStore.fetchUserPermissions()
    console.log('✅ 权限刷新成功')
  } catch (error) {
    console.error('❌ 权限刷新失败', error)
  }
}
</script>
```

## 📊 Store 状态

### State

| 属性 | 类型 | 说明 |
|------|------|------|
| `permissions` | `Array<String>` | 用户权限代码列表 |
| `roles` | `Array<String>` | 用户角色列表 |
| `menuTree` | `Array<Object>` | 用户菜单树 |
| `dynamicRoutes` | `Array<Object>` | 动态路由 |
| `isRoutesGenerated` | `Boolean` | 是否已生成路由 |
| `isPermissionLoaded` | `Boolean` | 是否已加载权限 |

### Actions

| 方法 | 说明 | 参数 |
|------|------|------|
| `fetchUserPermissions()` | 从后端获取权限数据 | 无 |
| `setPermissions(list)` | 设置权限列表 | `Array<String>` |
| `setRoles(list)` | 设置角色列表 | `Array<String>` |
| `setMenuTree(tree)` | 设置菜单树 | `Array<Object>` |
| `hasPermission(code)` | 检查单个权限 | `String` |
| `hasAnyPermission(codes)` | 检查任一权限 | `Array<String>` |
| `hasAllPermissions(codes)` | 检查所有权限 | `Array<String>` |
| `resetPermission()` | 重置权限状态 | 无 |

## 🔄 权限数据流程

```
用户登录
  ↓
保存 Token 到 localStorage
  ↓
调用 fetchUserPermissions()
  ↓
并行请求两个接口:
  - GET /permissions/menu-tree (菜单树)
  - GET /permissions/my-permissions (权限列表)
  ↓
数据存储到 Pinia Store
  ↓
组件中使用权限判断
```

## 🛡️ 路由守卫集成

路由守卫会在以下时机自动获取权限：

1. **登录后首次访问** - 在登录页面调用 `fetchUserPermissions()`
2. **页面刷新** - 路由守卫检测到有 Token 但未加载权限，自动获取

```javascript
// router/guard.js
router.beforeEach(async (to, from) => {
  const hasToken = userStore.token
  
  if (hasToken) {
    const hasGeneratedRoutes = permissionStore.isRoutesGenerated
    
    if (!hasGeneratedRoutes) {
      // 自动获取权限数据
      await permissionStore.fetchUserPermissions()
    }
  }
})
```

## ⚠️ 注意事项

1. **权限代码格式** - 后端返回的权限 `code` 字段，如 `user:read`, `role:create`
2. **菜单树格式** - 树形结构，支持 `children` 嵌套
3. **错误处理** - 权限获取失败不影响登录，但会记录错误日志
4. **性能优化** - 使用 `Promise.all` 并行请求，减少等待时间

## 🐛 调试技巧

```javascript
// 在浏览器控制台查看权限数据
const permissionStore = usePermissionStore()
console.log('权限列表:', permissionStore.permissions)
console.log('菜单树:', permissionStore.menuTree)
console.log('是否有权限:', permissionStore.hasPermission('user:create'))
```

---

**提示**：所有权限数据都从后端动态获取，无需在前端硬编码权限列表！
