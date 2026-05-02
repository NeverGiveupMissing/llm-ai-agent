# 前端权限Store使用文档

## 📋 概述

本文档描述了前端权限Store（permissionStore）的使用方法和最佳实践。权限Store负责管理用户的菜单树和权限编码，提供权限判断方法。

## 🎯 核心功能

### 1. 登录后获取菜单和权限

登录成功后，自动调用 `/nodeapi/permissions/user/menu` 接口获取：
- **menuList**：菜单树（用于渲染侧边栏菜单）
- **permissionCodes**：权限编码数组（如 `['user:list', 'user:add']`）

### 2. 权限判断

提供 `hasPermission(code)` 方法判断用户是否拥有某个权限。

### 3. 退出登录清空状态

退出登录时，清空所有store状态并跳转到登录页。

---

## 📦 Store结构

### State

```javascript
{
  menuList: [],              // 菜单树数组
  permissionCodes: [],       // 权限编码数组
  roles: [],                 // 角色列表
  dynamicRoutes: [],         // 动态路由
  isRoutesGenerated: false,  // 是否已生成动态路由
  isPermissionLoaded: false  // 是否已加载权限数据
}
```

### Methods

```javascript
{
  hasPermission(code),           // 判断是否有某权限
  hasAnyPermission(codes),       // 判断是否有任一权限
  hasAllPermissions(codes),      // 判断是否有所有权限
  fetchUserPermissions(),        // 从后端获取权限数据
  setMenuList(menuData),         // 设置菜单树
  setPermissionCodes(codes),     // 设置权限编码
  resetPermission()              // 重置权限状态
}
```

---

## 🚀 使用方法

### 1. 引入Store

```javascript
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()
```

### 2. 登录后获取权限数据

登录成功后，自动调用 `fetchUserPermissions()`：

```javascript
// src/views/login/index.vue
async function handleLogin() {
  try {
    const res = await login({
      username: formData.username,
      password: formData.password,
    })

    // 保存 token
    userStore.setToken(res.data.token)
    
    // ⭐ 获取用户权限和菜单数据
    await permissionStore.fetchUserPermissions()
    
    // 跳转到首页
    router.push('/')
  } catch (error) {
    message.error('登录失败')
  }
}
```

### 3. 判断权限

#### 方法一：在模板中使用

```vue
<template>
  <!-- 显示有权限的按钮 -->
  <n-button v-if="permissionStore.hasPermission('user:create')">
    创建用户
  </n-button>
  
  <n-button v-if="permissionStore.hasPermission('user:delete')">
    删除用户
  </n-button>
</template>

<script setup>
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()
</script>
```

#### 方法二：在脚本中使用

```javascript
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

function handleAction() {
  if (permissionStore.hasPermission('user:update')) {
    // 执行更新操作
  } else {
    message.warning('您没有权限执行此操作')
  }
}
```

#### 方法三：检查多个权限

```javascript
// 检查是否有任一权限
if (permissionStore.hasAnyPermission(['user:create', 'user:update'])) {
  // 有创建或更新权限
}

// 检查是否有所有权限
if (permissionStore.hasAllPermissions(['user:read', 'user:write'])) {
  // 同时有读取和写入权限
}
```

### 4. 获取菜单树

```vue
<template>
  <n-menu :options="menuOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// 将菜单树转换为 Naive UI 菜单格式
const menuOptions = computed(() => {
  return convertToMenuItems(permissionStore.menuList)
})

function convertToMenuItems(menuTree) {
  return menuTree.map(item => ({
    label: item.name,
    key: item.code,
    icon: item.icon ? () => h(Icon, { name: item.icon }) : undefined,
    children: item.children?.length > 0 
      ? convertToMenuItems(item.children) 
      : undefined,
    onClick: () => {
      if (item.path) {
        router.push(item.path)
      }
    }
  }))
}
</script>
```

### 5. 退出登录清空状态

```javascript
// src/components/Layout/Header/UserDropdown.vue
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

function handleLogout() {
  // ⭐ 清空所有 store 状态
  userStore.logout()
  
  // ⭐ 跳转到登录页
  router.push({ name: 'Login' })
}
```

