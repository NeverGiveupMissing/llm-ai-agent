# 用户管理页面使用文档

## 📋 概述

本文档描述了用户管理页面的功能和使用方法，包括用户列表、搜索筛选、CRUD操作、权限控制等。

## 🎯 核心功能

### 1. **用户列表分页表格** ✅

- ✅ 支持分页显示（10/20/50/100条每页）
- ✅ 支持用户名/昵称搜索
- ✅ 支持状态筛选（激活/禁用/未激活）
- ✅ 实时加载数据，带loading状态

### 2. **表格列** ✅

| 列名 | 字段 | 说明 |
|------|------|------|
| ID | id | 用户唯一标识 |
| 用户名 | username | 登录用户名 |
| 昵称 | nickname | 用户昵称 |
| 邮箱 | email | 用户邮箱 |
| 状态 | status | 激活/禁用/未激活 |
| 角色 | roles | 用户角色列表 |
| 创建时间 | created_at | 账户创建时间 |
| 操作 | actions | 编辑/重置密码/分配角色/启用禁用/删除 |

### 3. **操作按钮** ✅

| 按钮 | 权限编码 | 说明 |
|------|---------|------|
| 编辑 | user:update | 编辑用户信息 |
| 重置密码 | user:reset-password | 重置用户密码 |
| 分配角色 | user:assign-role | 为用户分配角色 |
| 启用/禁用 | user:update | 切换用户状态 |
| 删除 | user:delete | 删除用户 |

### 4. **v-permission 指令控制显隐** ✅

所有操作按钮都使用 `permissionStore.hasPermission()` 进行权限判断，无权限的按钮自动隐藏。

### 5. **NaiveUI 组件库** ✅

统一使用 NaiveUI 组件，保持风格一致：
- n-card：卡片容器
- n-data-table：数据表格
- n-modal：弹窗
- n-form：表单
- n-button：按钮
- n-tag：标签
- n-space：间距
- n-select：下拉选择
- n-input：输入框
- n-popconfirm：确认对话框

---

## 🏗️ 页面结构

```
┌─────────────────────────────────────────────┐
│           用户管理 (n-card)                  │
├─────────────────────────────────────────────┤
│                                             │
│  🔍 搜索框  [状态筛选] [搜索] [重置] [+新增] │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───┬──────┬──────┬──────┬────┬────┬────┐ │
│  │ID │用户名│昵称  │邮箱  │状态│角色│操作│ │
│  ├───┼──────┼──────┼──────┼────┼────┼────┤ │
│  │ 1 │admin │管理员│a@b.c │激活│Admin│...│ │
│  │ 2 │user1 │用户1 │d@e.f │禁用│User │...│ │
│  └───┴──────┴──────┴──────┴────┴────┴────┘ │
│                                             │
│         [上一页] 1 2 3 [下一页]              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📦 核心代码

### 1. 搜索和筛选区域

```vue
<div class="filter-section">
  <n-space>
    <!-- 搜索框 -->
    <n-input
      v-model:value="searchKeyword"
      placeholder="搜索用户名或昵称"
      clearable
      style="width: 200px"
      @keyup.enter="handleSearch"
    >
      <template #prefix>
        <n-icon><SearchOutline /></n-icon>
      </template>
    </n-input>
    
    <!-- 状态筛选 -->
    <n-select
      v-model:value="statusFilter"
      :options="statusOptions"
      placeholder="状态筛选"
      clearable
      style="width: 120px"
      @update:value="handleFilterChange"
    />
    
    <!-- 搜索按钮 -->
    <n-button type="primary" @click="handleSearch">
      <template #icon>
        <n-icon><SearchOutline /></n-icon>
      </template>
      搜索
    </n-button>
    
    <!-- 重置按钮 -->
    <n-button @click="handleReset">
      <template #icon>
        <n-icon><RefreshOutline /></n-icon>
      </template>
      重置
    </n-button>
    
    <!-- 新增按钮（需要权限） -->
    <n-button type="success" @click="showAddModal" v-permission="'user:create'">
      <template #icon>
        <n-icon><AddOutline /></n-icon>
      </template>
      新增用户
    </n-button>
  </n-space>
