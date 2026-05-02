# 角色管理 API 接口文档

## 📋 概述

本文档描述了角色管理模块的所有API接口，包括角色列表、新增、编辑、删除、状态管理和权限分配等功能。

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

### 1. 获取角色列表

**接口地址**：`GET /nodeapi/roles`

**权限要求**：`role:read`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| page | Integer | 否 | 页码，默认1 | 1 |
| limit | Integer | 否 | 每页数量，默认20 | 20 |
| keyword | String | 否 | 关键词搜索（角色名/显示名/描述） | admin |

**请求示例**：

```http
GET /nodeapi/roles?page=1&limit=20&keyword=admin
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
        "id": "a0000000-0000-0000-0000-000000000001",
        "name": "admin",
        "display_name": "超级管理员",
        "description": "系统最高权限管理员，拥有所有权限",
        "is_system": true,
        "sort_order": 1,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "a0000000-0000-0000-0000-000000000002",
        "name": "user",
        "display_name": "普通用户",
        "description": "基本使用权限",
        "is_system": true,
        "sort_order": 2,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

**说明**：
- ✅ 自动过滤已删除的角色（deleted_at IS NULL）
- ✅ 支持关键词搜索：角色名、显示名、描述
- ✅ 按系统角色优先、排序号升序排列

---

### 2. 新增角色

**接口地址**：`POST /nodeapi/roles`

**权限要求**：`role:create`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | String | 是 | 角色名称（唯一，英文标识） | editor |
| displayName | String | 是 | 显示名称（中文） | 编辑者 |
| description | String | 否 | 角色描述 | 内容编辑权限 |
| isSystem | Boolean | 否 | 是否系统角色，默认false | false |
| sortOrder | Integer | 否 | 排序号，默认0 | 10 |

**请求示例**：

```http
POST /nodeapi/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "editor",
  "displayName": "编辑者",
  "description": "内容编辑权限",
  "isSystem": false,
  "sortOrder": 10
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "角色创建成功",
  "data": {
    "id": "a0000000-0000-0000-0000-000000000004",
    "name": "editor",
    "display_name": "编辑者",
    "description": "内容编辑权限",
    "is_system": false,
    "sort_order": 10,
    "created_at": "2024-01-02T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

**说明**：
- ✅ 角色名称必须唯一
- ✅ 系统角色默认为false
- ✅ 排序号用于前端显示顺序

**错误示例**：

```json
{
  "code": 400,
  "message": "角色名称已存在",
  "data": null
}
```

---

### 3. 编辑角色

**接口地址**：`PUT /nodeapi/roles/:roleId`

**权限要求**：`role:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | String | 否 | 角色名称（系统角色不可修改） | editor |
| displayName | String | 否 | 显示名称 | 高级编辑者 |
| description | String | 否 | 角色描述 | 高级内容编辑权限 |
| sortOrder | Integer | 否 | 排序号 | 5 |

**请求示例**：

```http
PUT /nodeapi/roles/a0000000-0000-0000-0000-000000000004
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "displayName": "高级编辑者",
  "description": "高级内容编辑权限",
  "sortOrder": 5
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "角色更新成功",
  "data": {
    "id": "a0000000-0000-0000-0000-000000000004",
    "name": "editor",
    "display_name": "高级编辑者",
    "description": "高级内容编辑权限",
    "is_system": false,
    "sort_order": 5,
    "created_at": "2024-01-02T00:00:00.000Z",
    "updated_at": "2024-01-03T00:00:00.000Z"
  }
}
```

**说明**：
- ✅ 只更新提供的字段
- ✅ 系统角色不允许修改名称
- ✅ 自动更新updated_at时间戳

**错误示例**：

```json
{
  "code": 400,
  "message": "系统角色不允许修改名称",
  "data": null
}
```

---

### 4. 删除角色（软删除）

**接口地址**：`DELETE /nodeapi/roles/:roleId`

**权限要求**：`role:delete`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求示例**：

```http
DELETE /nodeapi/roles/a0000000-0000-0000-0000-000000000004
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "角色删除成功",
  "data": null
}
```

**说明**：
- ✅ 软删除：设置deleted_at时间戳，不物理删除
- ✅ 删除后角色不会出现在列表中
- ✅ 数据可恢复（通过数据库操作）
- ❌ 系统角色不允许删除
- ❌ **有用户绑定的角色不允许删除**

**错误示例**：

```json
{
  "code": 400,
  "message": "系统角色不允许删除",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "该角色已被 5 个用户使用，无法删除",
  "data": null
}
```

---

### 5. 启用/禁用角色

**接口地址**：`PUT /nodeapi/roles/:roleId/status`

**权限要求**：`role:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| status | String | 是 | 状态值 | active |

