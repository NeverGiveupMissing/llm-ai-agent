# 数据库初始化完整指南

## 📋 概述

本项目使用 **PostgreSQL** 作为数据库，包含以下模块的表结构：

1. **AI 聊天系统** - 记忆、会话、消息管理
2. **RBAC 权限系统** - 用户、角色、权限管理

所有表结构都通过 `init-db.js` 脚本自动创建，支持幂等性（可重复执行）。

## 🚀 快速开始

### 方式一：使用 npm 脚本（推荐）

```bash
cd koa2
npm run db:init
```

### 方式二：直接运行 Node.js 脚本

```bash
cd koa2
node src/config/init-db.js
```

### 方式三：手动执行 SQL（不推荐）

如果需要使用 SQL 文件，可以使用之前创建的迁移文件：
```bash
psql -U postgres -d your_database -f src/config/migration-rbac-system.sql
```

## ⚙️ 环境配置

### 1. 确保 PostgreSQL 已安装并运行

```bash
# 检查 PostgreSQL 状态
pg_isready

# 或查看版本
psql --version
```

### 2. 配置数据库连接

在 `.env` 文件中配置：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres
```

### 3. 验证连接

```bash
# 测试数据库连接
psql -h localhost -p 5432 -U postgres -d postgres
```

## 📊 数据库表结构

### AI 聊天系统表（5 个）

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `memories` | 记忆表 | id, user_id, content, embedding, memory_type, tags |
| `chat_sessions` | 会话表 | id, user_id, title, message_count, memory_ids |
| `chat_memories` | 会话-记忆关联表 | session_id, memory_id |
| `chat_messages` | 消息表 | id, session_id, role, content, metadata |

### RBAC 权限系统表（5 个）

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `users` | 用户表 | id, username, password_hash, email, status |
| `roles` | 角色表 | id, name, display_name, is_system |
| `permissions` | 权限表 | id, code, name, module, action, resource |
| `user_roles` | 用户-角色关联表 | user_id, role_id |
| `role_permissions` | 角色-权限关联表 | role_id, permission_id |

### 总计：10 个表

## 🔧 初始化流程

执行 `npm run db:init` 后，脚本会按顺序执行以下步骤：

### Step 1: 启用 vector 扩展
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2-7: 创建 AI 聊天系统表
- memories 表 + 5 个索引
- chat_sessions 表 + 2 个索引
- chat_memories 表 + 2 个索引
- chat_messages 表 + 2 个索引
- 添加缺失字段（message_count, memory_ids）

### Step 8-12: 创建 RBAC 权限系统表
- users 表 + 3 个索引
- roles 表 + 1 个索引
- permissions 表 + 3 个索引
- user_roles 表 + 2 个索引
- role_permissions 表 + 2 个索引

### Step 13: 插入初始数据
- 2 个默认角色（admin, user）
- 20 个默认权限
- admin 角色分配所有权限
- user 角色分配基础权限

## 📝 初始数据详情

### 默认角色

| 角色 ID | 名称 | 显示名称 | 描述 | 系统角色 |
|---------|------|---------|------|---------|
| a000...0001 | admin | 管理员 | 系统管理员，拥有所有权限 | ✅ |
| a000...0002 | user | 普通用户 | 基本使用权限 | ✅ |

### 默认权限（20 个）

#### 用户管理（4 个）
- `user:read` - 查看用户
- `user:create` - 创建用户
- `user:update` - 更新用户
- `user:delete` - 删除用户

#### 角色管理（4 个）
- `role:read` - 查看角色
- `role:create` - 创建角色
- `role:update` - 更新角色
- `role:delete` - 删除角色

#### 权限管理（4 个）
- `permission:read` - 查看权限
- `permission:create` - 创建权限
- `permission:update` - 更新权限
- `permission:delete` - 删除权限

#### 聊天管理（4 个）
- `chat:read` - 查看聊天
- `chat:create` - 创建聊天
- `chat:update` - 更新聊天
- `chat:delete` - 删除聊天

#### 记忆管理（4 个）
- `memory:read` - 查看记忆
- `memory:create` - 创建记忆
- `memory:update` - 更新记忆
- `memory:delete` - 删除记忆

### 角色权限分配

**admin 角色：** 拥有所有 20 个权限

**user 角色：** 拥有 4 个基础权限
- `chat:read`
- `chat:create`
- `memory:read`
- `memory:create`

## ✅ 验证初始化结果

### 1. 检查表是否创建成功

```sql
-- 查看所有表
\dt

