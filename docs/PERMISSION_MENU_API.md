# 权限菜单管理 API 接口文档

## 📋 概述

本文档描述了权限菜单管理模块的所有API接口，包括权限树形列表、新增、编辑、删除以及获取当前用户菜单树等功能。

## 🔐 认证说明

所有接口都需要在请求头中携带JWT Token：

```http
Authorization: Bearer {token}
```

## 📊 统一返回格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误信息描述",
  "data": null
}
```

---

## 📝 接口列表

### 1. 获取权限树形列表

**接口地址**：`GET /nodeapi/permissions/tree`

**权限要求**：`permission:read`

**请求示例**：

```http
GET /nodeapi/permissions/tree
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "b0000000-0000-0000-0000-000000000001",
      "name": "系统管理",
      "code": "system",
      "description": "系统管理模块",
      "module": "system",
      "action": null,
      "resource": "system",
      "type": "menu",
      "parent_id": null,
      "path": "/system",
      "icon": "settings-outline",
      "sort_order": 1,
      "children": [
        {
          "id": "b0000000-0000-0000-0000-000000000002",
          "name": "用户管理",
          "code": "user:manage",
          "description": "用户管理功能",
          "module": "user",
          "action": "manage",
          "resource": "user",
          "type": "menu",
          "parent_id": "b0000000-0000-0000-0000-000000000001",
          "path": "/system/users",
          "icon": "people-outline",
          "sort_order": 1,
          "children": [
            {
              "id": "b0000000-0000-0000-0000-000000000010",
              "name": "查看用户",
              "code": "user:read",
              "description": "查看用户列表和详情",
              "module": "user",
              "action": "read",
              "resource": "user",
              "type": "button",
              "parent_id": "b0000000-0000-0000-0000-000000000002",
              "path": null,
              "icon": null,
              "sort_order": 1
            },
            {
              "id": "b0000000-0000-0000-0000-000000000011",
              "name": "创建用户",
              "code": "user:create",
              "description": "创建新用户",
              "module": "user",
              "action": "create",
              "resource": "user",
              "type": "button",
              "parent_id": "b0000000-0000-0000-0000-000000000002",
              "path": null,
              "icon": null,
              "sort_order": 2
            }
          ]
        }
      ]
    }
  ]
}
```

**说明**：
- ✅ 返回完整的权限树形结构
- ✅ 包含菜单（menu）和按钮（button）两种类型
- ✅ 自动过滤已删除的权限
- ✅ 按sort_order排序

---

### 2. 获取权限列表

**接口地址**：`GET /nodeapi/permissions`

**权限要求**：`permission:read`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| module | String | 否 | 模块筛选 | user |
| action | String | 否 | 操作筛选 | read |
| resource | String | 否 | 资源筛选 | user |
| keyword | String | 否 | 关键词搜索 | 用户 |

**请求示例**：

```http
GET /nodeapi/permissions?module=user&keyword=用户
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "data": [
      {
        "id": "b0000000-0000-0000-0000-000000000010",
        "name": "查看用户",
        "code": "user:read",
        "type": "button",
        "parent_id": "b0000000-0000-0000-0000-000000000002",
        "path": null,
        "icon": null,
        "sort_order": 1,
        "description": "查看用户列表和详情",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 5
  }
}
```

**说明**：
- ✅ 支持多种筛选条件
- ✅ 支持关键词搜索
- ✅ 自动过滤已删除的权限
- ✅ 按sort_order、module、action排序

---

### 3. 新增权限节点

**接口地址**：`POST /nodeapi/permissions`

**权限要求**：`permission:create`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | String | 是 | 权限名称 | 查看用户 |
| code | String | 是 | 权限编码（唯一） | user:read |
| type | String | 否 | 类型：menu/button，默认button | menu |
| parentId | UUID | 否 | 父权限ID | b0000000-... |
| path | String | 否 | 路由路径 | /system/users |
| icon | String | 否 | 图标 | people-outline |
| sortOrder | Integer | 否 | 排序号，默认0 | 1 |
| description | String | 否 | 描述 | 查看用户列表和详情 |

**请求示例**：

```http
POST /nodeapi/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "编辑用户",
  "code": "user:update",
  "type": "button",
  "parentId": "b0000000-0000-0000-0000-000000000002",
  "description": "编辑用户信息",
  "sortOrder": 3
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "权限创建成功",
  "data": {
    "id": "b0000000-0000-0000-0000-000000000012",
    "name": "编辑用户",
    "code": "user:update",
    "type": "button",
    "parent_id": "b0000000-0000-0000-0000-000000000002",
    "path": null,
    "icon": null,
    "sort_order": 3,
    "description": "编辑用户信息",
    "created_at": "2024-01-02T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

**说明**：
- ✅ 权限编码必须唯一
- ✅ 如果指定了父权限，会验证父权限是否存在
- ✅ 自动生成UUID作为ID

**错误示例**：

```json
{
  "code": 400,
  "message": "权限编码已存在",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "父权限不存在",
  "data": null
}
```

---

### 4. 编辑权限节点

**接口地址**：`PUT /nodeapi/permissions/:permissionId`

**权限要求**：`permission:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| permissionId | UUID | 是 | 权限ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | String | 否 | 权限名称 | 查看用户列表 |
| code | String | 否 | 权限编码 | user:read |
| type | String | 否 | 类型 | menu |
| parentId | UUID | 否 | 父权限ID | b0000000-... |
| path | String | 否 | 路由路径 | /system/users |
| icon | String | 否 | 图标 | people-outline |
| sortOrder | Integer | 否 | 排序号 | 1 |
| description | String | 否 | 描述 | 查看用户列表和详情 |

**请求示例**：

```http
PUT /nodeapi/permissions/b0000000-0000-0000-0000-000000000010
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "查看用户列表",
  "description": "查看用户列表和详细信息",
  "sortOrder": 1
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "权限更新成功",
  "data": {
    "id": "b0000000-0000-0000-0000-000000000010",
    "name": "查看用户列表",
    "code": "user:read",
    "type": "button",
    "parent_id": "b0000000-0000-0000-0000-000000000002",
    "path": null,
    "icon": null,
    "sort_order": 1,
    "description": "查看用户列表和详细信息",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-03T00:00:00.000Z"
  }
}
```

**说明**：
- ✅ 只更新提供的字段
- ✅ 如果更新编码，会检查是否重复
- ✅ 自动更新updated_at时间戳

**错误示例**：

```json
{
  "code": 400,
  "message": "权限编码已存在",
  "data": null
}
```

---

### 5. 删除权限节点（软删除）

**接口地址**：`DELETE /nodeapi/permissions/:permissionId`

**权限要求**：`permission:delete`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| permissionId | UUID | 是 | 权限ID |

**请求示例**：

```http
DELETE /nodeapi/permissions/b0000000-0000-0000-0000-000000000012
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "权限删除成功",
  "data": null
}
```

**说明**：
- ✅ 软删除：设置deleted_at时间戳，不物理删除
- ✅ 删除后权限不会出现在列表中
- ✅ 数据可恢复（通过数据库操作）
- ❌ **有子节点的权限不允许删除** ⭐核心需求
- ❌ 已被角色使用的权限不允许删除

**错误示例**：

```json
{
  "code": 400,
  "message": "该权限包含 3 个子节点，无法删除",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "该权限已被角色使用，无法删除",
  "data": null
}
```

---

### 6. 获取当前用户的菜单树 ⭐核心接口

**接口地址**：`GET /nodeapi/permissions/user/menu`

**权限要求**：无需额外权限（只需登录）

**请求示例**：

```http
GET /nodeapi/permissions/user/menu
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "b0000000-0000-0000-0000-000000000001",
      "name": "系统管理",
      "code": "system",
      "description": "系统管理模块",
      "module": "system",
      "action": null,
      "resource": "system",
      "type": "menu",
      "parent_id": null,
      "path": "/system",
      "icon": "settings-outline",
      "sort_order": 1,
      "children": [
        {
          "id": "b0000000-0000-0000-0000-000000000002",
          "name": "用户管理",
          "code": "user:manage",
          "description": "用户管理功能",
          "module": "user",
          "action": "manage",
          "resource": "user",
          "type": "menu",
          "parent_id": "b0000000-0000-0000-0000-000000000001",
          "path": "/system/users",
          "icon": "people-outline",
          "sort_order": 1,
          "children": []
        }
      ]
    }
  ]
}
```

**说明**：
- ✅ 根据JWT Token解析用户ID
- ✅ 查询用户拥有的所有菜单权限（type='menu'）
- ✅ 自动构建树形结构
- ✅ 只返回用户有权限的菜单
- ✅ 排除已删除的权限
- ✅ 按sort_order排序

**前端使用示例**：

```javascript
// Vue 3 + Pinia
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