---

## 🔧 API接口

### 1. getMenuTree()

**接口地址**：`GET /nodeapi/permissions/user/menu`

**返回数据**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "uuid1",
      "name": "系统管理",
      "code": "system",
      "path": "/system",
      "icon": "settings",
      "children": [
        {
          "id": "uuid2",
          "name": "用户管理",
          "code": "user:manage",
          "path": "/system/users",
          "icon": "people",
          "children": []
        }
      ]
    }
  ]
}
```

### 2. getMyPermissions()

**接口地址**：`GET /nodeapi/permissions/my-permissions`

**返回数据**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "data": [
      {
        "id": "uuid1",
        "code": "user:read",
        "name": "查看用户",
        "type": "button"
      },
      {
        "id": "uuid2",
        "code": "user:create",
        "name": "创建用户",
        "type": "button"
      }
    ],
    "total": 15
  }
}
```

---

## 💡 最佳实践

### 1. 组件内权限控制

```vue
<template>
  <div>
    <!-- 根据权限显示不同内容 -->
    <n-button 
      v-if="canCreate" 
      type="primary" 
      @click="handleCreate"
    >
      创建
    </n-button>
    
    <n-button 
      v-if="canDelete" 
      type="error" 
      @click="handleDelete"
    >
      删除
    </n-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// 使用 computed 缓存权限判断结果
const canCreate = computed(() => 
  permissionStore.hasPermission('user:create')
)

const canDelete = computed(() => 
  permissionStore.hasPermission('user:delete')
)

function handleCreate() {
  // 创建逻辑
}

function handleDelete() {
  // 删除逻辑
}
</script>
```

### 2. 路由守卫中使用权限

```javascript
// src/router/guard.js
import { usePermissionStore } from '@/stores/modules/permission'

router.beforeEach(async (to, from, next) => {
  const permissionStore = usePermissionStore()
  
  // 如果权限未加载，先加载
  if (!permissionStore.isPermissionLoaded) {
    try {
      await permissionStore.fetchUserPermissions()
    } catch (error) {
      next('/login')
      return
    }
  }
  
  // 检查路由权限
  if (to.meta.permission) {
    const hasPermission = permissionStore.hasPermission(to.meta.permission)
    if (!hasPermission) {
      next('/403')
      return
    }
  }
  
  next()
})
```

### 3. 自定义权限指令

```javascript
// src/directives/permission.js
import { usePermissionStore } from '@/stores/modules/permission'

export default {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding
    
    if (value && !permissionStore.hasPermission(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}

// 使用
// <n-button v-permission="'user:create'">创建</n-button>
```

### 4. 批量权限检查

```javascript
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// 检查是否有管理权限（创建、更新、删除）
const hasManagePermission = computed(() => 
  permissionStore.hasAnyPermission([
    'user:create',
    'user:update',
    'user:delete'
  ])
)

// 检查是否有完整的管理权限
const hasFullPermission = computed(() => 
  permissionStore.hasAllPermissions([
    'user:read',
    'user:create',
    'user:update',
    'user:delete'
  ])
)
```

---

## 🔄 生命周期

### 1. 登录流程

```
用户登录
  ↓
保存 Token
  ↓
调用 fetchUserPermissions()
  ↓
并行请求：
  - GET /nodeapi/permissions/user/menu  → menuList
  - GET /nodeapi/permissions/my-permissions → permissionCodes
  ↓
存储到 Pinia Store
  ↓
跳转到首页
```

### 2. 退出登录流程

```
用户点击退出
  ↓
调用 userStore.logout()
  ↓
清空 Token
  ↓
调用 permissionStore.resetPermission()
  ↓
清空 menuList、permissionCodes、roles、dynamicRoutes
  ↓
调用 menuStore.resetMenu()
  ↓
跳转到登录页
```

---

## ⚠️ 注意事项

### 1. 权限数据加载时机

✅ **正确**：登录成功后立即加载

```javascript
await permissionStore.fetchUserPermissions()
router.push('/')
```