-- 或
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

预期输出应包含 10 个表。

### 2. 检查初始数据

```sql
-- 查看角色
SELECT * FROM roles;

-- 查看权限数量
SELECT COUNT(*) FROM permissions;

-- 查看 admin 角色的权限
SELECT p.code, p.name
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'admin';

-- 查看 user 角色的权限
SELECT p.code, p.name
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'user';
```

### 3. 创建测试用户

```sql
-- 注意：实际使用中应通过 API 注册，密码需要 bcrypt 加密
INSERT INTO users (username, password_hash, email, status)
VALUES ('testuser', '$2b$10$...', 'test@example.com', 'active');

-- 为用户分配角色
INSERT INTO user_roles (user_id, role_id)
VALUES ('user-uuid-here', 'a0000000-0000-0000-0000-000000000002');
```

## 🔄 重新初始化

如果需要重新初始化数据库（**警告：会保留现有数据**）：

```bash
# 方式 1：重新运行脚本（安全，不会删除现有数据）
npm run db:init

# 方式 2：删除所有表后重新创建（危险！）
psql -U postgres -d your_database -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:init
```

## ⚠️ 注意事项

### 1. 幂等性保证
- ✅ 所有表使用 `CREATE TABLE IF NOT EXISTS`
- ✅ 所有索引使用 `IF NOT EXISTS` 检查
- ✅ 初始数据使用 `ON CONFLICT DO NOTHING`
- ✅ 可以安全地多次执行

### 2. 数据安全
- ❌ **不要**在生产环境随意执行 `DROP TABLE`
- ✅ 初始化前建议备份数据库
- ✅ 生产环境应禁用自动初始化

### 3. 性能优化
- 向量索引使用 IVFFLAT 算法
- 所有外键都有索引
- 常用查询字段都有索引

### 4. 扩展性
- 预留了 `metadata` JSONB 字段
- 支持自定义标签系统
- 权限系统支持细粒度控制

## 🐛 常见问题

### Q1: 提示 "vector 扩展不存在"
**A:** 需要安装 pgvector 扩展
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-14-pgvector

# CentOS/RHEL
sudo yum install pgvector_14

# 然后重启 PostgreSQL
sudo systemctl restart postgresql
```

### Q2: 提示 "权限不足"
**A:** 确保使用的数据库用户有创建表和索引的权限
```sql
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;
```

### Q3: 初始化后无法登录
**A:** 需要通过 API 注册用户，不能直接插入明文密码
```bash
curl -X POST http://localhost:8000/koa2api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

### Q4: 如何修改初始权限？
**A:** 编辑 `init-db.js` 中的 INSERT 语句，然后重新运行脚本

### Q5: 表已存在但缺少某些字段
**A:** 脚本会自动检测并添加缺失字段，无需手动操作

## 📚 相关文档

- [RBAC 系统完整文档](./rbac-system.md)
- [JWT 认证指南](./jwt-auth-guide.md)
- [API 接口文档](访问 /koa2api-docs)

## 🎯 下一步

数据库初始化完成后，您可以：

1. **启动后端服务**
   ```bash
   npm run dev
   ```

2. **注册用户**
   ```bash
   curl -X POST http://localhost:8000/koa2api/users/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"password123"}'
   ```

3. **登录获取 Token**
   ```bash
   curl -X POST http://localhost:8000/koa2api/users/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"password123"}'
   ```

4. **测试受保护接口**
   ```bash
   curl http://localhost:8000/koa2api/users/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 📞 技术支持

如遇到问题，请检查：
1. PostgreSQL 是否正常运行
2. `.env` 配置是否正确
3. 数据库用户权限是否足够
4. 查看详细错误日志
