# v-permission 指令完全使用指南

## 📋 概述

`v-permission` 是一个自定义Vue指令，用于控制按钮、菜单等元素的显示/隐藏。当用户没有相应权限时，会**直接移除DOM元素**（不是隐藏）。该指令已在 `src/main.js` 中全局注册，无需单独引入。

---

## 🎯 核心特性

### 1. **工作原理**

- 从 `permissionStore` 获取当前用户的权限列表（`permissionCodes`）
- 使用 `hasAnyPermission()` 方法进行权限比对
- 支持单个权限或多个权限（OR逻辑）
- 无权限时**直接移除DOM元素**（`parentNode.removeChild(el)`），而非隐藏

### 2. **指令名称**

```javascript
v - permission
```

### 3. **处理模式**

- **隐藏模式**（默认）：无权限时元素从 DOM 中完全移除
- **禁用模式**：无权限时元素被禁用而保留在 DOM 中

---

## 📖 使用方法

### 1. 单个权限控制

**基本语法**：

```vue
<template>
  <!-- 只有拥有 user:create 权限的用户才能看到此按钮 -->
  <n-button v-permission="'user:create'" @click="handleCreate"> 创建用户 </n-button>
</template>
```

**工作流程**：

- 用户有 `user:create` 权限 → 显示按钮
- 用户没有 `user:create` 权限 → 按钮被移除（DOM中不存在）

---

### 2. 多个权限控制（OR逻辑）

用户拥有任意一个权限即可看到元素：

```vue
<template>
  <!-- 拥有 user:create 或 user:update 任一权限即可看到 -->
  <n-button v-permission="['user:create', 'user:update']" @click="handleEdit"> 编辑用户 </n-button>
</template>
```

**效果**：

- 用户有 `user:create` → 显示
- 用户有 `user:update` → 显示
- 用户两者都没有 → 移除

---

### 3. 禁用模式

没有权限时，元素会被禁用而不是隐藏：

```vue
<template>
  <!-- 没有权限时按钮变灰且不可点击 -->
  <n-button v-permission="{ code: 'user:delete', type: 'disabled' }" @click="handleDelete">
    删除用户
  </n-button>
</template>
```

---

## 🏗️ 实现原理

### 1. **指令生命周期**

```javascript
export default {
  mounted(el, binding) {
    checkPermission(el, binding) // 挂载时检查
  },
  updated(el, binding) {
    checkPermission(el, binding) // 更新时检查
  },
}
```

### 2. **权限检查流程**

```
用户访问页面
  ↓
mounted 钩子触发
  ↓
checkPermission(el, binding)
  ↓
解析权限配置（字符串或数组）
  ↓
调用 permissionStore.hasAnyPermission(codes)
  ↓
有权限 → 保留元素
无权限 → el.parentNode.removeChild(el)
```

### 3. **核心代码**

```javascript
// src/directives/permission.js
function checkPermission(el, binding) {
  const permissionStore = usePermissionStore()
  const { value } = binding

  // 解析权限配置
  let permissionCodes = value

  // 支持字符串或数组
  if (typeof value === 'string') {
    permissionCodes = [value]
  } else if (Array.isArray(value)) {
    permissionCodes = value
  }

  // 检查权限（任一权限即可）
  const hasPermission = permissionStore.hasAnyPermission(permissionCodes)

  // 无权限时直接移除DOM元素
  if (!hasPermission) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
}
```

### 4. **相关文件结构**

```
src/
├── directives/
│   └── permission.js (48行)      # 指令实现
├── stores/modules/
│   └── permission.js (164行)     # Permission Store
└── main.js                       # 全局注册
```

---

## 💡 实际应用示例

### 示例1：用户管理页面

#### 模板中的按钮（使用 v-permission）

```vue
<template>
  <div class="user-management">
    <!-- 新增按钮 - 需要 user:create 权限 -->
    <n-button type="success" @click="showAddModal" v-permission="'user:create'">
      <template #icon>
        <n-icon><AddOutline /></n-icon>
      </template>
      新增用户
    </n-button>
  </div>
</template>
```

#### 表格操作列（使用 permissionStore.hasPermission）

```javascript
// render 函数中 - 因为 v-permission 无法在 h() 中使用
const columns = [
  {
    title: '操作',
    key: 'actions',
    render(row) {
      const buttons = []

      // 编辑按钮
      if (permissionStore.hasPermission('user:update')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleEdit(row),
            },
            { default: () => '编辑' },
          ),
        )
      }

      // 重置密码按钮
      if (permissionStore.hasPermission('user:reset-password')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleResetPassword(row),
            },
            { default: () => '重置密码' },
          ),
        )
      }

      // 分配角色按钮
      if (permissionStore.hasPermission('user:assign-role')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleAssignRole(row),
            },
            { default: () => '分配角色' },
          ),
        )
      }

      // 删除按钮
      if (permissionStore.hasPermission('user:delete')) {
        buttons.push(
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row.id),
            },
            {
              default: () => '确定要删除吗？',
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                  },
                  { default: () => '删除' },
                ),
            },
          ),
        )
      }

      return h(NSpace, {}, { default: () => buttons })
    },
  },
]
```

