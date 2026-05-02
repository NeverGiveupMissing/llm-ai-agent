# 数据库企业级规范迁移指南

## 📋 概述

本文档指导您如何将现有数据库升级到企业级规范，包含软删除、审计字段等特性。

## ⚠️ 重要提示

**本迁移脚本不会破坏现有数据！**

- ✅ 使用 `IF NOT EXISTS` 检查字段是否存在
- ✅ 只添加新字段，不修改现有字段
- ✅ 保留所有现有数据
- ✅ 可以多次运行（幂等性）

## 🚀 迁移步骤

### 方法一：使用优化脚本（推荐）

适用于**已有数据库**的情况。

```bash
cd koa2

# 1. 连接到数据库
psql -U postgres -d your_database_name

# 2. 执行优化脚本
\i database/optimize-rbac-tables.sql

# 3. 检查输出，确认所有操作成功
```

或者直接运行：

```bash
psql -U postgres -d your_database_name -f database/optimize-rbac-tables.sql
```

### 方法二：重新初始化数据库

适用于**开发环境**或**全新安装**的情况。

```bash
cd koa2

# 这会删除所有表并重新创建（⚠️ 会丢失所有数据！）
npm run db:init
```

## 📊 迁移内容

### 1. users 表

#### 新增字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| nickname | VARCHAR(64) | 昵称 |
| phone | VARCHAR(20) | 手机号 |
| bio | TEXT | 个人简介 |
| last_login_ip | VARCHAR(45) | 最后登录IP |
| deleted_at | TIMESTAMPTZ | 软删除时间 |

#### 新增索引

```sql
idx_users_deleted_at (deleted_at)
idx_users_active (status, deleted_at) WHERE deleted_at IS NULL
```

---

### 2. roles 表

#### 新增字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| sort_order | INTEGER | 排序号 |
| deleted_at | TIMESTAMPTZ | 软删除时间 |

#### 新增索引

```sql
idx_roles_deleted_at (deleted_at)
```

---

### 3. permissions 表

#### 新增字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| type | VARCHAR(32) | 权限类型（menu/button/api） |
| parent_id | UUID | 父级权限ID（树形结构） |
| path | VARCHAR(255) | 路由路径 |
| icon | VARCHAR(128) | 图标 |
| component | VARCHAR(255) | 组件路径 |
| sort_order | INTEGER | 排序号 |
| hidden | BOOLEAN | 是否隐藏 |
| updated_at | TIMESTAMPTZ | 更新时间 |
| deleted_at | TIMESTAMPTZ | 软删除时间 |

#### 新增索引

```sql
idx_permissions_parent_id (parent_id)
idx_permissions_type (type)
idx_permissions_sort_order (sort_order)
idx_permissions_deleted_at (deleted_at)
```

---

### 4. user_roles 表

#### 新增字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| updated_at | TIMESTAMPTZ | 更新时间 |
| deleted_at | TIMESTAMPTZ | 软删除时间 |
| created_by | UUID | 分配者的管理员ID |

#### 新增索引

```sql
idx_user_roles_deleted_at (deleted_at)
```

---

### 5. role_permissions 表

#### 新增字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| updated_at | TIMESTAMPTZ | 更新时间 |
| deleted_at | TIMESTAMPTZ | 软删除时间 |
| created_by | UUID | 分配者的管理员ID |

#### 新增索引

```sql
idx_role_permissions_deleted_at (deleted_at)
```

---

### 6. 触发器

自动为以下表创建 `updated_at` 自动更新触发器：

- users
- roles
- permissions

```sql
-- 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 7. 视图

创建以下常用视图：

- v_active_users（活跃用户）
- v_active_roles（活跃角色）
- v_active_permissions（活跃权限）
- v_user_roles_detail（用户角色详情）
- v_role_permissions_detail（角色权限详情）

---

## 🔍 验证迁移

### 1. 检查字段是否添加成功

```sql
-- 检查 users 表
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 应该包含：id, username, password_hash, email, avatar_url, 
--           nickname, phone, bio, status, last_login_at, 
--           last_login_ip, created_at, updated_at, deleted_at
```

### 2. 检查索引是否创建成功

```sql
-- 查看所有索引
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'roles', 'permissions', 'user_roles', 'role_permissions')
ORDER BY tablename, indexname;
```

### 3. 检查触发器是否创建成功

```sql
-- 查看触发器
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('users', 'roles', 'permissions');
```

### 4. 检查视图是否创建成功

```sql
-- 查看所有视图
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- 应该包含：v_active_users, v_active_roles, v_active_permissions,
--           v_user_roles_detail, v_role_permissions_detail
```

### 5. 测试软删除功能

```sql
-- 创建一个测试用户
INSERT INTO users (username, password_hash, email) 
VALUES ('test_user', '$2b$10$xxx', 'test@example.com');

-- 软删除该用户
UPDATE users SET deleted_at = NOW() WHERE username = 'test_user';

-- 查询活跃用户（不应该看到 test_user）
SELECT * FROM v_active_users WHERE username = 'test_user';
-- 结果应该为空

-- 恢复用户
UPDATE users SET deleted_at = NULL WHERE username = 'test_user';

-- 清理测试数据
DELETE FROM users WHERE username = 'test_user';
```

### 6. 测试自动更新 updated_at

```sql
-- 查看用户的 updated_at
SELECT username, updated_at FROM users WHERE username = 'admin';

-- 等待几秒后更新用户
UPDATE users SET email = 'admin@example.com' WHERE username = 'admin';

