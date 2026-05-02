# RBAC 数据库企业级规范说明

## 📋 概述

本文档描述了项目中RBAC权限系统的数据库设计规范，遵循企业级标准，包含软删除、审计字段、树形结构等特性。

## 🗄️ 数据库表结构

### 1. users（用户表）

存储系统用户信息，支持软删除和完整审计。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 主键ID |
| username | VARCHAR(64) | NOT NULL, UNIQUE | 用户名（登录用） |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希值（bcrypt） |
| email | VARCHAR(128) | - | 邮箱地址 |
| avatar_url | VARCHAR(255) | - | 头像URL |
| nickname | VARCHAR(64) | - | 昵称 |
| phone | VARCHAR(20) | - | 手机号 |
| bio | TEXT | - | 个人简介 |
| status | VARCHAR(32) | DEFAULT 'active', CHECK | 状态：active/inactive/banned |
| last_login_at | TIMESTAMPTZ | - | 最后登录时间 |
| last_login_ip | VARCHAR(45) | - | 最后登录IP |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), AUTO UPDATE | 更新时间（自动） |
| deleted_at | TIMESTAMPTZ | - | 软删除时间（NULL=未删除） |

#### 索引

```sql
-- 唯一索引
idx_users_username (username)
idx_users_email (email)

-- 普通索引
idx_users_status (status)
idx_users_deleted_at (deleted_at)

-- 复合索引（优化活跃用户查询）
idx_users_active (status, deleted_at) WHERE deleted_at IS NULL
```

#### 触发器

```sql
-- 自动更新 updated_at
BEFORE UPDATE ON users
EXECUTE FUNCTION update_updated_at_column()
```

---

### 2. roles（角色表）

存储系统角色定义，支持软删除。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 主键ID |
| name | VARCHAR(64) | NOT NULL, UNIQUE | 角色名称（英文标识） |
| display_name | VARCHAR(128) | NOT NULL | 显示名称（中文） |
| description | TEXT | - | 角色描述 |
| is_system | BOOLEAN | DEFAULT false | 是否系统内置角色 |
| sort_order | INTEGER | DEFAULT 0 | 排序号 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), AUTO UPDATE | 更新时间（自动） |
| deleted_at | TIMESTAMPTZ | - | 软删除时间（NULL=未删除） |

#### 索引

```sql
idx_roles_name (name)
idx_roles_deleted_at (deleted_at)
```

#### 触发器

```sql
BEFORE UPDATE ON roles
EXECUTE FUNCTION update_updated_at_column()
```

#### 种子数据

```sql
-- 超级管理员
('a0000000-0000-0000-0000-000000000001', 'admin', '超级管理员', '系统最高权限管理员，拥有所有权限', true)

-- 普通用户
('a0000000-0000-0000-0000-000000000002', 'user', '普通用户', '基本使用权限', true)

-- 版主
('a0000000-0000-0000-0000-000000000003', 'moderator', '版主', '内容管理权限', true)
```

---

### 3. permissions（权限表）

存储系统权限（菜单/按钮/API），支持树形结构和软删除。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 主键ID |
| code | VARCHAR(128) | NOT NULL, UNIQUE | 权限代码（唯一标识） |
| name | VARCHAR(128) | NOT NULL | 权限名称 |
| description | TEXT | - | 权限描述 |
| module | VARCHAR(64) | NOT NULL | 所属模块 |
| action | VARCHAR(32) | NOT NULL | 操作类型（view/create/update/delete等） |
| resource | VARCHAR(64) | - | 资源标识 |
| type | VARCHAR(32) | DEFAULT 'button', CHECK | 权限类型：menu/button/api |
| parent_id | UUID | REFERENCES permissions(id), ON DELETE SET NULL | 父级权限ID（树形结构） |
| path | VARCHAR(255) | - | 路由路径（仅菜单） |
| icon | VARCHAR(128) | - | 图标（仅菜单） |
| component | VARCHAR(255) | - | 组件路径（仅菜单） |
| sort_order | INTEGER | DEFAULT 0 | 排序号 |
| hidden | BOOLEAN | DEFAULT false | 是否隐藏（前端不显示） |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), AUTO UPDATE | 更新时间（自动） |
| deleted_at | TIMESTAMPTZ | - | 软删除时间（NULL=未删除） |