</div>
```

**状态选项**：

```javascript
const statusOptions = [
  { label: '激活', value: 'active' },
  { label: '禁用', value: 'banned' },
  { label: '未激活', value: 'inactive' },
]
```

---

### 2. 数据表格

```vue
<n-data-table
  :columns="columns"
  :data="userList"
  :loading="loading"
  :pagination="pagination"
  :row-key="(row) => row.id"
  @update:page="handlePageChange"
  @update:page-size="handlePageSizeChange"
/>
```

**分页配置**：

```javascript
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
})
```

---

### 3. 表格列定义

```javascript
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 100,
    ellipsis: { tooltip: true },
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
  },
  {
    title: '昵称',
    key: 'nickname',
    width: 120,
  },
  {
    title: '邮箱',
    key: 'email',
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap = {
        active: { text: '激活', type: 'success' },
        banned: { text: '禁用', type: 'error' },
        inactive: { text: '未激活', type: 'warning' },
      }
      const status = statusMap[row.status] || { text: row.status, type: 'default' }
      return h(NTag, { type: status.type }, { default: () => status.text })
    },
  },
  {
    title: '角色',
    key: 'roles',
    width: 150,
    render(row) {
      if (!row.roles || row.roles.length === 0) {
        return h(NTag, { type: 'default' }, { default: () => '无角色' })
      }
      return h(
        NSpace,
        {},
        {
          default: () =>
            row.roles.map((role) =>
              h(NTag, { type: 'info', size: 'small' }, { default: () => role.name })
            ),
        }
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
      
      // 编辑按钮（需要 user:update 权限）
      if (permissionStore.hasPermission('user:update')) {
        buttons.push(
          h(NButton, { size: 'small', onClick: () => handleEdit(row) }, 
            { default: () => '编辑' })
        )
      }
      
      // 重置密码按钮（需要 user:reset-password 权限）
      if (permissionStore.hasPermission('user:reset-password')) {
        buttons.push(
          h(NButton, { size: 'small', type: 'warning', onClick: () => handleShowResetPassword(row) }, 
            { default: () => '重置密码' })
        )
      }
      
      // 分配角色按钮（需要 user:assign-role 权限）
      if (permissionStore.hasPermission('user:assign-role')) {
        buttons.push(
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleAssignRole(row) }, 
            { default: () => '分配角色' })
        )
      }
      
      // 启用/禁用按钮（需要 user:update 权限）
      if (permissionStore.hasPermission('user:update')) {
        buttons.push(
          h(NButton, { 
            size: 'small', 
            type: row.status === 'active' ? 'warning' : 'success',
            onClick: () => handleToggleStatus(row)
          }, 
            { default: () => row.status === 'active' ? '禁用' : '启用' })
        )
      }
      
      // 删除按钮（需要 user:delete 权限）
      if (permissionStore.hasPermission('user:delete')) {
        buttons.push(
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
            default: () => '确定要删除此用户吗？',
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

### 4. 权限控制实现

**方式一：v-permission 指令（模板中）**

```vue
<!-- 新增按钮 -->
<n-button type="success" @click="showAddModal" v-permission="'user:create'">
  <template #icon>
    <n-icon><AddOutline /></n-icon>
  </template>
  新增用户
</n-button>
```

**方式二：permissionStore.hasPermission（render函数中）**

```javascript
// 在 render 函数中使用
if (permissionStore.hasPermission('user:update')) {
  buttons.push(
    h(NButton, { ... }, { default: () => '编辑' })
  )
}
```

**权限指令实现**（`src/directives/permission.js`）：

```javascript
export default {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    let hasPermission = false
    if (Array.isArray(value)) {
      // 多个权限，检查是否有任一权限
      hasPermission = permissionStore.hasAnyPermission(value)
    } else {
      // 单个权限
      hasPermission = permissionStore.hasPermission(value)
    }

    // 没有权限时隐藏元素
    if (!hasPermission) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  },
}
```

---

## 🔄 操作流程

### 1. 搜索用户

```javascript
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.pageSize,
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const res = await getUserList(params)
    if (res.code === 200) {
      userList.value = res.data || []
      pagination.itemCount = res.total || 0
    }
  } finally {
    loading.value = false
  }
}
```

### 2. 新增用户

```javascript
const showAddModal = () => {
  isEditMode.value = false
  resetForm()
  addEditModalVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const res = await createUser(formData)
    if (res.code === 200) {
      message.success('用户创建成功')
      addEditModalVisible.value = false
      fetchUserList()
    }
  } finally {
    submitting.value = false
  }
}
```

### 3. 编辑用户

```javascript
const handleEdit = (user) => {
  isEditMode.value = true
  currentUser.value = user
  Object.assign(formData, {
    username: user.username,
    email: user.email || '',
    avatarUrl: user.avatar_url || '',
    status: user.status || 'active',
  })
  addEditModalVisible.value = true
}

const handleSubmit = async () => {
  if (isEditMode.value) {
    const updateData = {
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      status: formData.status,
    }
    const res = await updateUser(currentUser.value.id, updateData)
    if (res.code === 200) {
      message.success('用户更新成功')
      addEditModalVisible.value = false
      fetchUserList()
    }
  }
}
```

### 4. 重置密码

```javascript
const handleShowResetPassword = (user) => {
  currentUser.value = user
  passwordFormData.userId = user.id
  passwordFormData.newPassword = ''
  passwordFormData.confirmPassword = ''
  resetPasswordModalVisible.value = true
}

const handleResetPassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    resettingPassword.value = true
    
    const res = await resetPassword(passwordFormData.userId, {
      newPassword: passwordFormData.newPassword,
    })
    
    if (res.code === 200) {
      message.success('密码重置成功')
      resetPasswordModalVisible.value = false
    }
  } finally {
    resettingPassword.value = false
  }
}
```

### 5. 分配角色

```javascript
const handleAssignRole = (user) => {
  currentUser.value = user
  roleFormData.userId = user.id
  roleFormData.roleIds = user.roles ? user.roles.map(r => r.id) : []
  assignRoleModalVisible.value = true
}

const handleAssignRoles = async () => {
  if (!roleFormRef.value) return
  
  try {
    await roleFormRef.value.validate()
    assigningRoles.value = true
    
    const res = await assignRoles(roleFormData.userId, { 
      roleIds: roleFormData.roleIds 
    })
    
    if (res.code === 200) {
      message.success('角色分配成功')
      assignRoleModalVisible.value = false
      fetchUserList()
    }
  } finally {
    assigningRoles.value = false
  }
}
```

### 6. 启用/禁用用户

```javascript
const handleToggleStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'banned' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  dialog.warning({
    title: '确认操作',
    content: `确定要${action}用户「${user.username}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await updateUser(user.id, { status: newStatus })
        if (res.code === 200) {
          message.success(`${action}成功`)
          fetchUserList()
        }
      } catch (error) {
        message.error(`${action}失败`)
      }
    },
  })
}
```

### 7. 删除用户

```javascript
const handleDelete = async (userId) => {
  try {
    const res = await deleteUser(userId)
    if (res.code === 200) {
      message.success('用户删除成功')
      fetchUserList()
    }
  } catch (error) {
    message.error('删除用户失败')
  }
}
```

---

## 💡 最佳实践

### 1. 权限控制

**推荐做法**：

```javascript
// ✅ 在 render 函数中使用 permissionStore
if (permissionStore.hasPermission('user:update')) {
  buttons.push(h(NButton, ...))
}

