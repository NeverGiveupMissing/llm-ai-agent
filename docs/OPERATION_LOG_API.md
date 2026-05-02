# 操作日志 API 接口文档

## 📋 概述

本文档描述了操作日志模块的所有API接口，包括日志列表查询、详情查看、删除等功能。操作日志中间件会自动记录所有非GET请求到数据库。

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

## 🗄️ 数据库表结构

### operation_logs 表

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| id | UUID | 主键 | 550e8400-e29b-41d4-a716-446655440000 |
| user_id | UUID | 用户ID | 550e8400-e29b-41d4-a716-446655440001 |
| username | VARCHAR(100) | 用户名 | admin |
| operation | VARCHAR(100) | 操作描述 | 创建用户 |
| module | VARCHAR(50) | 模块名称 | 用户管理 |
| action | VARCHAR(50) | 动作类型 | create |
| method | VARCHAR(10) | HTTP方法 | POST |
| path | VARCHAR(200) | 请求路径 | /nodeapi/users |
| ip_address | VARCHAR(45) | IP地址 | 192.168.1.100 |
| user_agent | TEXT | 用户代理 | Mozilla/5.0... |
| request_params | JSONB | 请求参数 | {"username":"test"} |
| response_status | INTEGER | 响应状态码 | 200 |
| response_data | JSONB | 响应数据 | {"code":200} |
| duration | INTEGER | 耗时（毫秒） | 150 |
| status | VARCHAR(20) | 操作状态 | success/failed |
| error_message | TEXT | 错误信息 | 权限不足 |
| created_at | TIMESTAMPTZ | 创建时间 | 2024-01-01T00:00:00.000Z |

**索引**：
- `idx_operation_logs_user_id` - 用户ID索引
- `idx_operation_logs_created_at` - 操作时间索引（DESC）
- `idx_operation_logs_module` - 模块索引
- `idx_operation_logs_operation` - 操作类型索引
- `idx_operation_logs_status` - 状态索引

---

## 📝 接口列表

### 1. 获取操作日志列表 ⭐核心接口

**接口地址**：`GET /nodeapi/operation-logs`

**权限要求**：`log:read`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| page | Integer | 否 | 页码，默认1 | 1 |
| limit | Integer | 否 | 每页数量，默认20 | 20 |
| userId | UUID | 否 | 用户ID筛选 | 550e8400-... |
| username | String | 否 | 用户名筛选（模糊匹配） | admin |
| module | String | 否 | 模块筛选 | 用户管理 |
| operation | String | 否 | 操作筛选（模糊匹配） | 创建 |
| status | String | 否 | 状态筛选 | success |
| startDate | String | 否 | 开始日期（ISO格式） | 2024-01-01T00:00:00.000Z |
| endDate | String | 否 | 结束日期（ISO格式） | 2024-01-31T23:59:59.999Z |
| keyword | String | 否 | 关键词搜索（操作/用户名/模块） | 用户 |

**请求示例**：

```http
GET /nodeapi/operation-logs?page=1&limit=20&username=admin&startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "admin",
        "operation": "创建用户",
        "module": "用户管理",
        "action": "create",
        "method": "POST",
        "path": "/nodeapi/users",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "request_params": {
          "username": "testuser",
          "email": "test@example.com"
        },
        "response_status": 200,
        "response_data": {
          "code": 200,
          "message": "用户创建成功"
        },
        "duration": 150,
        "status": "success",
        "error_message": null,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

**说明**：
- ✅ 支持分页查询
- ✅ 支持日期范围筛选（startDate + endDate）
- ✅ 支持用户名筛选（模糊匹配）
- ✅ 支持模块、操作、状态筛选
- ✅ 支持关键词搜索
- ✅ 按创建时间倒序排列
- ✅ 敏感信息已脱敏（密码等）

---

### 2. 获取操作日志详情

**接口地址**：`GET /nodeapi/operation-logs/:id`

**权限要求**：`log:read`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 日志ID |

**请求示例**：

```http
GET /nodeapi/operation-logs/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "admin",
    "operation": "创建用户",
    "module": "用户管理",
    "action": "create",
    "method": "POST",
    "path": "/nodeapi/users",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "request_params": {
      "username": "testuser",
      "email": "test@example.com"
    },
    "response_status": 200,
    "response_data": {
      "code": 200,
      "message": "用户创建成功"
    },
    "duration": 150,
    "status": "success",
    "error_message": null,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. 删除操作日志

**接口地址**：`DELETE /nodeapi/operation-logs/:id`