// 登录后获取菜单树
await permissionStore.fetchUserMenuTree()

// 在组件中使用
const menuTree = computed(() => permissionStore.menuTree)
```

**返回结构说明**：

```typescript
interface MenuItem {
  id: string              // 权限ID
  name: string            // 菜单名称
  code: string            // 权限编码
  description?: string    // 描述
  module?: string         // 模块名
  action?: string         // 操作名
  resource?: string       // 资源名
  type: 'menu' | 'button' // 类型
  parent_id?: string      // 父节点ID
  path?: string           // 路由路径
  icon?: string           // 图标
  sort_order: number      // 排序号
  children?: MenuItem[]   // 子节点数组
}
```

---

### 7. 获取权限详情

**接口地址**：`GET /nodeapi/permissions/:permissionId`

**权限要求**：`permission:read`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| permissionId | UUID | 是 | 权限ID |

**请求示例**：

```http
GET /nodeapi/permissions/b0000000-0000-0000-0000-000000000010
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "b0000000-0000-0000-0000-000000000010",
    "name": "查看用户",
    "code": "user:read",
    "type": "button",
    "parent_id": "b0000000-0000-0000-0000-000000000002",
    "path": null,
    "icon": null,
    "sort_order": 1,
    "description": "查看用户列表和详情",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "deleted_at": null
  }
}
```

---

### 8. 按模块分组获取权限

**接口地址**：`GET /nodeapi/permissions/by-module`

**权限要求**：`permission:read`

**请求示例**：

```http
GET /nodeapi/permissions/by-module
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "module": "user",
      "permissions": [
        {
          "id": "b0000000-0000-0000-0000-000000000010",
          "code": "user:read",
          "name": "查看用户",
          "description": "查看用户列表和详情",
          "action": "read",
          "resource": "user"
        },
        {
          "id": "b0000000-0000-0000-0000-000000000011",
          "code": "user:create",
          "name": "创建用户",
          "description": "创建新用户",
          "action": "create",
          "resource": "user"
        }
      ]
    }
  ]
}
```

**说明**：
- ✅ 按module字段分组
- ✅ 便于前端按模块展示权限

---

### 9. 获取当前用户的所有权限

**接口地址**：`GET /nodeapi/permissions/my-permissions`

**权限要求**：无需额外权限（只需登录）

**请求示例**：

```http
GET /nodeapi/permissions/my-permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "data": [
      {
        "id": "b0000000-0000-0000-0000-000000000010",
        "code": "user:read",
        "name": "查看用户",
        "description": "查看用户列表和详情",
        "module": "user",
        "action": "read",
        "resource": "user",
        "type": "button",
        "parent_id": "b0000000-0000-0000-0000-000000000002",
        "path": null,
        "icon": null,
        "sort_order": 1
      }
    ],
    "total": 15
  }
}
```

**说明**：
- ✅ 返回用户拥有的所有权限（菜单+按钮）
- ✅ 用于前端按钮级权限控制

---

### 10. 检查用户权限

**接口地址**：`POST /nodeapi/permissions/check`

**权限要求**：无需额外权限（只需登录）

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| permissionCode | String | 是 | 权限编码 | user:create |

**请求示例**：

```http
POST /nodeapi/permissions/check
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "permissionCode": "user:create"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "hasPermission": true,
    "permissionCode": "user:create"
  }
}
```

**说明**：
- ✅ 实时检查用户是否拥有指定权限
- ✅ 用于前端动态权限判断

---

## 🔒 安全特性

### 1. 权限控制

- ✅ 所有接口需要JWT认证
- ✅ 基于RBAC的细粒度权限控制
- ✅ 前端按钮级权限控制

### 2. 输入验证

- ✅ 必填字段验证
- ✅ 数据类型验证
- ✅ 业务规则验证（如权限编码唯一性）

### 3. SQL注入防护

- ✅ 使用参数化查询
- ✅ 不使用字符串拼接
- ✅ 输入数据过滤

### 4. 软删除

- ✅ 数据可恢复
- ✅ 符合审计要求
- ✅ 避免外键约束问题

### 5. 业务规则保护

- ✅ **有子节点的权限不允许删除** ⭐核心需求
- ✅ 已被角色使用的权限不允许删除
- ✅ 权限编码必须唯一

---

## 🎯 最佳实践

### 1. 前端菜单渲染

```vue
<template>
  <n-menu :options="menuOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { usePermissionStore } from '@/stores/modules/permission'