#### 索引

```sql
idx_permissions_code (code)
idx_permissions_module (module)
idx_permissions_action (action)
idx_permissions_parent_id (parent_id)
idx_permissions_type (type)
idx_permissions_sort_order (sort_order)
idx_permissions_deleted_at (deleted_at)
```

#### 触发器

```sql
BEFORE UPDATE ON permissions
EXECUTE FUNCTION update_updated_at_column()
```

#### 权限类型说明

- **menu**：菜单权限，控制左侧导航栏显示
- **button**：按钮权限，控制页面内按钮显示/隐藏
- **api**：接口权限，控制API访问权限

#### 树形结构示例

```
工作台 (menu, parent_id=NULL)
  └─ 查看工作台 (button, parent_id=工作台ID)

用户管理 (menu, parent_id=NULL)
  ├─ 查看用户 (button, parent_id=用户管理ID)
  ├─ 创建用户 (button, parent_id=用户管理ID)
  ├─ 更新用户 (button, parent_id=用户管理ID)
  └─ 删除用户 (button, parent_id=用户管理ID)
```

---

### 4. user_roles（用户角色关联表）

用户和角色的多对多关系，支持软删除和审计。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| user_id | UUID | NOT NULL, REFERENCES users(id), PRIMARY KEY | 用户ID |
| role_id | UUID | NOT NULL, REFERENCES roles(id), PRIMARY KEY | 角色ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 分配时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), AUTO UPDATE | 更新时间（自动） |
| deleted_at | TIMESTAMPTZ | - | 软删除时间（NULL=未删除） |
| created_by | UUID | REFERENCES users(id) | 分配者的管理员ID |

#### 索引

```sql
idx_user_roles_user_id (user_id)
idx_user_roles_role_id (role_id)
idx_user_roles_deleted_at (deleted_at)
```

#### 级联删除

```sql
ON DELETE CASCADE -- 当用户或角色被删除时，自动删除关联记录
```

---

### 5. role_permissions（角色权限关联表）

角色和权限的多对多关系，支持软删除和审计。

#### 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| role_id | UUID | NOT NULL, REFERENCES roles(id), PRIMARY KEY | 角色ID |
| permission_id | UUID | NOT NULL, REFERENCES permissions(id), PRIMARY KEY | 权限ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 分配时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), AUTO UPDATE | 更新时间（自动） |
| deleted_at | TIMESTAMPTZ | - | 软删除时间（NULL=未删除） |
| created_by | UUID | REFERENCES users(id) | 分配者的管理员ID |

#### 索引

```sql
idx_role_permissions_role_id (role_id)
idx_role_permissions_permission_id (permission_id)
idx_role_permissions_deleted_at (deleted_at)
```

#### 级联删除

```sql
ON DELETE CASCADE -- 当角色或权限被删除时，自动删除关联记录
```

---

## 🔧 数据库对象

### 1. 触发器函数

#### update_updated_at_column()

自动更新 `updated_at` 字段的触发器函数。

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**应用表**：
- users
- roles
- permissions

---

### 2. 视图

#### v_active_users（活跃用户视图）

查询所有未删除且状态为active的用户。

```sql
CREATE OR REPLACE VIEW v_active_users AS
SELECT * FROM users 
WHERE deleted_at IS NULL AND status = 'active';
```

**用途**：快速查询活跃用户，无需每次都写WHERE条件。

---

#### v_active_roles（活跃角色视图）

查询所有未删除的角色。

```sql
CREATE OR REPLACE VIEW v_active_roles AS
SELECT * FROM roles 
WHERE deleted_at IS NULL;
```

---

#### v_active_permissions（活跃权限视图）

查询所有未删除的权限。

```sql
CREATE OR REPLACE VIEW v_active_permissions AS
SELECT * FROM permissions 
WHERE deleted_at IS NULL;
```

---

#### v_user_roles_detail（用户角色详情视图）

查询用户及其角色的详细信息。

```sql
CREATE OR REPLACE VIEW v_user_roles_detail AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  r.id as role_id,
  r.name as role_name,
  r.display_name as role_display_name,
  ur.created_at as assigned_at,
  ur.created_by as assigned_by
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.deleted_at IS NULL 
  AND r.deleted_at IS NULL 
  AND ur.deleted_at IS NULL;
```