**权限要求**：`log:delete`

**路径参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 日志ID |

**请求示例**：

```http
DELETE /nodeapi/operation-logs/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

### 4. 批量删除操作日志

**接口地址**：`POST /nodeapi/operation-logs/batch-delete`

**权限要求**：`log:delete`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| ids | Array | 是 | 日志ID数组 | ["uuid1", "uuid2"] |

**请求示例**：

```http
POST /nodeapi/operation-logs/batch-delete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "成功删除 2 条日志",
  "data": null
}
```

---

### 5. 清空所有操作日志

**接口地址**：`POST /nodeapi/operation-logs/clear-all`

**权限要求**：`log:delete`

**请求示例**：

```http
POST /nodeapi/operation-logs/clear-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "已清空所有日志",
  "data": null
}
```

**警告**：此操作不可恢复，请谨慎使用！

---

### 6. 获取统计数据

**接口地址**：`GET /nodeapi/operation-logs/stats`

**权限要求**：`log:read`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| startDate | String | 否 | 开始日期 | 2024-01-01T00:00:00.000Z |
| endDate | String | 否 | 结束日期 | 2024-01-31T23:59:59.999Z |

**请求示例**：

```http
GET /nodeapi/operation-logs/stats?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 1500,
    "success": 1450,
    "failed": 50,
    "avgDuration": 125.5,
    "moduleStats": [
      {
        "module": "用户管理",
        "count": 500
      },
      {
        "module": "角色管理",
        "count": 300
      }
    ],
    "userStats": [
      {
        "username": "admin",
        "count": 800
      },
      {
        "username": "user1",
        "count": 400
      }
    ]
  }
}
```

**说明**：
- ✅ 总操作数
- ✅ 成功/失败操作数
- ✅ 平均响应时间
- ✅ 按模块统计（Top 10）
- ✅ 按用户统计（Top 10）

---

## 🔧 操作日志中间件

### 功能说明

operation-logger 中间件会自动记录所有非GET请求到数据库。

### 工作流程

1. 记录请求开始时间
2. 执行请求处理
3. 计算请求耗时
4. 检查是否需要记录日志
5. 获取用户信息
6. 构建日志数据
7. 异步写入数据库

### 记录规则

✅ **会记录的请求**：
- 所有非GET请求（POST, PUT, PATCH, DELETE）
- 需要认证的接口（ctx.state.userId存在）
- 特定模块的接口（users, roles, permissions等）

❌ **不会记录的请求**：
- GET请求
- 公开接口（登录、注册等）
- 静态资源和文档（/docs, /swagger）
- 未认证的请求

### 日志数据结构

```javascript
const logData = {
  userId: ctx.state.userId,           // 用户ID
  username: 'admin',                  // 用户名
  operation: '创建用户',               // 操作描述
  module: '用户管理',                  // 模块名称
  action: 'create',                   // 动作类型
  method: 'POST',                     // HTTP方法
  path: '/nodeapi/users',             // 请求路径
  ipAddress: '192.168.1.100',         // IP地址
  userAgent: 'Mozilla/5.0...',        // 用户代理
  requestParams: {...},               // 请求参数（已脱敏）
  responseStatus: 200,                // 响应状态码
  responseData: {...},                // 响应数据（简化）
  duration: 150,                      // 耗时（毫秒）
  status: 'success',                  // 操作状态
  errorMessage: null,                 // 错误信息
}
```

### 敏感信息脱敏

中间件会自动脱敏以下字段：
- `password`
- `oldPassword`
- `newPassword`
- `token`
- `access_token`

脱敏后的值为 `***`。

### 使用方式

中间件已在 `app.js` 中全局注册，无需手动引入：

```javascript
// koa2/src/app.js
const operationLogger = require('./middlewares/operation-logger')