**状态值说明**：

| 状态值 | 说明 |
|--------|------|
| active | 启用（正常状态） |
| inactive | 禁用（暂时停用） |

**请求示例**：

```http
PUT /nodeapi/roles/a0000000-0000-0000-0000-000000000004/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "inactive"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "角色已禁用",
  "data": {
    "id": "a0000000-0000-0000-0000-000000000004",
    "name": "editor",
    "display_name": "编辑者",
    "status": "inactive"
  }
}
```

**说明**：
- ✅ 只能设置为：active、inactive
- ✅ 已删除的角色无法修改状态
- ❌ 系统角色不允许禁用

**错误示例**：

```json
{
  "code": 400,
  "message": "系统角色不允许禁用",
  "data": null
}
```

```json
{
  "code": 400,
  "message": "无效的状态值",
  "data": null
}
```

---

### 6. 获取角色详情

**接口地址**：`GET /nodeapi/roles/:roleId`

**权限要求**：`role:read`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求示例**：

```http
GET /nodeapi/roles/a0000000-0000-0000-0000-000000000001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "name": "admin",
    "display_name": "超级管理员",
    "description": "系统最高权限管理员，拥有所有权限",
    "is_system": true,
    "sort_order": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "permissions": [
      {
        "id": "b0000000-0000-0000-0000-000000000001",
        "code": "user:read",
        "name": "查看用户",
        "description": "查看用户列表和详情",
        "module": "user",
        "action": "read",
        "resource": "user"
      },
      {
        "id": "b0000000-0000-0000-0000-000000000002",
        "code": "user:create",
        "name": "创建用户",
        "description": "创建新用户",
        "module": "user",
        "action": "create",
        "resource": "user"
      }
    ]
  }
}
```

**说明**：
- ✅ 返回角色的完整信息
- ✅ 包含该角色的所有权限列表

---

### 7. 为角色分配权限

**接口地址**：`POST /nodeapi/roles/:roleId/permissions`

**权限要求**：`role:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| permissionId | UUID | 是 | 权限ID | b0000000-0000-0000-0000-000000000001 |

**请求示例**：

```http
POST /nodeapi/roles/a0000000-0000-0000-0000-000000000004/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "permissionId": "b0000000-0000-0000-0000-000000000001"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "权限分配成功",
  "data": null
}
```

**说明**：
- ✅ 一个角色可以有多个权限
- ✅ 重复分配不会报错（ON CONFLICT DO NOTHING）

---

### 8. 批量分配权限

**接口地址**：`POST /nodeapi/roles/:roleId/permissions/batch`

**权限要求**：`role:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| permissionIds | Array | 是 | 权限ID数组 | ["uuid1", "uuid2"] |

**请求示例**：

```http
POST /nodeapi/roles/a0000000-0000-0000-0000-000000000004/permissions/batch
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "permissionIds": [
    "b0000000-0000-0000-0000-000000000001",
    "b0000000-0000-0000-0000-000000000002",
    "b0000000-0000-0000-0000-000000000003"
  ]
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "权限批量分配成功",
  "data": null
}
```

**说明**：
- ✅ 使用事务保证数据一致性
- ✅ 批量添加，不会删除已有权限

---

### 9. 移除角色权限

**接口地址**：`DELETE /nodeapi/roles/:roleId/permissions/:permissionId`

**权限要求**：`role:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |
| permissionId | UUID | 是 | 权限ID |

**请求示例**：

```http
DELETE /nodeapi/roles/a0000000-0000-0000-0000-000000000004/permissions/b0000000-0000-0000-0000-000000000001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "权限移除成功",
  "data": null
}
```

---

### 10. 获取角色的所有用户

**接口地址**：`GET /nodeapi/roles/:roleId/users`

**权限要求**：`role:read`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | UUID | 是 | 角色ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| page | Integer | 否 | 页码，默认1 | 1 |
| limit | Integer | 否 | 每页数量，默认20 | 20 |

**请求示例**：

```http
GET /nodeapi/roles/a0000000-0000-0000-0000-000000000001/users?page=1&limit=20
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
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "admin",
        "email": "admin@example.com",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**说明**：
