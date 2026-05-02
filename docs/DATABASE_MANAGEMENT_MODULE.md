# 数据库管理模块开发文档

> **文档版本**: v1.0  
> **最后更新**: 2026-05-01  
> **模块路径**: `src/views/database-management/`

---

## 📋 目录

- [1. 模块概述](#1-模块概述)
- [2. 功能特性](#2-功能特性)
- [3. 技术架构](#3-技术架构)
- [4. 权限配置](#4-权限配置)
- [5. API 接口](#5-api-接口)
- [6. 安全机制](#6-安全机制)
- [7. 使用指南](#7-使用指南)
- [8. 测试清单](#8-测试清单)
- [9. 常见问题](#9-常见问题)

---

## 1. 模块概述

数据库管理模块是一个企业级的数据库运维工具，提供 SQL 执行、数据库导出、表结构查看等功能。该模块采用前后端分离架构，具备完善的权限控制和安全防护机制。

### 1.1 核心功能

| 功能 | 说明 | 权限码 |
|------|------|--------|
| SQL 执行 | 执行 SELECT/INSERT/UPDATE/DELETE 等 SQL 语句 | `database:execute` |
| 数据库导出 | 将整个数据库导出为 ZIP 格式的 SQL 备份文件 | `database:export` |
| 表结构查看 | 查看所有用户表的字段结构信息 | `database:table` |

### 1.2 适用场景

- ✅ 开发环境：快速查询和调试数据
- ✅ 测试环境：数据验证和问题排查
- ⚠️ 生产环境：受限模式，禁止高危操作

---

## 2. 功能特性

### 2.1 SQL 执行功能

**特性列表**：
- 🎯 支持所有标准 SQL 语句（SELECT、INSERT、UPDATE、DELETE）
- 🔒 生产环境安全限制（禁止 DROP、TRUNCATE、ALTER 等危险操作）
- 📊 SELECT 结果自动分页展示（最多 500 条）
- ⏱️ 显示 SQL 执行时间
- 📝 完整的操作日志记录
- ⚠️ 执行前确认弹窗，防止误操作
- 🔄 Loading 状态防止重复提交

**返回格式**：

**SELECT 语句**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "type": "SELECT",
    "columns": ["id", "username", "email"],
    "rows": [
      { "id": "1", "username": "admin", "email": "admin@example.com" }
    ],
    "total": 1,
    "executionTime": 45,
    "message": "查询成功，返回 1 条记录"
  }
}
```

**非 SELECT 语句**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "type": "NON_SELECT",
    "affectedRows": 5,
    "executionTime": 32,
    "message": "执行成功，影响 5 行"
  }
}
```

---

### 2.2 数据库导出功能

**特性列表**：
- 📦 使用 `pg_dump` 导出完整数据库
- 🗜️ 自动压缩为 ZIP 格式
- 📅 文件名包含日期：`db_backup_YYYY-MM-DD.zip`
- 🧹 临时文件自动清理（SQL 文件和 ZIP 文件）
- ⏰ 60 秒超时配置，适应大数据量导出
- 📊 记录导出时间和文件大小到操作日志
- 💾 流式传输，支持大文件下载

**导出流程**：
```
用户点击导出 
  → 确认弹窗 
  → 调用 pg_dump 生成 SQL 文件 
  → 压缩为 ZIP 
  → 删除 SQL 文件 
  → 流式传输 ZIP 给前端 
  → 前端触发浏览器下载 
  → 删除 ZIP 文件
```

---

### 2.3 表结构查看功能

**特性列表**：
- 📋 左侧显示所有用户表名列表
- 🔍 支持搜索框过滤表名
- 📊 右侧显示选中表的字段结构
- 🎨 数据类型用蓝色标签显示
- ✅ 可空状态用颜色区分（绿色=否，橙色=是）
- 📄 支持分页展示（10/20/50/100 条）
- 🔄 刷新按钮重新加载数据

**表格列定义**：

| 列名 | 宽度 | 说明 |
|------|------|------|
| 序号 | 70px | 字段顺序 (ordinal_position) |
| 字段名 | 180px | column_name |
| 数据类型 | 150px | data_type（带标签） |
| 长度 | 100px | character_maximum_length |
| 可空 | 80px | is_nullable（带颜色标签） |
| 默认值 | 自适应 | column_default |

---

## 3. 技术架构

### 3.1 前端架构

**技术栈**：
- Vue 3 Composition API
- Naive UI 组件库
- Pinia 状态管理
- Axios HTTP 客户端

**文件结构**：
```
src/views/database-management/
├── index.vue                          # 主页面
├── components/
│   ├── SqlEditor.vue                  # SQL 编辑器组件
│   ├── SqlResult.vue                  # 执行结果展示组件
│   └── TableStructure.vue             # 表结构查看组件
src/api/
└── database.js                        # API 接口定义
```

**组件关系图**：
```
index.vue (主页面)
├── SqlEditor.vue (SQL 编辑器)
├── SqlResult.vue (执行结果)
└── TableStructure.vue (表结构)
```

---

### 3.2 后端架构

**技术栈**：
- Koa2 框架
- PostgreSQL 数据库
- pg_dump 工具
- archiver 压缩库

**文件结构**：
```
koa2/src/modules/database/
├── controller.js                      # 控制器层
├── service.js                         # 服务层（业务逻辑）
└── routes.js                          # 路由配置
koa2/src/config/sql/
└── init-database-management.js        # 权限初始化脚本
```

**分层架构**：
```
Routes (路由层)
  ↓ auth + checkPermission 中间件
Controller (控制层)
  ↓ 参数验证、响应封装
Service (服务层)
  ↓ 安全检查、SQL 执行、文件操作
Database (数据库层)
```

---

## 4. 权限配置

### 4.1 权限树结构

```
系统管理 (system)
└── 数据库管理 (database)                    [menu]
    ├── 查看数据库管理页面 (database:view)    [button]
    ├── 执行SQL语句 (database:execute)        [button]
    ├── 导出数据库 (database:export)          [button]
    └── 查看表结构 (database:table)           [button]
```

### 4.2 权限分配

**默认分配**：
- `super_admin` 角色：拥有所有数据库管理权限
- 其他角色：需要手动分配

**SQL 初始化**：
```javascript
// 在 init-database-management.js 中自动执行
await pool.query(`
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT 
    (SELECT id FROM roles WHERE code = 'super_admin'),
    p.id
  FROM permissions p
  WHERE p.code IN ('database', 'database:view', 'database:execute', 'database:export', 'database:table')
  ON CONFLICT (role_id, permission_id) DO NOTHING
`)
```

### 4.3 前端权限控制

**按钮级权限**：
```vue
<!-- 执行 SQL 按钮 -->
<n-button v-permission="'database:execute'">执行 SQL</n-button>

<!-- 导出数据库按钮 -->
<n-button v-permission="'database:export'">导出数据库</n-button>

<!-- 查看表结构按钮 -->
<n-button v-permission="'database:table'">查看表结构</n-button>
```

**菜单级权限**：
- 无 `database:view` 权限的用户看不到"数据库管理"菜单

---

## 5. API 接口

### 5.1 执行 SQL

**接口**：`POST /api/database/execute`

**请求体**：
```json
{
  "sql": "SELECT * FROM users LIMIT 10"
}
```

**响应**：见 [2.1 SQL 执行功能](#21-sql-执行功能)

**权限要求**：`database:execute`

---

### 5.2 导出数据库

**接口**：`GET /api/database/export`

**请求参数**：无

**响应**：ZIP 文件流（二进制）

**响应头**：
```
Content-Type: application/zip
Content-Disposition: attachment; filename="db_backup_2026-05-01.zip"
```

**权限要求**：`database:export`

**超时配置**：60 秒

---

### 5.3 获取表列表

**接口**：`GET /api/database/tables`

**请求参数**：无

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": ["users", "roles", "permissions", "sessions"]
}
```

**权限要求**：`database:table`

---

### 5.4 获取表结构

**接口**：`GET /api/database/tables/:name`

**路径参数**：
- `name`: 表名（如 `users`）

**响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "column_name": "id",
      "data_type": "uuid",
      "character_maximum_length": null,
      "is_nullable": "否",
      "column_default": "gen_random_uuid()",
      "ordinal_position": 1
    },
    {
      "column_name": "username",
      "data_type": "varchar",
      "character_maximum_length": 100,
      "is_nullable": "否",
      "column_default": null,
      "ordinal_position": 2
    }
  ]
}
```

**权限要求**：`database:table`

---

## 6. 安全机制

### 6.1 SQL 执行安全限制

#### **所有环境生效的限制**：

1. **禁止多条语句**：
   - 检测多个分号
   - 错误提示：`安全限制：禁止执行多条 SQL 语句`

2. **SQL 注入检测**：
   - 检测可疑模式：`; DROP`, `; DELETE`, `; UPDATE`, `; INSERT`, `; ALTER`, `; TRUNCATE`
   - 错误提示：`安全限制：检测到可疑的 SQL 注入模式`

3. **SELECT 行数限制**：
   - 最多返回 500 条记录
   - 超出部分自动截断

#### **生产环境额外限制**（`NODE_ENV=production`）：

1. **禁止 DROP 语句**：
   ```sql
   DROP TABLE users;  -- ❌ 被拦截
   ```

2. **禁止 TRUNCATE 语句**：
   ```sql
   TRUNCATE TABLE users;  -- ❌ 被拦截
   ```

3. **禁止 DELETE 无 WHERE 条件**：
   ```sql
   DELETE FROM users;           -- ❌ 被拦截
   DELETE FROM users WHERE id = 1;  -- ✅ 允许
   ```

4. **禁止 ALTER 语句**：
   ```sql
   ALTER TABLE users ADD COLUMN test VARCHAR(100);  -- ❌ 被拦截
   ```

5. **禁止 CREATE USER**：
   ```sql
   CREATE USER test_user WITH PASSWORD '123456';  -- ❌ 被拦截
   ```

6. **禁止 GRANT/REVOKE**：
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE mydb TO test_user;  -- ❌ 被拦截
   REVOKE ALL PRIVILEGES ON DATABASE mydb FROM test_user;  -- ❌ 被拦截
   ```

---

### 6.2 表名安全验证

**正则表达式验证**：
```javascript
if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
  throw new Error('无效的表名')
}
```

**允许的字符**：
- ✅ 字母（a-z, A-Z）
- ✅ 数字（0-9）
- ✅ 下划线（_）

**禁止的字符**：
- ❌ 空格
- ❌ 特殊符号（`;`, `'`, `"`, `-`, etc.）
- ❌ SQL 关键字注入

---

### 6.3 参数化查询

**防止 SQL 注入**：
```javascript
// ✅ 正确：使用参数化查询
const query = `
  SELECT * FROM information_schema.columns
  WHERE table_name = $1
`
const result = await pool.query(query, [tableName])

// ❌ 错误：字符串拼接
const query = `SELECT * FROM information_schema.columns WHERE table_name = '${tableName}'`
```

---

### 6.4 操作日志记录

**记录内容**：

| 操作类型 | 记录时机 | 记录内容 |
|---------|---------|---------|
| 执行 SQL | 执行前 | 用户ID、用户名、SQL 语句、IP 地址 |
| SQL 执行成功 | 执行后 | 用户ID、用户名、执行时间、IP 地址 |
| SQL 执行失败 | 异常时 | 用户ID、用户名、错误信息、IP 地址 |
| 导出数据库 | 导出开始 | 用户ID、用户名、IP 地址 |
| 数据库导出成功 | 导出完成 | 用户ID、用户名、导出时间、文件大小、IP 地址 |
| 数据库导出失败 | 异常时 | 用户ID、用户名、错误信息、IP 地址 |

**查询操作日志**：
```sql
SELECT 
  username,
  action,
  resource,
  details,
  ip_address,
  created_at
FROM operation_logs
WHERE resource = 'database'
ORDER BY created_at DESC
LIMIT 20;
```

---

### 6.5 临时文件清理

**清理策略**：

1. **SQL 文件**：
   - 压缩完成后立即删除
   - 位置：`koa2/temp/db_backup_YYYY-MM-DD.sql`

2. **ZIP 文件**：
   - 流式传输完成后删除
   - 位置：`koa2/temp/db_backup_YYYY-MM-DD.zip`

3. **异常情况**：
   - 导出失败时，在 catch 块中清理所有临时文件
   - 文件流错误时，也要删除 ZIP 文件

**清理代码**：
```javascript
// Controller 中
fileStream.on('end', () => {
  fs.unlinkSync(result.filePath)
  console.log(`临时文件已删除: ${result.filePath}`)
})

fileStream.on('error', (err) => {
  if (fs.existsSync(result.filePath)) {
    fs.unlinkSync(result.filePath)
  }
})

// Service 中（失败时）
if (fs.existsSync(sqlFilePath)) {
  fs.unlinkSync(sqlFilePath)
}
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath)
}
```

---

## 7. 使用指南

### 7.1 初始化数据库权限

**方式一：使用 npm 脚本**（推荐）
```bash
cd koa2
npm run db:init
```

**方式二：手动执行**
```bash
cd koa2
node src/config/sql/init-db.js
```

**验证权限**：
```sql
-- 检查数据库管理权限是否已创建
SELECT code, name, type, path
FROM permissions
WHERE code LIKE 'database%'
ORDER BY sort_order;

-- 检查 super_admin 角色是否有权限
SELECT r.code as role_code, p.code as permission_code
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'super_admin' AND p.code LIKE 'database%';
```

---

### 7.2 启动服务

**后端**：
```bash
cd koa2
npm run dev
```

**前端**：
```bash
npm run dev
```

---

### 7.3 访问页面

1. 登录系统（使用 `super_admin` 账号）
2. 在侧边栏找到：**系统管理 → 数据库管理**
3. 或直接访问：`http://localhost:5173/system/database`

---

### 7.4 执行 SQL 示例

**示例 1：查询用户列表**
```sql
SELECT id, username, email, status 
FROM users 
LIMIT 10;
```

**示例 2：统计角色数量**
```sql
SELECT r.name, COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.name
ORDER BY user_count DESC;
```

**示例 3：更新用户状态**
```sql
UPDATE users 
SET status = 'inactive' 
WHERE last_login_at < NOW() - INTERVAL '90 days';
```

---

### 7.5 导出数据库

1. 点击"导出数据库"按钮
2. 确认弹窗中点击"确认导出"
3. 等待下载完成（大数据库可能需要较长时间）
4. 下载的 ZIP 文件包含完整的 SQL 备份

**导入备份**：
```bash
# 解压 ZIP 文件
unzip db_backup_2026-05-01.zip

# 导入 SQL 文件
psql -U postgres -d ai_agent_platform -f db_backup_2026-05-01.sql
```

---

### 7.6 查看表结构

1. 点击"查看表结构"按钮
2. 左侧显示所有表名列表
3. 使用搜索框过滤表名
4. 点击表名，右侧显示字段结构
5. 点击"刷新"按钮重新加载数据

---

## 8. 测试清单

### 8.1 权限控制测试

| 测试项 | 步骤 | 预期结果 | 状态 |
|--------|------|---------|------|
| 无权限用户看不到菜单 | 使用普通用户登录 | 侧边栏不显示"数据库管理" | ☐ |
| 有权限用户可以访问 | 使用 super_admin 登录 | 可以正常访问页面 | ☐ |
| 按钮权限控制 | 移除某个按钮权限 | 对应按钮隐藏 | ☐ |

---

### 8.2 SQL 执行测试

| 测试项 | SQL 示例 | 预期结果 | 状态 |
|--------|---------|---------|------|
| 基本 SELECT | `SELECT * FROM users LIMIT 5` | 显示结果表格 | ☐ |
| 确认弹窗 | 点击执行 SQL | 弹出确认对话框 | ☐ |
| Loading 状态 | 执行慢查询 | 按钮显示 loading | ☐ |
| 多语句拦截 | `SELECT 1; SELECT 2;` | 被拦截并提示 | ☐ |
| SQL 注入拦截 | `SELECT 1; DROP TABLE users;` | 被拦截并提示 | ☐ |
| 生产环境 DROP | `DROP TABLE test;` | 生产环境被拦截 | ☐ |
| 生产环境 TRUNCATE | `TRUNCATE TABLE users;` | 生产环境被拦截 | ☐ |
| DELETE 无 WHERE | `DELETE FROM users;` | 生产环境被拦截 | ☐ |
| 操作日志记录 | 执行任意 SQL | 日志中有记录 | ☐ |

---

### 8.3 数据库导出测试

| 测试项 | 步骤 | 预期结果 | 状态 |
|--------|------|---------|------|
| 确认弹窗 | 点击导出数据库 | 弹出确认对话框 | ☐ |
| 文件名格式 | 下载文件 | `db_backup_2026-05-01.zip` | ☐ |
| ZIP 内容 | 解压文件 | 包含 SQL 备份文件 | ☐ |
| 临时文件清理 | 导出后检查 temp 目录 | 目录为空 | ☐ |
| 操作日志 | 查看操作日志 | 有导出记录 | ☐ |
| 大文件导出 | 导出 >100MB 数据库 | 60秒内完成或超时提示 | ☐ |

---

### 8.4 表结构查看测试

| 测试项 | 步骤 | 预期结果 | 状态 |
|--------|------|---------|------|
| 表名列表 | 进入表结构页面 | 左侧显示所有表名 | ☐ |
| 搜索功能 | 输入表名关键词 | 列表自动过滤 | ☐ |
| 点击表名 | 点击某个表 | 右侧显示字段结构 | ☐ |
| 字段信息 | 查看字段详情 | 包含名称、类型、长度、可空、默认值 | ☐ |
| 数据类型标签 | 查看数据类型 | 蓝色标签显示 | ☐ |
| 可空状态颜色 | 查看可空列 | 绿色=否，橙色=是 | ☐ |
| 分页功能 | 超过 20 个字段 | 显示分页器 | ☐ |
| 刷新功能 | 点击刷新按钮 | 重新加载数据 | ☐ |

---

### 8.5 边界情况测试

| 测试项 | 输入 | 预期结果 | 状态 |
|--------|------|---------|------|
| 空 SQL | 空字符串 | 提示"请输入 SQL 语句" | ☐ |
| 超长 SQL | >10KB 的 SQL | 正常执行 | ☐ |
| 特殊字符表名 | `users; DROP TABLE users` | 被正则验证拦截 | ☐ |
| 不存在的表 | `non_existent_table` | 友好错误提示 | ☐ |
| 网络断开 | 执行时断网 | 提示"网络连接失败" | ☐ |

---

## 9. 常见问题

### Q1: 为什么生产环境不能执行 DROP 语句？

**A**: 这是为了防止误操作导致数据丢失。生产环境的数据库通常包含重要数据，DROP 语句会永久删除表结构和数据，且无法恢复。如果确实需要执行，可以：
1. 临时将 `NODE_ENV` 设置为 `development`
2. 或者直接在数据库中手动执行

---

### Q2: 导出数据库时提示超时怎么办？

**A**: 默认超时时间为 60 秒。如果数据库较大，可以：
1. 优化数据库结构，减少不必要的数据
2. 修改前端 API 的 `timeout` 配置（`src/api/database.js`）
3. 使用命令行工具直接导出：
   ```bash
   PGPASSWORD=your_password pg_dump -h localhost -U postgres -d ai_agent_platform -f backup.sql
   ```

---

### Q3: 如何为其他角色分配数据库管理权限？

**A**: 在数据库中执行以下 SQL：
```sql
-- 假设要给 developer 角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE code = 'developer'),
  p.id
FROM permissions p
WHERE p.code IN ('database:view', 'database:execute')  -- 只分配部分权限
ON CONFLICT (role_id, permission_id) DO NOTHING;
```

---

### Q4: 操作日志在哪里查看？

**A**: 在系统中访问：**系统管理 → 操作日志**，或者直接查询数据库：
```sql
SELECT * FROM operation_logs 
WHERE resource = 'database' 
ORDER BY created_at DESC 
LIMIT 50;
```

---

### Q5: 临时文件没有清理干净怎么办？

**A**: 检查 `koa2/temp` 目录，手动删除残留文件：
```bash
cd koa2
rm -rf temp/*
```

同时检查代码中的错误处理逻辑，确保所有异常路径都有清理代码。

---

### Q6: 如何自定义 SQL 执行的安全限制？

**A**: 修改 `koa2/src/modules/database/service.js` 中的 `validateSQL` 函数：
```javascript
function validateSQL(sql) {
  const upperSQL = sql.toUpperCase().trim()
  
  // 添加新的限制规则
  if (upperSQL.includes('YOUR_PATTERN')) {
    throw new Error('安全限制：自定义提示信息')
  }
  
  // ... 其他规则
}
```

---

### Q7: 表结构查看时显示"暂无表数据"？

**A**: 可能的原因：
1. 数据库中没有用户表（只有系统表）
2. 查询的 schema 不是 `public`
3. 权限不足，无法访问 `information_schema`

检查方法：
```sql
-- 查看 public schema 下的所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
```

---

## 📞 技术支持

如有问题，请联系开发团队或查阅项目文档。

---

**文档结束**