---

### 示例2：角色管理页面

```vue
<template>
  <div class="role-management">
    <!-- 新增角色 - 需要 role:create 权限 -->
    <n-button type="success" @click="showAddModal" v-permission="'role:create'">
      <template #icon
        ><n-icon><AddOutline /></n-icon
      ></template>
      新增角色
    </n-button>

    <!-- 表格 -->
    <n-data-table :columns="columns" :data="roleList" />
  </div>
</template>

<script setup>
const columns = [
  {
    title: '操作',
    key: 'actions',
    render(row) {
      const buttons = []

      // 编辑按钮
      if (permissionStore.hasPermission('role:update')) {
        buttons.push(h(NButton, { size: 'small' }, { default: () => '编辑' }))
      }

      // 分配权限按钮
      if (permissionStore.hasPermission('role:assign-permission')) {
        buttons.push(h(NButton, { size: 'small' }, { default: () => '分配权限' }))
      }

      // 启用/禁用按钮
      if (permissionStore.hasPermission('role:update') && !row.is_system) {
        buttons.push(h(NButton, { size: 'small' }, { default: () => '启用/禁用' }))
      }

      // 删除按钮
      if (permissionStore.hasPermission('role:delete') && !row.is_system) {
        buttons.push(
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row.id),
            },
            {
              default: () => '确定要删除吗？',
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                  },
                  { default: () => '删除' },
                ),
            },
          ),
        )
      }

      return h(NSpace, {}, { default: () => buttons })
    },
  },
]
</script>
```

---

### 示例3：权限管理页面

```javascript
const columns = [
  {
    title: '操作',
    key: 'actions',
    render: (row) => {
      const buttons = []

      // 编辑按钮
      if (permissionStore.hasPermission('permission:update')) {
        buttons.push(
          h(
            NButton,
            {
              size: 'small',
              onClick: () => emit('edit', row),
            },
            { default: () => '编辑' },
          ),
        )
      }

      // 删除按钮
      if (permissionStore.hasPermission('permission:delete')) {
        const hasChildren = row.children?.length > 0
        buttons.push(
          h(
            NPopconfirm,
            {
              onPositiveClick: () => emit('delete', row.id),
              disabled: hasChildren,
            },
            {
              default: () => (hasChildren ? '有子节点，不能删除' : '确定要删除吗？'),
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    disabled: hasChildren,
                  },
                  { default: () => '删除' },
                ),
            },
          ),
        )
      }

      return h(NSpace, {}, { default: () => buttons })
    },
  },
]
```

---

## 📝 权限代码规范

使用 `模块:操作` 格式定义权限代码：

| 权限代码                 | 说明     | 适用场景           |
| ------------------------ | -------- | ------------------ |
| `user:read`              | 查看用户 | 用户列表、详情     |
| `user:create`            | 创建用户 | 新增用户按钮       |
| `user:update`            | 更新用户 | 编辑用户按钮       |
| `user:delete`            | 删除用户 | 删除用户按钮       |
| `user:reset-password`    | 重置密码 | 重置密码按钮       |
| `user:assign-role`       | 分配角色 | 分配角色按钮       |
| `role:read`              | 查看角色 | 角色列表           |
| `role:create`            | 创建角色 | 新增角色按钮       |
| `role:update`            | 更新角色 | 编辑角色、分配权限 |
| `role:delete`            | 删除角色 | 删除角色按钮       |
| `role:assign-permission` | 分配权限 | 分配权限按钮       |
| `permission:read`        | 查看权限 | 权限列表           |
| `permission:create`      | 创建权限 | 新增权限按钮       |
| `permission:update`      | 更新权限 | 编辑权限按钮       |
| `permission:delete`      | 删除权限 | 删除权限按钮       |
| `log:read`               | 查看日志 | 日志列表           |

---

## 🎯 最佳实践

### 1. **模板中使用 v-permission**

```vue
<!-- ✅ 推荐 - 简洁明了 -->
<n-button v-permission="'user:create'">新增</n-button>
<n-button v-permission="['user:delete', 'user:edit']">管理</n-button>

<!-- ⚠️ 不推荐 - 冗长 -->
<n-button v-if="permissionStore.hasPermission('user:create')">新增</n-button>
```

**优点**：

- ✅ 代码简洁
- ✅ 语义清晰
- ✅ 统一规范

---

### 2. **render 函数中使用 permissionStore.hasPermission**

```javascript
// ✅ 正确做法 - 在 h() 中条件判断
render(row) {
  const buttons = []

  if (permissionStore.hasPermission('user:delete')) {
    buttons.push(h(NButton, { ... }, { default: () => '删除' }))
  }

  return h(NSpace, {}, { default: () => buttons })
}

// ❌ 错误做法 - v-permission 无法在 h() 中使用
render(row) {
  return h(NButton, {
    directive: { name: 'permission', value: 'user:delete' }  // ❌ 无效
  }, { default: () => '删除' })
}
```

