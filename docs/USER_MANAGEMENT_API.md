# 用户管理 API 接口文档

## 📋 概述

本文档描述了用户管理模块的所有API接口，包括用户列表、新增、编辑、删除、状态管理、密码重置和角色分配等功能。

## 🔐 认证说明

除登录和注册接口外，所有接口都需要在请求头中携带JWT Token：

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

### 1. 获取用户列表

**接口地址**：`GET /nodeapi/users`

**权限要求**：`user:read`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| page | Integer | 否 | 页码，默认1 | 1 |
| limit | Integer | 否 | 每页数量，默认20 | 20 |
| status | String | 否 | 状态筛选：active/inactive/banned | active |
| keyword | String | 否 | 关键词搜索（用户名/邮箱/昵称） | admin |

**请求示例**：

```http
GET /nodeapi/users?page=1&limit=20&status=active&keyword=admin
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
        "avatar_url": "/uploads/avatars/avatar_xxx.jpg",
        "nickname": "管理员",
        "phone": "13800138000",
        "bio": "系统管理员",
        "status": "active",
        "last_login_at": "2024-01-01T00:00:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "roles": [
          {
            "id": "a0000000-0000-0000-0000-000000000001",
            "name": "admin",
            "display_name": "超级管理员",
            "description": "系统最高权限管理员"
          }
        ]
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**说明**：
- ✅ 自动过滤已删除的用户（deleted_at IS NULL）
- ✅ 支持关键词搜索：用户名、邮箱、昵称
- ✅ 每个用户包含角色信息
- ✅ 返回分页信息

---

### 2. 新增用户

**接口地址**：`POST /nodeapi/users`

**权限要求**：`user:create`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| username | String | 是 | 用户名（唯一） | testuser |
| password | String | 是 | 密码（最少6位） | password123 |
| email | String | 否 | 邮箱 | test@example.com |
| avatarUrl | String | 否 | 头像URL | /uploads/avatars/xxx.jpg |
| nickname | String | 否 | 昵称 | 测试用户 |
| phone | String | 否 | 手机号 | 13800138000 |
| bio | String | 否 | 个人简介 | 这是个人简介 |

**请求示例**：

```http
POST /nodeapi/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "nickname": "测试用户",
  "phone": "13800138000",
  "bio": "这是个人简介"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "用户创建成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "testuser",
    "email": "test@example.com",
    "avatarUrl": null,
    "nickname": "测试用户",
    "phone": "13800138000",
    "bio": "这是个人简介"
  }
}
```

**说明**：
- ✅ 密码使用bcrypt加密存储
- ✅ 自动分配普通用户角色（user）
- ✅ 用户名必须唯一
- ✅ 可选字段可以为null

**错误示例**：

```json
{
  "code": 400,
  "message": "用户名已存在",
  "data": null
}
```

---

### 3. 编辑用户

**接口地址**：`PUT /nodeapi/users/:userId`

**权限要求**：`user:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| email | String | 否 | 邮箱 | test@example.com |
| nickname | String | 否 | 昵称 | 新昵称 |
| phone | String | 否 | 手机号 | 13900139000 |
| bio | String | 否 | 个人简介 | 新的简介 |
| avatarUrl | String | 否 | 头像URL | /uploads/avatars/new.jpg |
| status | String | 否 | 状态 | active |

**请求示例**：

```http
PUT /nodeapi/users/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nickname": "新昵称",
  "phone": "13900139000",
  "bio": "更新后的简介"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "用户更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "testuser",
    "email": "test@example.com",
    "avatar_url": null,
    "nickname": "新昵称",
    "phone": "13900139000",
    "bio": "更新后的简介",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
}
```

**说明**：
- ✅ 不允许修改username和password（请使用专门接口）
- ✅ 只更新提供的字段
- ✅ 自动更新updated_at时间戳

---

### 4. 删除用户（软删除）

**接口地址**：`DELETE /nodeapi/users/:userId`

**权限要求**：`user:delete`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |

**请求示例**：

```http
DELETE /nodeapi/users/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "用户删除成功",
  "data": null
}
```

**说明**：
- ✅ 软删除：设置deleted_at时间戳，不物理删除
- ✅ 删除后用户不会出现在列表中
- ✅ 数据可恢复（通过数据库操作）
- ❌ 不允许删除自己的账号

**错误示例**：

```json
{
  "code": 400,
  "message": "不能删除自己的账号",
  "data": null
}
```

---

### 5. 启用/禁用用户

**接口地址**：`PUT /nodeapi/users/:userId/status`

**权限要求**：`user:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| status | String | 是 | 状态值 | active |

**状态值说明**：

| 状态值 | 说明 |
|--------|------|
| active | 启用（正常状态） |
| inactive | 禁用（未激活） |
| banned | 封禁（违规处罚） |

**请求示例**：

```http
PUT /nodeapi/users/550e8400-e29b-41d4-a716-446655440001/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "banned"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "用户已封禁",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "testuser",
    "status": "banned"
  }
}
```

**说明**：
- ✅ 只能设置为：active、inactive、banned
- ✅ 已删除的用户无法修改状态
- ❌ 不允许修改自己的状态

**错误示例**：

```json
{
  "code": 400,
  "message": "无效的状态值",
  "data": null
}
```

---

### 6. 重置密码

**接口地址**：`POST /nodeapi/users/:userId/reset-password`

**权限要求**：`user:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| newPassword | String | 是 | 新密码（最少6位） | newpass123 |