**用途**：一键获取用户的所有角色信息，无需多次JOIN。

---

#### v_role_permissions_detail（角色权限详情视图）

查询角色及其权限的详细信息。

```sql
CREATE OR REPLACE VIEW v_role_permissions_detail AS
SELECT 
  r.id as role_id,
  r.name as role_name,
  p.id as permission_id,
  p.code as permission_code,
  p.name as permission_name,
  p.type as permission_type,
  p.module,
  p.action,
  rp.created_at as assigned_at,
  rp.created_by as assigned_by
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.deleted_at IS NULL 
  AND p.deleted_at IS NULL 
  AND rp.deleted_at IS NULL;
```

**用途**：一键获取角色的所有权限信息，用于权限验证。

---

## 🎯 企业级规范要点

### 1. 软删除（Soft Delete）

#### 设计理念

- 不物理删除数据，而是标记 `deleted_at` 时间戳
- `deleted_at IS NULL` 表示未删除
- `deleted_at IS NOT NULL` 表示已删除

#### 优势

✅ 数据可恢复  
✅ 保留历史记录  
✅ 符合审计要求  
✅ 避免外键约束问题  

#### 查询规范

```sql
-- ✅ 正确：查询未删除的数据
SELECT * FROM users WHERE deleted_at IS NULL;

-- ❌ 错误：可能查到已删除的数据
SELECT * FROM users;
```

---

### 2. 审计字段（Audit Fields）

每个表都包含以下审计字段：

- **created_at**：记录创建时间
- **updated_at**：记录最后更新时间（自动更新）
- **deleted_at**：记录软删除时间
- **created_by**：记录创建者/操作者（关联表）

#### 自动更新机制

通过触发器自动更新 `updated_at`，无需在业务代码中手动设置。

```sql
-- 触发器自动执行，无需手动干预
UPDATE users SET username = 'newname' WHERE id = 'xxx';
-- updated_at 会自动更新为当前时间
```

---

### 3. 树形结构（Tree Structure）

permissions表使用 `parent_id` 实现树形结构。

#### 查询子节点

```sql
-- 查询某个菜单下的所有按钮权限
SELECT * FROM permissions 
WHERE parent_id = '菜单ID' 
  AND deleted_at IS NULL;
```

#### 递归查询（PostgreSQL特有）

```sql
-- 查询某个节点的所有子孙节点
WITH RECURSIVE permission_tree AS (
  -- 基础查询：根节点
  SELECT *, 0 as level
  FROM permissions
  WHERE id = '根节点ID' AND deleted_at IS NULL
  
  UNION ALL
  
  -- 递归查询：子节点
  SELECT p.*, pt.level + 1
  FROM permissions p
  JOIN permission_tree pt ON p.parent_id = pt.id
  WHERE p.deleted_at IS NULL
)
SELECT * FROM permission_tree ORDER BY level, sort_order;
```

---

### 4. 索引优化

#### 索引策略

1. **主键索引**：所有表的id字段
2. **唯一索引**：username、code、name等业务唯一字段
3. **外键索引**：user_id、role_id、permission_id等关联字段
4. **查询索引**：status、type、deleted_at等常用查询字段
5. **复合索引**：针对高频组合查询优化

#### 性能优化示例

```sql
-- 复合索引优化活跃用户查询
CREATE INDEX idx_users_active ON users(status, deleted_at) 
WHERE deleted_at IS NULL;

-- 使用该索引的查询会非常快
SELECT * FROM users 
WHERE status = 'active' AND deleted_at IS NULL;
```

---

### 5. 字符集和编码

#### PostgreSQL默认配置

- **字符集**：UTF8（天然支持utf8mb4）
- **排序规则**：en_US.UTF-8（可自定义）
- **时区**：UTC（建议统一使用UTC，前端转换）

#### 注意事项

PostgreSQL的UTF8已经支持4字节Unicode字符（包括emoji），无需特别配置utf8mb4。

---

## 📊 数据初始化

### 种子数据包含

