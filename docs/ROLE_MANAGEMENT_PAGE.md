# 角色管理页面使用文档

## 📋 概述

本文档描述了角色管理页面的功能和使用方法，包括角色列表、CRUD操作、权限分配、树形勾选等。

## 🎯 核心功能

### 1. **角色列表表格** ✅

| 列名 | 字段 | 说明 |
|------|------|------|
| ID | id | 角色唯一标识 |
| 角色名 | display_name | 角色显示名称 |
| 角色编码 | name | 角色英文标识 |
| 描述 | description | 角色描述信息 |
| 状态 | is_system | 系统角色/正常角色 |
| 创建时间 | created_at | 角色创建时间 |
| 操作 | actions | 编辑/分配权限/启用禁用/删除 |

### 2. **操作按钮** ✅

| 按钮 | 权限编码 | 说明 |
|------|---------|------|
| 编辑 | role:update | 编辑角色信息 |
| 分配权限 | role:assign-permission | 为角色分配权限 |
| 启用/禁用 | role:update | 切换角色状态 |
| 删除 | role:delete | 删除角色（系统角色不可删除） |

### 3. **分配权限弹窗使用 NTree 组件** ✅

- ✅ 树形结构展示权限
- ✅ 支持勾选/取消勾选
- ✅ 支持半选状态（父节点部分子节点选中）
- ✅ 级联选择（cascade）
- ✅ 显示不相关节点（show-irrelevant-nodes）

### 4. **v-permission 指令控制显隐** ✅

所有操作按钮都使用 `permissionStore.hasPermission()` 进行权限判断，无权限的按钮自动隐藏。

---

## 🏗️ 页面结构

```
┌─────────────────────────────────────────────┐
│           角色管理 (n-card)                  │
├─────────────────────────────────────────────┤
│                                             │
│  🔍 搜索框  [搜索] [重置] [+新增角色]        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───┬──────┬──────┬──────┬────┬────┬────┐ │
│  │ID │角色名│编码  │描述  │状态│时间│操作│ │
│  ├───┼──────┼──────┼──────┼────┼────┼────┤ │
│  │ 1 │管理员│admin │...   │系统│... │...│ │
│  │ 2 │普通用户│user │...   │正常│... │...│ │
│  └───┴──────┴──────┴──────┴────┴────┴────┘ │
│                                             │
│         [上一页] 1 2 3 [下一页]              │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         分配权限弹窗 (n-modal)               │
├─────────────────────────────────────────────┤
│ 当前角色：管理员                              │
├─────────────────────────────────────────────┤
│ ☑ 系统管理                                   │
│   ☑ 用户管理                                 │
│     ☑ 查看用户                               │
│     ☑ 创建用户                               │
│     ☐ 删除用户                               │
│   ☑ 角色管理                                 │
│     ☑ 查看角色                               │
│     ☐ 创建角色                               │
│ ☐ AI对话                                     │
│   ☐ 对话管理                                 │
├─────────────────────────────────────────────┤
│                        [取消]  [保存]         │
└─────────────────────────────────────────────┘
```

---

## 📦 核心代码

### 1. 表格列定义

```javascript
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 100,
    ellipsis: { tooltip: true },
  },
  {
    title: '角色名',
    key: 'display_name',
    width: 150,
  },
  {
    title: '角色编码',
    key: 'name',
    width: 150,
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'is_system',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.is_system ? 'warning' : 'success' },
        { default: () => (row.is_system ? '系统' : '正常') }
      )
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render(row) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right',
    render(row) {
      const buttons = []
      
      // 编辑按钮（需要 role:update 权限）
      if (permissionStore.hasPermission('role:update')) {
        buttons.push(
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, 
            { default: () => '编辑' })
        )
      }
      
      // 分配权限按钮（需要 role:assign-permission 权限）
      if (permissionStore.hasPermission('role:assign-permission')) {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleAssignPermissions(row) }, 
            { default: () => '分配权限' })
        )
      }
      
      // 启用/禁用按钮（需要 role:update 权限，且非系统角色）
      if (permissionStore.hasPermission('role:update') && !row.is_system) {
        buttons.push(
          h(NButton, { 
            size: 'small', 
            type: row.status === 'active' ? 'warning' : 'success',
            onClick: () => handleToggleStatus(row)
          }, 
            { default: () => row.status === 'active' ? '禁用' : '启用' })
        )
      }
      
      // 删除按钮（需要 role:delete 权限，且非系统角色）
      if (permissionStore.hasPermission('role:delete') && !row.is_system) {
        buttons.push(
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
            default: () => '确定要删除此角色吗？',
            trigger: () => h(NButton, { size: 'small', type: 'error' }, 
              { default: () => '删除' })
          })
        )
      }
      
      return h(NSpace, {}, { default: () => buttons })
    },
  },
]
```