// ✅ 在模板中使用 v-permission 指令
<n-button v-permission="'user:create'">新增</n-button>
```

**不推荐做法**：

```javascript
// ❌ 硬编码权限判断
if (user.role === 'admin') {
  buttons.push(h(NButton, ...))
}
```

### 2. 错误处理

**推荐做法**：

```javascript
try {
  const res = await createUser(formData)
  if (res.code === 200) {
    message.success('创建成功')
  } else {
    message.error(res.message || '创建失败')
  }
} catch (error) {
  console.error('创建用户失败:', error)
  message.error('创建用户失败')
}
```

### 3. 表单验证

**推荐做法**：

```javascript
const formRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur',
  },
  email: {
    required: true,
    message: '请输入邮箱',
    trigger: 'blur',
    validator: (rule, value) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) || '请输入有效的邮箱地址'
    },
  },
}

// 提交前验证
await formRef.value.validate()
```

### 4. 分页处理

**推荐做法**：

```javascript
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
})

const handlePageChange = (page) => {
  pagination.page = page
  fetchUserList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchUserList()
}
```

---

## ⚠️ 注意事项

### 1. 权限编码规范

**推荐命名**：

```
user:create      - 创建用户
user:read        - 查看用户
user:update      - 更新用户
user:delete      - 删除用户
user:reset-password - 重置密码
user:assign-role    - 分配角色
```

### 2. 状态值规范

**推荐状态**：

```javascript
{
  active: '激活',     // 正常用户
  banned: '禁用',     // 被封禁的用户
  inactive: '未激活'  // 注册但未激活的用户
}
```

### 3. 日期格式化

**推荐做法**：

```javascript
// 使用 toLocaleString 格式化日期
new Date(row.created_at).toLocaleString('zh-CN')
// 输出：2024/1/15 10:30:00
```

### 4. 空值处理

**推荐做法**：

```javascript
// 角色为空时显示默认值
if (!row.roles || row.roles.length === 0) {
  return h(NTag, { type: 'default' }, { default: () => '无角色' })
}