-- 再次查看 updated_at（应该已更新）
SELECT username, updated_at FROM users WHERE username = 'admin';
```

---

## ⚠️ 注意事项

### 1. 备份数据

在执行任何数据库操作之前，务必备份数据：

```bash
pg_dump -U postgres -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 生产环境谨慎操作

- ✅ 先在测试环境验证
- ✅ 选择低峰期执行
- ✅ 准备好回滚方案
- ✅ 监控数据库性能

### 3. 代码适配

迁移后需要更新相关代码：

#### Model层

```javascript
// 之前的查询
async getList(params) {
  const query = `SELECT * FROM users ORDER BY created_at DESC`
}

// 迁移后的查询（必须过滤已删除的数据）
async getList(params) {
  const query = `
    SELECT * FROM users 
    WHERE deleted_at IS NULL  -- ⚠️ 必须添加
    ORDER BY created_at DESC
  `
}
```

#### Service层

```javascript
// 软删除用户（而不是物理删除）
async deleteUser(userId) {
  // ❌ 之前：物理删除
  // await pool.query('DELETE FROM users WHERE id = $1', [userId])
  
  // ✅ 现在：软删除
  await pool.query(
    'UPDATE users SET deleted_at = NOW() WHERE id = $1', 
    [userId]
  )
}

// 恢复用户
async restoreUser(userId) {
  await pool.query(
    'UPDATE users SET deleted_at = NULL WHERE id = $1', 
    [userId]
  )
}
```

### 4. 前端适配

如果使用了 `deleted_at` 字段，前端可能需要调整：

```vue
<!-- 显示删除状态 -->
<n-tag :type="row.deleted_at ? 'error' : 'success'">
  {{ row.deleted_at ? '已删除' : '正常' }}
</n-tag>

<!-- 提供恢复按钮 -->
<n-button 
  v-if="row.deleted_at" 
  @click="handleRestore(row.id)"
>
  恢复
</n-button>
```

---

## 🔄 回滚方案

如果迁移后出现问题，可以回滚：

### 1. 删除新增字段

```sql
-- users 表
ALTER TABLE users DROP COLUMN IF EXISTS nickname;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_ip;
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;

-- roles 表
ALTER TABLE roles DROP COLUMN IF EXISTS sort_order;
ALTER TABLE roles DROP COLUMN IF EXISTS deleted_at;

-- permissions 表
ALTER TABLE permissions DROP COLUMN IF EXISTS type;
ALTER TABLE permissions DROP COLUMN IF EXISTS parent_id;
ALTER TABLE permissions DROP COLUMN IF EXISTS path;
ALTER TABLE permissions DROP COLUMN IF EXISTS icon;
ALTER TABLE permissions DROP COLUMN IF EXISTS component;
ALTER TABLE permissions DROP COLUMN IF EXISTS sort_order;
ALTER TABLE permissions DROP COLUMN IF EXISTS hidden;
ALTER TABLE permissions DROP COLUMN IF EXISTS updated_at;
ALTER TABLE permissions DROP COLUMN IF EXISTS deleted_at;

-- user_roles 表
ALTER TABLE user_roles DROP COLUMN IF EXISTS updated_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS created_by;

-- role_permissions 表
ALTER TABLE role_permissions DROP COLUMN IF EXISTS updated_at;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS created_by;
```

### 2. 删除索引

```sql
DROP INDEX IF EXISTS idx_users_deleted_at;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_roles_deleted_at;
DROP INDEX IF EXISTS idx_permissions_parent_id;
DROP INDEX IF EXISTS idx_permissions_type;
DROP INDEX IF EXISTS idx_permissions_sort_order;
DROP INDEX IF EXISTS idx_permissions_deleted_at;
DROP INDEX IF EXISTS idx_user_roles_deleted_at;
DROP INDEX IF EXISTS idx_role_permissions_deleted_at;
```

### 3. 删除触发器

```sql
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
DROP TRIGGER IF EXISTS trigger_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS trigger_permissions_updated_at ON permissions;
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### 4. 删除视图

```sql
DROP VIEW IF EXISTS v_active_users;
DROP VIEW IF EXISTS v_active_roles;
DROP VIEW IF EXISTS v_active_permissions;
DROP VIEW IF EXISTS v_user_roles_detail;
DROP VIEW IF EXISTS v_role_permissions_detail;
```

### 5. 从备份恢复

如果上述方法不行，可以从备份恢复：

```bash
psql -U postgres -d your_database < backup_YYYYMMDD_HHMMSS.sql
```

---

## 📚 相关文档

- [数据库企业级规范说明](./DATABASE_ENTERPRISE_SPEC.md)
- [RBAC权限系统架构](./RBAC_ARCHITECTURE.md)
- [PostgreSQL最佳实践](https://www.postgresql.org/docs/)

---

## 🎉 总结

迁移完成后，您的数据库将具备：

✅ **软删除**：数据可恢复，符合审计要求  
✅ **自动审计**：created_at/updated_at 自动维护  
✅ **树形结构**：permissions 支持多级菜单  
✅ **高性能**：优化的索引设计  
✅ **易用性**：常用视图简化查询  
✅ **可扩展**：灵活的字段设计  

**下一步**：
1. 运行迁移脚本
2. 验证迁移结果
3. 更新相关代码
4. 测试功能是否正常
5. 部署到生产环境

---

**提示**：如有问题，请查看日志或联系DBA！
