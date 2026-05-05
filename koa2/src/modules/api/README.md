# 接口管理模块开发文档

## 概述

接口管理模块是系统管理下的一个子模块，用于管理和维护系统中所有的 API 接口信息。通过该模块，可以方便地查看、新增、修改和删除系统中的接口信息。

## 数据库设计

### sys_api 表结构

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| api_id | BIGSERIAL | 接口ID (自增主键) | 自动生成 |
| api_name | VARCHAR(100) | 接口名称 | 必填 |
| api_url | VARCHAR(200) | 接口路径 | 必填 |
| api_method | VARCHAR(10) | 请求方式 (GET/POST/PUT/DELETE) | 'GET' |
| api_category | VARCHAR(50) | 所属模块 | 必填 |
| status | CHAR(1) | 状态 (0正常 1停用) | '0' |
| remark | VARCHAR(500) | 备注 | '' |
| create_time | TIMESTAMP | 创建时间 | CURRENT_TIMESTAMP |
| update_time | TIMESTAMP | 更新时间 | NULL |
| update_by | VARCHAR(64) | 更新者 | '' |

### 索引

- `idx_sys_api_url`: 接口路径索引
- `idx_sys_api_category`: 所属模块索引

## 后端 API

### 基础路径

`/api/apis`

### 接口列表

**GET** `/api/apis`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| api_name | string | 否 | 接口名称（模糊查询） |
| api_url | string | 否 | 接口路径（模糊查询） |
| status | string | 否 | 状态 (0正常 1停用) |
| page | number | 否 | 页码，默认 1 |
| page_size | number | 否 | 每页数量，默认 10 |

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "success": true,
  "data": {
    "list": [
      {
        "api_id": 1,
        "api_name": "登录",
        "api_url": "/api/auth/login",
        "api_method": "POST",
        "api_category": "认证管理",
        "status": "0",
        "remark": "用户登录接口",
        "create_time": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 30,
    "page": 1,
    "page_size": 10
  }
}
```

### 获取所有接口

**GET** `/api/apis/all`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "success": true,
  "data": [...]
}
```

### 获取接口详情

**GET** `/api/apis/:id`

**响应示例：**

```json
{
  "code": 200,
  "message": "查询成功",
  "success": true,
  "data": {
    "api_id": 1,
    "api_name": "登录",
    "api_url": "/api/auth/login",
    "api_method": "POST",
    "api_category": "认证管理",
    "status": "0",
    "remark": "用户登录接口",
    "create_time": "2024-01-01T00:00:00.000Z",
    "update_time": null
  }
}
```

### 创建接口

**POST** `/api/apis`

**请求体：**

```json
{
  "api_name": "获取用户列表",
  "api_url": "/api/users",
  "api_method": "GET",
  "api_category": "用户管理",
  "status": "0",
  "remark": "分页查询用户列表"
}
```

**响应示例：**

```json
{
  "code": 201,
  "message": "接口创建成功",
  "data": { ... }
}
```

### 更新接口

**PUT** `/api/apis/:id`

**请求体：**

```json
{
  "api_name": "获取用户列表V2",
  "status": "1"
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "接口更新成功",
  "data": { ... }
}
```

### 删除接口

**DELETE** `/api/apis/:id`

**响应示例：**

```json
{
  "code": 200,
  "message": "接口删除成功"
}
```

## 前端页面

### 文件结构

```
src/views/system/api/
└── index.vue
```

### 功能特性

1. **搜索功能**
   - 接口名称模糊查询
   - 接口路径模糊查询
   - 状态筛选

2. **列表展示**
   - 分页显示
   - 多选功能
   - 请求方式用 Tag 展示（不同颜色）
   - 状态用 Tag 展示

3. **批量操作**
   - 批量删除接口

4. **表单弹窗**
   - 新增接口
   - 编辑接口
   - 表单验证

### 路由配置

```javascript
{
  path: 'api',
  name: 'ApiManagement',
  component: () => import('@/views/system/api/index.vue'),
  meta: {
    title: '接口管理',
    perms: ['api:list'],
  },
}
```

## 初始化步骤

### 1. 执行 SQL 脚本

```bash
# 方式一：直接在数据库中执行
psql -U postgres -d your_database -f koa2/database/sql/sys_api.sql

# 方式二：使用 Node.js 脚本
cd koa2
node src/modules/api/init-db.js
```

### 2. 重启后端服务

```bash
cd koa2
npm run dev
```

### 3. 验证接口

访问：`http://localhost:65432/api/apis?page=1&page_size=10`

## 权限配置

系统默认创建了以下权限标识：

- `api:list` - 查询接口列表
- `api:query` - 查询接口详情
- `api:create` - 新增接口
- `api:update` - 更新接口
- `api:delete` - 删除接口

## 菜单配置

接口管理菜单已挂载在"系统管理"下，菜单ID为 112。

如需调整挂载位置，请修改 SQL 文件中的 `parent_id` 字段。

## 注意事项

1. 接口路径建议使用 RESTful 风格，如：`/api/users/:id`
2. 请求方式仅支持：GET、POST、PUT、DELETE、PATCH、OPTIONS
3. 接口名称、接口路径、所属模块为必填字段
4. 删除接口不会级联删除相关联的权限数据
5. 批量删除会并行执行删除操作，请注意事务处理

## 后续优化建议

1. 添加接口文档自动生成功能
2. 支持接口测试功能（类似 Postman）
3. 添加接口访问统计功能
4. 支持接口版本管理
5. 添加接口依赖关系管理