**请求示例**：

```http
POST /nodeapi/users/550e8400-e29b-41d4-a716-446655440001/reset-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "newPassword": "newpass123"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": null
}
```

**说明**：
- ✅ 密码使用bcrypt加密
- ✅ 不需要提供旧密码
- ✅ 通常由管理员执行

**错误示例**：

```json
{
  "code": 400,
  "message": "缺少 newPassword 参数",
  "data": null
}
```

---

### 7. 分配角色

**接口地址**：`POST /nodeapi/users/:userId/roles`

**权限要求**：`user:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| roleId | UUID | 是 | 角色ID | a0000000-0000-0000-0000-000000000001 |

**请求示例**：

```http
POST /nodeapi/users/550e8400-e29b-41d4-a716-446655440001/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleId": "a0000000-0000-0000-0000-000000000001"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "角色分配成功",
  "data": null
}
```

**说明**：
- ✅ 一个用户可以有多个角色
- ✅ 重复分配不会报错（ON CONFLICT DO NOTHING）

---

### 8. 批量分配角色

**接口地址**：`PUT /nodeapi/users/:userId/roles`

**权限要求**：`user:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| roleIds | Array | 是 | 角色ID数组 | ["uuid1", "uuid2"] |

**请求示例**：

```http
PUT /nodeapi/users/550e8400-e29b-41d4-a716-446655440001/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roleIds": [
    "a0000000-0000-0000-0000-000000000001",
    "a0000000-0000-0000-0000-000000000002"
  ]
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "成功分配 2 个角色",
  "data": null
}
```

**说明**：
- ✅ 使用事务保证数据一致性
- ✅ 批量添加，不会删除已有角色

---

### 9. 移除角色

**接口地址**：`DELETE /nodeapi/users/:userId/roles/:roleId`

**权限要求**：`user:update`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | UUID | 是 | 用户ID |
| roleId | UUID | 是 | 角色ID |

**请求示例**：

```http
DELETE /nodeapi/users/550e8400-e29b-41d4-a716-446655440001/roles/a0000000-0000-0000-0000-000000000001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "角色移除成功",
  "data": null
}
```

---

## 🔒 安全特性

### 1. 密码加密

- ✅ 使用bcrypt算法加密
- ✅ cost factor = 10
- ✅ 不在日志中输出密码
- ✅ 不在响应中返回密码

### 2. 权限控制

- ✅ 所有接口需要JWT认证
- ✅ 基于RBAC的细粒度权限控制
- ✅ 前端按钮级权限控制

### 3. 输入验证

- ✅ 必填字段验证
- ✅ 数据类型验证
- ✅ 业务规则验证（如用户名唯一性）

### 4. SQL注入防护

- ✅ 使用参数化查询
- ✅ 不使用字符串拼接
- ✅ 输入数据过滤

### 5. 软删除

- ✅ 数据可恢复
- ✅ 符合审计要求
- ✅ 避免外键约束问题

---

## 📊 用户状态说明

| 状态 | 说明 | 能否登录 | 应用场景 |
|------|------|----------|----------|
| active | 启用 | ✅ 能 | 正常用户 |
| inactive | 禁用 | ❌ 不能 | 未激活、临时禁用 |
| banned | 封禁 | ❌ 不能 | 违规处罚 |

---

## 🎯 最佳实践

### 1. 分页查询

```javascript
// 前端示例
const fetchUsers = async (page = 1, limit = 20, keyword = '') => {
  const response = await fetch(
    `/nodeapi/users?page=${page}&limit=${limit}&keyword=${keyword}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  const result = await response.json()
  return result.data
}
```

### 2. 错误处理

```javascript
try {
  const response = await fetch('/nodeapi/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  })
  
  const result = await response.json()
  
  if (result.code === 200) {
    message.success(result.message)
  } else {
    message.error(result.message)
  }
} catch (error) {
  message.error('网络请求失败')
}
```

### 3. 权限检查

```vue
<template>
  <n-button 
    v-permission="'user:delete'"
    @click="handleDelete(userId)"
  >
    删除
  </n-button>
</template>
```

---

## 🧪 测试示例

### cURL测试

#### 1. 获取用户列表

```bash
curl -X GET "http://localhost:3000/nodeapi/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. 新增用户

```bash
curl -X POST "http://localhost:3000/nodeapi/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "nickname": "测试用户"
  }'
```

#### 3. 更新用户状态

```bash
curl -X PUT "http://localhost:3000/nodeapi/users/USER_ID/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "banned"
  }'
```

#### 4. 删除用户

```bash
curl -X DELETE "http://localhost:3000/nodeapi/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 相关文档

- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)
- [数据库企业级规范](./DATABASE_ENTERPRISE_SPEC.md)
- [JWT认证指南](./JWT_AUTH_GUIDE.md)

---

## 🎉 总结

用户管理API提供了完整的用户CRUD功能，具有以下特点：

✅ **完整性**：覆盖用户管理的所有常见操作  
✅ **安全性**：bcrypt加密、JWT认证、RBAC权限控制  
✅ **规范性**：统一的返回格式、错误处理  
✅ **灵活性**：支持分页、搜索、筛选  
✅ **可扩展**：软删除、多角色支持  
✅ **易用性**：清晰的接口设计、完善的文档  

**下一步**：
1. 根据文档测试各个接口
2. 在前端实现对应的功能
3. 根据需要扩展更多功能

---

**提示**：生产环境请启用HTTPS，确保数据传输安全！