import { useRouter } from 'vue-router'

const permissionStore = usePermissionStore()
const router = useRouter()

// 将权限树转换为Naive UI菜单格式
const menuOptions = computed(() => {
  return convertToMenuItems(permissionStore.menuTree)
})

function convertToMenuItems(tree) {
  return tree.map(item => ({
    label: item.name,
    key: item.code,
    icon: item.icon ? () => h(Icon, { name: item.icon }) : undefined,
    children: item.children?.length > 0 ? convertToMenuItems(item.children) : undefined,
    onClick: () => {
      if (item.path) {
        router.push(item.path)
      }
    }
  }))
}
</script>
```

### 2. 按钮权限控制

```vue
<template>
  <n-button v-if="hasPermission('user:create')" @click="handleCreate">
    创建用户
  </n-button>
</template>

<script setup>
import { usePermissionStore } from '@/stores/modules/permission'

const permissionStore = usePermissionStore()

function hasPermission(code) {
  return permissionStore.permissions.some(p => p.code === code)
}

function handleCreate() {
  // 创建用户逻辑
}
</script>
```

### 3. 删除权限前的检查

```javascript
const handleDeletePermission = async (permissionId) => {
  try {
    // 先获取权限详情，检查是否有子节点
    const detailRes = await fetch(`/nodeapi/permissions/${permissionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const detail = await detailRes.json()
    
    // 确认删除
    dialog.warning({
      title: '确认删除',
      content: '确定要删除该权限吗？此操作不可恢复！',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        const res = await fetch(`/nodeapi/permissions/${permissionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const result = await res.json()
        
        if (result.code === 200) {
          message.success(result.message)
          refreshList()
        } else {
          message.error(result.message)
        }
      }
    })
  } catch (error) {
    message.error('网络请求失败')
  }
}
```

---

## 🧪 测试示例

### cURL测试

#### 1. 获取权限树

```bash
curl -X GET "http://localhost:3000/nodeapi/permissions/tree" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. 新增权限