- ✅ 返回拥有该角色的所有用户
- ✅ 支持分页

---

## 🔒 安全特性

### 1. 权限控制

- ✅ 所有接口需要JWT认证
- ✅ 基于RBAC的细粒度权限控制
- ✅ 前端按钮级权限控制

### 2. 输入验证

- ✅ 必填字段验证
- ✅ 数据类型验证
- ✅ 业务规则验证（如角色名称唯一性）

### 3. SQL注入防护

- ✅ 使用参数化查询
- ✅ 不使用字符串拼接
- ✅ 输入数据过滤

### 4. 软删除

- ✅ 数据可恢复
- ✅ 符合审计要求
- ✅ 避免外键约束问题

### 5. 业务规则保护

- ✅ 系统角色不允许删除
- ✅ 系统角色不允许修改名称
- ✅ 系统角色不允许禁用
- ✅ **有用户绑定的角色不允许删除**

---

## 🎯 最佳实践

### 1. 删除角色前的检查

```javascript
// 前端示例
const handleDeleteRole = async (roleId) => {
  try {
    // 先获取角色详情，检查是否有用户
    const detailRes = await fetch(`/nodeapi/roles/${roleId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const detail = await detailRes.json()
    
    // 如果有用户，提示先移除用户
    if (detail.data.users && detail.data.users.length > 0) {
      message.warning(`该角色有 ${detail.data.users.length} 个用户，请先移除用户`)
      return
    }
    
    // 确认删除
    dialog.warning({
      title: '确认删除',
      content: '确定要删除该角色吗？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        const res = await fetch(`/nodeapi/roles/${roleId}`, {
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

### 2. 批量分配权限

```javascript
// 前端示例
const assignPermissions = async (roleId, permissionIds) => {
  const response = await fetch(
    `/nodeapi/roles/${roleId}/permissions/batch`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ permissionIds })
    }
  )
  
  const result = await response.json()
  
  if (result.code === 200) {
    message.success(result.message)
  } else {
    message.error(result.message)
  }
}
```

---

## 🧪 测试示例

### cURL测试

#### 1. 获取角色列表

```bash
curl -X GET "http://localhost:3000/nodeapi/roles?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. 新增角色

```bash
curl -X POST "http://localhost:3000/nodeapi/roles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "editor",
    "displayName": "编辑者",
    "description": "内容编辑权限",
    "sortOrder": 10
  }'
```

#### 3. 更新角色状态

```bash
curl -X PUT "http://localhost:3000/nodeapi/roles/ROLE_ID/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'
```

#### 4. 删除角色

```bash
curl -X DELETE "http://localhost:3000/nodeapi/roles/ROLE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. 批量分配权限

```bash
curl -X POST "http://localhost:3000/nodeapi/roles/ROLE_ID/permissions/batch" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": [
      "PERMISSION_ID_1",
      "PERMISSION_ID_2"
    ]
  }'
```

---

## 📚 相关文档

- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)
- [数据库企业级规范](./DATABASE_ENTERPRISE_SPEC.md)
- [用户管理API](./USER_MANAGEMENT_API.md)

---

## 🎉 总结

角色管理API提供了完整的角色CRUD功能，具有以下特点：

✅ **完整性**：覆盖角色管理的所有常见操作  
✅ **安全性**：JWT认证、RBAC权限控制、业务规则保护  
✅ **规范性**：统一的返回格式、错误处理  
✅ **灵活性**：支持分页、搜索、批量操作  
✅ **可扩展**：软删除、多权限支持、排序功能  
✅ **易用性**：清晰的接口设计、完善的文档  

**关键特性**：
- ✅ 软删除保护数据安全
- ✅ 系统角色特殊保护
- ✅ **删除前检查用户绑定**
- ✅ 支持启用/禁用状态管理
- ✅ 批量权限分配提高效率

**下一步**：
1. 根据文档测试各个接口
2. 在前端实现对应的管理页面
3. 根据需要扩展更多功能

---

**提示**：生产环境请启用HTTPS，确保数据传输安全！