---

### 2. NTree 权限树配置

```vue
<n-tree
  :data="permissionTreeData"
  :checked-keys="checkedPermissionKeys"
  checkable
  cascade
  expand-on-click
  block-line
  show-irrelevant-nodes
  @update:checked-keys="handleCheckedKeysChange"
/>
```

**关键属性**：

- ✅ `checkable`：支持勾选
- ✅ `cascade`：级联选择（支持半选状态）
- ✅ `expand-on-click`：点击展开/收起
- ✅ `block-line`：块级显示
- ✅ `show-irrelevant-nodes`：显示不相关节点（未选中的节点也显示）

**数据格式转换**：

```javascript
// 转换权限树格式为Naive UI Tree格式
const transformPermissionTree = (permissions) => {
  return permissions.map((perm) => ({
    key: perm.id,
    label: `${perm.name} (${perm.code})`,
    children: perm.children && perm.children.length > 0 
      ? transformPermissionTree(perm.children) 
      : undefined,
  }))
}
```

**示例数据**：

```javascript
[
  {
    key: 'uuid1',
    label: '系统管理 (system)',
    children: [
      {
        key: 'uuid2',
        label: '用户管理 (user:manage)',
        children: [
          { key: 'uuid3', label: '查看用户 (user:read)' },
          { key: 'uuid4', label: '创建用户 (user:create)' },
          { key: 'uuid5', label: '删除用户 (user:delete)' },
        ]
      }
    ]
  }
]
```

---

### 3. 权限控制实现

**引入 permissionStore**：

```javascript
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()
```

**在 render 函数中使用**：

```javascript
// 编辑按钮
if (permissionStore.hasPermission('role:update')) {
  buttons.push(h(NButton, ...))
}

// 分配权限按钮
if (permissionStore.hasPermission('role:assign-permission')) {
  buttons.push(h(NButton, ...))
}

// 删除按钮
if (permissionStore.hasPermission('role:delete') && !row.is_system) {
  buttons.push(h(NButton, ...))
}
```

**模板中的 v-permission**：

```vue
<n-button type="success" @click="showAddModal" v-permission="'role:create'">
  <template #icon>
    <n-icon><AddOutline /></n-icon>
  </template>
  新增角色
</n-button>
```

---

## 🔄 操作流程

### 1. 分配权限

```javascript
const handleAssignPermissions = async (role) => {
  currentRole.value = role
  permissionModalVisible.value = true
  
  // 获取角色当前的权限
  try {
    const res = await getRoleDetail(role.id)
    if (res.code === 200) {
      const permissions = res.data.permissions || []
      checkedPermissionKeys.value = permissions.map(p => p.id)
    }
  } catch (error) {
    console.error('获取角色权限失败:', error)
    message.error('获取角色权限失败')
  }
}
```

### 2. 处理权限勾选变化

```javascript
const handleCheckedKeysChange = (keys) => {
  checkedPermissionKeys.value = keys
}
```

**半选状态说明**：

- 当父节点的部分子节点被选中时，父节点显示为半选状态（indeterminate）
- Naive UI 的 NTree 组件自动处理半选状态
- `cascade` 属性确保父子节点的联动

### 3. 保存权限分配

```javascript
const handleSavePermissions = async () => {
  try {
    savingPermissions.value = true
    
    const res = await assignPermissions(currentRole.value.id, {
      permissionIds: checkedPermissionKeys.value,
    })
    
    if (res.code === 200) {
      message.success('权限分配成功')
      permissionModalVisible.value = false
    } else {
      message.error(res.message || '分配失败')
    }
  } catch (error) {
    console.error('权限分配失败:', error)
    message.error('权限分配失败')
  } finally {
    savingPermissions.value = false
  }
}
```