```bash
curl -X POST "http://localhost:3000/nodeapi/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "删除用户",
    "code": "user:delete",
    "type": "button",
    "parentId": "PARENT_PERMISSION_ID",
    "description": "删除用户",
    "sortOrder": 4
  }'
```

#### 3. 获取用户菜单树

```bash
curl -X GET "http://localhost:3000/nodeapi/permissions/user/menu" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. 删除权限

```bash
curl -X DELETE "http://localhost:3000/nodeapi/permissions/PERMISSION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 相关文档

- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)
- [数据库企业级规范](./DATABASE_ENTERPRISE_SPEC.md)
- [角色管理API](./ROLE_MANAGEMENT_API.md)
- [用户管理API](./USER_MANAGEMENT_API.md)

---

## 🎉 总结

权限菜单管理API提供了完整的权限CRUD功能和菜单树查询，具有以下特点：

✅ **完整性**：10个接口覆盖所有权限管理需求  
✅ **安全性**：JWT认证、RBAC权限控制、业务规则保护  
✅ **规范性**：统一的返回格式、错误处理  
✅ **灵活性**：支持树形结构、分页、搜索、筛选  
✅ **可扩展**：软删除、多类型支持（菜单/按钮）、排序功能  
✅ **易用性**：清晰的接口设计、完善的文档  

**核心特性**：
- ✅ 软删除保护数据安全
- ✅ **删除前检查子节点** ⭐核心需求
- ✅ 树形结构自动构建
- ✅ 根据用户权限动态生成菜单
- ✅ 支持菜单和按钮两种类型

**下一步**：
1. 确保数据库已初始化（包含新字段）
2. 启动后端服务
3. 使用Postman或cURL测试各个接口
4. 重点测试删除有子节点的权限
5. 在前端实现对应的管理页面
6. 集成到路由系统中实现动态路由

所有代码已经完成，可以直接使用！🚀