1. **超级管理员账号**
   - 用户名：admin
   - 密码：admin123（首次登录后必须修改）
   - 角色：admin

2. **初始角色**
   - admin（超级管理员）
   - user（普通用户）
   - moderator（版主）

3. **基础菜单权限**
   - 工作台
   - AI对话
   - 智能体
   - 知识库
   - 记忆管理
   - 工具
   - 系统设置
   - API文档
   - 对话日志
   - 用户管理
   - 角色管理
   - 权限管理
   - 操作日志

4. **基础按钮权限**
   - 用户管理：read/create/update/delete
   - 角色管理：read/create/update/delete
   - 权限管理：read/create/update/delete
   - 聊天管理：read/create/update/delete

---

## 🔐 安全规范

### 1. 密码存储

- ✅ 使用bcrypt加密（cost factor = 10）
- ✅ 不在数据库中存储明文密码
- ✅ 不在日志中输出密码

### 2. SQL注入防护

- ✅ 使用参数化查询（$1, $2...）
- ✅ 不使用字符串拼接构建SQL
- ✅ 对用户输入进行验证和过滤

### 3. 权限验证

- ✅ 后端验证所有API权限
- ✅ 前端根据权限动态显示/隐藏UI
- ✅ 使用JWT Token进行身份认证

### 4. 数据访问控制

- ✅ 普通用户只能访问自己的数据
- ✅ 管理员可以访问所有数据
- ✅ 敏感操作需要二次确认

---

## 🚀 最佳实践

### 1. 查询优化

```sql
-- ✅ 好：使用视图简化查询
SELECT * FROM v_user_roles_detail WHERE user_id = 'xxx';

-- ❌ 差：每次都写复杂的JOIN
SELECT u.*, r.* 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = 'xxx' 
  AND u.deleted_at IS NULL 
  AND r.deleted_at IS NULL 
  AND ur.deleted_at IS NULL;
```

### 2. 软删除处理

```javascript
// ✅ 好：在Model层统一处理软删除
async getList(params) {
  const query = `
    SELECT * FROM users 
    WHERE deleted_at IS NULL  -- 统一过滤已删除数据
    ORDER BY created_at DESC
  `
}

// ❌ 差：每次查询都忘记加 deleted_at IS NULL
```

### 3. 批量操作

```javascript
// ✅ 好：使用事务保证数据一致性
async assignRoles(userId, roleIds) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // 先删除旧的角色
    await client.query(
      'UPDATE user_roles SET deleted_at = NOW() WHERE user_id = $1',
      [userId]
    )
    
    // 再添加新的角色
    for (const roleId of roleIds) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id, created_by) VALUES ($1, $2, $3)',
        [userId, roleId, currentUserId]
      )
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
```

### 4. 分页查询

```javascript
// ✅ 好：使用LIMIT和OFFSET分页
async getList({ page = 1, limit = 20 }) {
  const offset = (page - 1) * limit
  const query = `
    SELECT * FROM users 
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `
  return pool.query(query, [limit, offset])
}
```

---

## 📝 维护指南

### 1. 数据库迁移

当需要修改表结构时：

1. 创建迁移脚本（如：`migrations/2024-01-01-add-field.sql`）
2. 使用ALTER TABLE添加字段
3. 更新相关Model和Service
4. 测试无误后提交

### 2. 数据备份

```bash
# 备份整个数据库
pg_dump -U postgres -d your_database > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U postgres -d your_database < backup_20240101.sql
```

### 3. 性能监控

```sql
-- 查看慢查询
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 查看表大小
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎉 总结

本项目的RBAC数据库设计遵循企业级规范，具有以下特点：

✅ **完整性**：包含所有必要的表和字段  
✅ **安全性**：软删除、审计字段、权限控制  
✅ **可扩展性**：树形结构、灵活的权限类型  
✅ **高性能**：合理的索引设计、视图优化  
✅ **易维护**：清晰的命名、完善的注释  
✅ **标准化**：统一的字段命名、数据类型  

**下一步**：
1. 运行 `npm run db:init` 初始化数据库
2. 检查表结构是否符合预期
3. 验证种子数据是否正确插入
4. 开始开发业务功能

---

**提示**：数据库是系统的核心，务必谨慎操作，定期备份！