**原因**：

- `v-permission` 是指令，只能在模板中使用
- `h()` 函数返回 VNode，不支持指令语法
- 使用条件判断是最直接、最高效的方式
- 无权限时不创建VNode比移除更高效

---

### 3. **权限控制的两种场景对比**

| 场景                        | 实现方式                          | 示例                                                        | 优点              |
| --------------------------- | --------------------------------- | ----------------------------------------------------------- | ----------------- |
| **模板中的静态按钮**        | `v-permission`                    | `<n-button v-permission="'user:create'">`                   | 简洁、自动移除DOM |
| **render 函数中的动态按钮** | `permissionStore.hasPermission()` | `if (permissionStore.hasPermission('user:delete')) { ... }` | 高效、不创建VNode |

---

## ✅ 权限控制覆盖情况

### 用户管理页面

| 按钮位置      | 权限编码              | 实现方式          | 状态      |
| ------------- | --------------------- | ----------------- | --------- |
| 新增用户按钮  | `user:create`         | `v-permission`    | ✅ 已应用 |
| 编辑按钮      | `user:update`         | `hasPermission()` | ✅ 已应用 |
| 重置密码按钮  | `user:reset-password` | `hasPermission()` | ✅ 已应用 |
| 分配角色按钮  | `user:assign-role`    | `hasPermission()` | ✅ 已应用 |
| 启用/禁用按钮 | `user:update`         | `hasPermission()` | ✅ 已应用 |
| 删除按钮      | `user:delete`         | `hasPermission()` | ✅ 已应用 |

### 角色管理页面

| 按钮位置      | 权限编码                 | 实现方式          | 状态      |
| ------------- | ------------------------ | ----------------- | --------- |
| 新增角色按钮  | `role:create`            | `v-permission`    | ✅ 已应用 |
| 编辑按钮      | `role:update`            | `hasPermission()` | ✅ 已应用 |
| 分配权限按钮  | `role:assign-permission` | `hasPermission()` | ✅ 已应用 |
| 启用/禁用按钮 | `role:update`            | `hasPermission()` | ✅ 已应用 |
| 删除按钮      | `role:delete`            | `hasPermission()` | ✅ 已应用 |

### 权限管理页面

| 按钮位置       | 权限编码            | 实现方式          | 状态      |
| -------------- | ------------------- | ----------------- | --------- |
| 新增根节点按钮 | `permission:create` | `v-permission`    | ✅ 已应用 |
| 编辑按钮       | `permission:update` | `hasPermission()` | ✅ 已应用 |
| 删除按钮       | `permission:delete` | `hasPermission()` | ✅ 已应用 |

---

## ⚠️ 注意事项

### 1. **权限数据加载时机**

确保在使用 `v-permission` 之前，权限数据已经加载完成：

```javascript
// 在路由守卫中加载权限
await permissionStore.fetchUserPermissions()
```

### 2. **权限数据必须完整**

权限数据未加载时，所有元素都会被移除，导致页面无法操作。

### 3. **权限代码区分大小写**

```vue
<!-- ✅ 正确 -->
<n-button v-permission="'user:create'">新增</n-button>

<!-- ❌ 错误 - 大小写不匹配 -->
<n-button v-permission="'user:Create'">新增</n-button>
```

### 4. **不能同时使用 v-permission 和 v-if**

```vue
<!-- ❌ 不推荐 - 两个条件重复 -->
<n-button v-permission="'user:create'" v-if="someCondition">
  新增
</n-button>

<!-- ✅ 推荐 - 组合权限条件 -->
<n-button v-permission="'user:create'" :disabled="!someCondition">
  新增
</n-button>
```

---

## 🔧 故障排除

### 问题1：按钮没有被隐藏

**可能原因**：

- 权限数据还未加载
- 权限代码拼写错误（大小写不匹配）
- 权限代码在数据库中不存在

**解决方案**：

```javascript
// 检查权限数据
console.log('用户权限:', permissionStore.permissionCodes)
// 检查特定权限是否存在
console.log('user:create:', permissionStore.hasPermission('user:create'))
```

### 问题2：render 函数中按钮显示不正确

**可能原因**：

- 使用了 `v-permission` 指令（在 h() 中无效）
- 权限检查返回值错误

**解决方案**：

```javascript
// ✅ 正确用法
if (permissionStore.hasPermission('user:delete')) {
  buttons.push(h(NButton, { ... }))
}
```

---

## 📚 相关资源

- [Permission Store 文档](FRONTEND_PERMISSION_STORE.md)
- [权限菜单管理 API](PERMISSION_MENU_API.md)
- [权限管理页面](PERMISSION_MANAGEMENT_PAGE.md)