❌ **错误**：每次路由切换都加载

```javascript
// 不要在路由守卫中每次都加载
router.beforeEach(async (to, from, next) => {
  await permissionStore.fetchUserPermissions() // ❌ 重复请求
  next()
})
```

### 2. 权限判断性能

✅ **推荐**：使用 computed 缓存

```javascript
const canEdit = computed(() => 
  permissionStore.hasPermission('user:update')
)
```

❌ **不推荐**：直接在模板中调用

```vue
<!-- 每次渲染都会重新计算 -->
<n-button v-if="permissionStore.hasPermission('user:update')">
```

### 3. 异步加载处理

```javascript
async function loadData() {
  // 等待权限数据加载完成
  if (!permissionStore.isPermissionLoaded) {
    await permissionStore.fetchUserPermissions()
  }
  
  // 现在可以安全地使用权限判断
  if (permissionStore.hasPermission('data:read')) {
    // 加载数据
  }
}
```

### 4. 错误处理

```javascript
try {
  await permissionStore.fetchUserPermissions()
  console.log('✅ 权限数据加载成功')
} catch (error) {
  console.error('❌ 权限数据加载失败:', error)
  // 可以选择跳转到错误页面或显示提示
  message.error('权限数据加载失败，请刷新页面重试')
}
```

---

## 🧪 测试示例

### 1. 单元测试

```javascript
import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore } from '@/stores/modules/permission'

describe('permissionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should check permission correctly', () => {
    const store = usePermissionStore()
    
    // 设置权限
    store.setPermissionCodes(['user:read', 'user:create'])
    
    // 测试单个权限
    expect(store.hasPermission('user:read')).toBe(true)
    expect(store.hasPermission('user:delete')).toBe(false)
    
    // 测试任一权限
    expect(store.hasAnyPermission(['user:read', 'user:delete'])).toBe(true)
    
    // 测试所有权限
    expect(store.hasAllPermissions(['user:read', 'user:create'])).toBe(true)
  })

  it('should reset permissions correctly', () => {
    const store = usePermissionStore()
    
    store.setPermissionCodes(['user:read'])
    store.setMenuList([{ name: 'Test' }])
    
    store.resetPermission()
    
    expect(store.permissionCodes).toEqual([])
    expect(store.menuList).toEqual([])
    expect(store.isPermissionLoaded).toBe(false)
  })
})
```

### 2. 集成测试

```javascript
import { mount } from '@vue/test-utils'
import PermissionButton from '@/components/PermissionButton.vue'

it('should show button when has permission', async () => {
  const wrapper = mount(PermissionButton, {
    props: {
      permission: 'user:create'
    },
    global: {
      plugins: [createPinia()]
    }
  })
  
  const store = usePermissionStore()
  store.setPermissionCodes(['user:create'])
  
  await wrapper.vm.$nextTick()
  
  expect(wrapper.find('button').exists()).toBe(true)
})
```

---

## 📚 相关文档

- [后端权限API文档](../../docs/PERMISSION_MENU_API.md)
- [鉴权中间件文档](../../docs/AUTH_MIDDLEWARE.md)
- [RBAC权限系统架构](../../docs/RBAC_ARCHITECTURE.md)

---

## 🎉 总结

前端权限Store提供了完整的权限管理功能：

✅ **自动化**：登录后自动获取菜单和权限  
✅ **易用性**：简洁的API，方便的权限判断  
✅ **安全性**：退出登录自动清空所有状态  
✅ **灵活性**：支持单个、任一、所有权限判断  
✅ **响应式**：基于Pinia，自动更新UI  

**核心特性**：
- ✅ menuList：菜单树数据
- ✅ permissionCodes：权限编码数组
- ✅ hasPermission(code)：权限判断方法
- ✅ 退出登录清空状态并跳转

**下一步**：
1. 在需要的组件中使用 `hasPermission()` 进行权限控制
2. 使用 `menuList` 渲染动态菜单
3. 根据需要扩展更多权限相关功能
4. 添加权限变更监听（可选）

所有功能已经完成，可以直接使用！🚀