### 4. 启用/禁用角色

```javascript
const handleToggleStatus = async (role) => {
  const newStatus = role.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  dialog.warning({
    title: '确认操作',
    content: `确定要${action}角色「${role.display_name}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await updateRole(role.id, { status: newStatus })
        if (res.code === 200) {
          message.success(`${action}成功`)
          fetchRoleList()
        }
      } catch (error) {
        message.error(`${action}失败`)
      }
    },
  })
}
```

### 5. 删除角色

```javascript
const handleDelete = async (roleId) => {
  try {
    const res = await deleteRole(roleId)
    if (res.code === 200) {
      message.success('角色删除成功')
      fetchRoleList()
    }
  } catch (error) {
    message.error('删除角色失败')
  }
}
```

---

## 💡 最佳实践

### 1. 权限树数据处理

**推荐做法**：

```javascript
// 转换权限树格式
const transformPermissionTree = (permissions) => {
  return permissions.map((perm) => ({
    key: perm.id,
    label: `${perm.name} (${perm.code})`,  // 显示名称和编码
    children: perm.children?.length > 0 
      ? transformPermissionTree(perm.children) 
      : undefined,
  }))
}
```

### 2. 半选状态处理

**NTree 自动处理**：

```vue
<!-- cascade 属性确保半选状态正确显示 -->
<n-tree
  checkable
  cascade
  :checked-keys="checkedPermissionKeys"
/>
```

**获取所有选中的权限ID**：

```javascript
// checkedPermissionKeys 包含所有选中的节点ID（包括父节点和子节点）
const selectedIds = checkedPermissionKeys.value

// 如果只需要叶子节点，可以过滤
const leafIds = checkedPermissionKeys.value.filter(id => {
  return !hasChildren(id)  // 自定义判断是否有子节点
})
```

### 3. 系统角色保护

**推荐做法**：

```javascript
// 系统角色不能删除
if (row.is_system) {
  // 不显示删除按钮
  return
}

// 或者禁用删除按钮
h(NButton, { disabled: row.is_system }, { default: () => '删除' })
```

### 4. 错误处理

**推荐做法**：

```javascript
try {
  const res = await assignPermissions(roleId, { permissionIds })
  if (res.code === 200) {
    message.success('权限分配成功')
  } else {
    message.error(res.message || '分配失败')
  }
} catch (error) {
  console.error('权限分配失败:', error)
  message.error('权限分配失败')
}
```

---

## ⚠️ 注意事项

### 1. 权限编码规范

**推荐命名**：

```
role:create              - 创建角色
role:read                - 查看角色
role:update              - 更新角色
role:delete              - 删除角色
role:assign-permission   - 分配权限
```

### 2. 系统角色保护

**系统角色特点**：

- ✅ 不能删除
- ✅ 通常不能修改名称
- ✅ 用于系统内置功能（如 Admin、User）

**实现方式**：

```javascript
// 数据库中标记 is_system = true
{
  id: 'uuid1',
  name: 'admin',
  display_name: '管理员',
  is_system: true  // 系统角色
}
```

### 3. 树形数据结构

**后端返回格式**：

```json
[
  {
    "id": "uuid1",
    "name": "系统管理",
    "code": "system",
    "children": [
      {
        "id": "uuid2",
        "name": "用户管理",
        "code": "user:manage",
        "children": [...]
      }
    ]
  }
]
```

**前端转换格式**：

```javascript
[
  {
    key: 'uuid1',
    label: '系统管理 (system)',
    children: [...]
  }
]
```

### 4. 半选状态理解

**场景示例**：

```
☑ 系统管理 (parent)
  ☑ 用户管理 (child1)
    ☑ 查看用户 (grandchild1)
    ☐ 创建用户 (grandchild2)  ← 未选中
    ☐ 删除用户 (grandchild3)  ← 未选中