app.use(operationLogger) // 全局应用
```

---

## 🔒 安全特性

### 1. 权限控制

- ✅ 所有接口需要JWT认证
- ✅ 基于RBAC的细粒度权限控制
- ✅ 查看日志需要 `log:read` 权限
- ✅ 删除日志需要 `log:delete` 权限

### 2. 输入验证

- ✅ 分页参数验证
- ✅ 日期格式验证
- ✅ ID格式验证

### 3. SQL注入防护

- ✅ 使用参数化查询
- ✅ 不使用字符串拼接
- ✅ PostgreSQL预处理语句

### 4. 敏感信息保护

- ✅ 请求参数自动脱敏
- ✅ 响应数据简化存储
- ✅ 密码等敏感字段不记录

---

## 🎯 最佳实践

### 1. 前端分页查询

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="logList"
    :pagination="pagination"
    @update:page="handlePageChange"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()
const logList = ref([])
const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0,
})

const filters = ref({
  username: '',
  startDate: '',
  endDate: '',
})

async function fetchLogs() {
  try {
    const params = new URLSearchParams({
      page: pagination.value.page,
      limit: pagination.value.pageSize,
      ...filters.value,
    })

    const response = await fetch(`/nodeapi/operation-logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const result = await response.json()

    if (result.code === 200) {
      logList.value = result.data.list
      pagination.value.itemCount = result.data.total
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('网络请求失败')
  }
}

function handlePageChange(page) {
  pagination.value.page = page
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>
```

### 2. 日期范围筛选

```vue
<template>
  <n-date-picker
    v-model:value="dateRange"
    type="daterange"
    @update:value="handleDateChange"
  />
</template>

<script setup>
import { ref } from 'vue'

const dateRange = ref(null)

function handleDateChange(range) {
  if (range && range.length === 2) {
    filters.value.startDate = new Date(range[0]).toISOString()
    filters.value.endDate = new Date(range[1]).toISOString()
  } else {
    filters.value.startDate = ''
    filters.value.endDate = ''
  }
  
  pagination.value.page = 1
  fetchLogs()
}
</script>
```

### 3. 用户名筛选

```vue
<template>
  <n-input
    v-model:value="filters.username"
    placeholder="输入用户名搜索"
    @keyup.enter="handleSearch"
  >
    <template #prefix>
      <n-icon><SearchOutline /></n-icon>
    </template>
  </n-input>
</template>

<script setup>
function handleSearch() {
  pagination.value.page = 1
  fetchLogs()
}
</script>
```

### 4. 批量删除

```javascript
async function handleBatchDelete(selectedIds) {
  if (!selectedIds || selectedIds.length === 0) {
    message.warning('请选择要删除的日志')
    return
  }

  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedIds.length} 条日志吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await fetch('/nodeapi/operation-logs/batch-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ids: selectedIds })
        })

        const result = await response.json()

        if (result.code === 200) {
          message.success(result.message)
          fetchLogs()
        } else {
          message.error(result.message)
        }
      } catch (error) {
        message.error('网络请求失败')
      }
    }
  })
}
```

---

## 🧪 测试示例

### cURL测试

#### 1. 获取日志列表

```bash
curl -X GET "http://localhost:3000/nodeapi/operation-logs?page=1&limit=20&username=admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. 带日期范围筛选

```bash
curl -X GET "http://localhost:3000/nodeapi/operation-logs?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. 获取日志详情

```bash
curl -X GET "http://localhost:3000/nodeapi/operation-logs/LOG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. 删除日志

```bash
curl -X DELETE "http://localhost:3000/nodeapi/operation-logs/LOG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. 批量删除

```bash
curl -X POST "http://localhost:3000/nodeapi/operation-logs/batch-delete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["LOG_ID_1", "LOG_ID_2"]
  }'
```

#### 6. 获取统计数据

```bash
curl -X GET "http://localhost:3000/nodeapi/operation-logs/stats?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 相关文档

- [鉴权中间件文档](./AUTH_MIDDLEWARE.md)
- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)
- [用户管理API](./USER_MANAGEMENT_API.md)

---

## 🎉 总结

操作日志模块提供了完整的日志记录和查询功能，具有以下特点：

✅ **自动化**：中间件自动记录所有非GET请求  
✅ **完整性**：6个接口覆盖所有日志管理需求  
✅ **安全性**：JWT认证、RBAC权限、敏感信息脱敏  
✅ **规范性**：统一的返回格式、错误处理  
✅ **灵活性**：支持分页、日期范围、用户名筛选  
✅ **易用性**：清晰的接口设计、完善的文档  

**核心特性**：
- ✅ 自动记录非GET请求
- ✅ 支持分页查询
- ✅ 支持日期范围筛选
- ✅ 支持用户名筛选
- ✅ 敏感信息自动脱敏
- ✅ 统计数据可视化

**下一步**：
1. 确保数据库已初始化（包含operation_logs表）
2. 启动后端服务
3. 使用Postman或cURL测试各个接口
4. 在前端实现日志管理页面
5. 根据需要调整日志记录规则
6. 定期清理过期日志（可选）

所有功能已经完成，可以直接使用！🚀