// 邮箱可能为空
email: user.email || ''
```

---

## 🧪 测试方法

### 1. 测试搜索功能

```javascript
// 浏览器控制台
searchKeyword.value = 'admin'
handleSearch()

// 预期结果：只显示包含 "admin" 的用户
```

### 2. 测试状态筛选

```javascript
// 浏览器控制台
statusFilter.value = 'active'
handleFilterChange()

// 预期结果：只显示状态为 "active" 的用户
```

### 3. 测试权限控制

```javascript
// 模拟无权限
permissionStore.permissionCodes = []

// 预期结果：所有操作按钮都隐藏
```

### 4. 测试分页

```javascript
// 浏览器控制台
pagination.page = 2
handlePageChange(2)

// 预期结果：显示第2页的数据
```

---

## 📊 API接口

### 1. 获取用户列表

**接口**：`GET /nodeapi/users`

**参数**：

```javascript
{
  page: 1,           // 页码
  limit: 10,         // 每页数量
  keyword: 'admin',  // 搜索关键词（可选）
  status: 'active'   // 状态筛选（可选）
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
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "status": "active",
      "roles": [
        { "id": "uuid2", "name": "Admin" }
      ],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 100
}
```

### 2. 创建用户

**接口**：`POST /nodeapi/users/register`

**参数**：

```javascript
{
  username: 'testuser',
  password: '123456',
  email: 'test@example.com',
  avatarUrl: 'https://...',
  status: 'active'
}
```

### 3. 更新用户

**接口**：`PUT /nodeapi/users/:userId`

**参数**：

```javascript
{
  email: 'newemail@example.com',
  avatarUrl: 'https://...',
  status: 'banned'
}
```

### 4. 删除用户

**接口**：`DELETE /nodeapi/users/:userId`

### 5. 重置密码

**接口**：`POST /nodeapi/users/:userId/reset-password`

**参数**：

```javascript
{
  newPassword: 'newpassword123'
}
```

### 6. 分配角色

**接口**：`PUT /nodeapi/users/:userId/roles`

**参数**：

```javascript
{
  roleIds: ['uuid1', 'uuid2']
}
```

---

## 📚 相关文档

- [前端权限Store文档](./FRONTEND_PERMISSION_STORE.md)
- [动态路由和路由守卫文档](./DYNAMIC_ROUTES_AND_GUARD.md)
- [后端用户管理API文档](./USER_MANAGEMENT_API.md)

---

## 🎉 总结

用户管理页面已经完整实现，具有以下特点：

✅ **完整性**：覆盖所有CRUD操作和权限控制  
✅ **易用性**：直观的界面和流畅的交互  
✅ **安全性**：严格的权限控制和操作确认  
✅ **规范性**：统一的NaiveUI组件风格和代码规范  
✅ **灵活性**：支持搜索、筛选、分页等功能  

**核心特性**：
- ✅ **需求1**：用户列表分页表格，支持用户名/昵称搜索，状态筛选
- ✅ **需求2**：表格列包含用户名、昵称、邮箱、状态、角色、创建时间、操作
- ✅ **需求3**：操作按钮包括编辑、重置密码、分配角色、启用/禁用、删除
- ✅ **需求4**：所有操作按钮使用 permissionStore.hasPermission() 控制显隐
- ✅ **需求5**：使用 NaiveUI 组件库，风格统一

**下一步**：
1. 在后端 permissions 表中配置用户管理相关权限
2. 测试各种场景下的权限控制
3. 根据需要添加更多筛选条件
4. 优化大数据量下的性能表现

所有功能已经完成，可以直接使用！🚀