```

**结果**：
- `checkedPermissionKeys` 包含：`['uuid1', 'uuid2', 'uuid3']`
- "用户管理"节点显示为半选状态（因为部分子节点未选中）
- "系统管理"节点也显示为半选状态

---

## 🧪 测试方法

### 1. 测试权限树勾选

```javascript
// 浏览器控制台
console.log(checkedPermissionKeys.value)

// 勾选几个权限后
// 预期结果：数组中包含所有选中的权限ID
```

### 2. 测试半选状态

```javascript
// 只勾选子节点，不勾选父节点
// 预期结果：父节点显示为半选状态（indeterminate）
```

### 3. 测试权限控制

```javascript
// 模拟无权限
permissionStore.permissionCodes = []

// 预期结果：所有操作按钮都隐藏
```

### 4. 测试系统角色保护

```javascript
// 找到系统角色（is_system = true）
// 预期结果：删除按钮不显示或禁用
```

---

## 📊 API接口

### 1. 获取角色列表

**接口**：`GET /nodeapi/roles`

**参数**：

```javascript
{
  page: 1,
  limit: 10,
  keyword: 'admin'  // 可选
}
```

**响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "uuid1",
      "name": "admin",
      "display_name": "管理员",
      "description": "系统管理员",
      "is_system": true,
      "status": "active",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 10
}
```

### 2. 获取角色详情（含权限）

**接口**：`GET /nodeapi/roles/:roleId`

**响应**：

```json
{
  "code": 200,
  "data": {
    "id": "uuid1",
    "name": "admin",
    "display_name": "管理员",
    "permissions": [
      {
        "id": "uuid2",
        "name": "查看用户",
        "code": "user:read"
      }
    ]
  }
}
```

### 3. 创建角色

**接口**：`POST /nodeapi/roles`

**参数**：

```javascript
{
  name: 'test_role',
  displayName: '测试角色',
  description: '用于测试的角色',
  isSystem: false
}
```

### 4. 更新角色

**接口**：`PUT /nodeapi/roles/:roleId`

**参数**：

```javascript
{
  displayName: '新名称',
  description: '新描述',
  status: 'inactive'
}
```

### 5. 删除角色

**接口**：`DELETE /nodeapi/roles/:roleId`

### 6. 分配权限

**接口**：`POST /nodeapi/roles/:roleId/permissions/batch`

**参数**：

```javascript
{
  permissionIds: ['uuid1', 'uuid2', 'uuid3']
}
```

### 7. 获取权限树

**接口**：`GET /nodeapi/permissions/tree`

**响应**：

```json
{
  "code": 200,
  "data": [
    {
      "id": "uuid1",
      "name": "系统管理",
      "code": "system",
      "children": [
        {
          "id": "uuid2",
          "name": "用户管理",
          "code": "user:manage",
          "children": [...]
        }
      ]
    }
  ]
}
```

---

## 📚 相关文档

- [前端权限Store文档](./FRONTEND_PERMISSION_STORE.md)
- [动态路由和路由守卫文档](./DYNAMIC_ROUTES_AND_GUARD.md)
- [后端角色管理API文档](./ROLE_MANAGEMENT_API.md)

---

## 🎉 总结

角色管理页面已经完整实现，具有以下特点：

✅ **完整性**：覆盖所有CRUD操作和权限分配  
✅ **易用性**：直观的树形权限选择和流畅的交互  
✅ **安全性**：严格的权限控制和系统角色保护  
✅ **规范性**：统一的NaiveUI组件风格和代码规范  
✅ **灵活性**：支持半选状态、级联选择等高级功能  

**核心特性**：
- ✅ **需求1**：角色列表表格包含角色名、角色编码、描述、状态、创建时间、操作
- ✅ **需求2**：操作按钮包括编辑、分配权限、启用/禁用、删除
- ✅ **需求3**：分配权限弹窗使用 NTree 组件，树形勾选，支持半选状态
- ✅ **需求4**：所有操作按钮使用 permissionStore.hasPermission() 控制显隐

**下一步**：
1. 在后端 permissions 表中配置角色管理相关权限
2. 测试各种场景下的权限树勾选
3. 优化大数据量下的树形渲染性能
4. 添加权限搜索和过滤功能

所有功能已经完成，可以直接使用！🚀
