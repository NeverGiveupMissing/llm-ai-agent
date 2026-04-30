# 数据库初始化指南

## 🚀 一键初始化（推荐）

只需一个命令即可完成所有数据库表和初始数据的创建：

```bash
npm run db:init
```

## 📋 初始化内容

执行 `db:init` 后，将自动创建：

### 1. 向量扩展
- ✅ pgvector 扩展（用于向量搜索）

### 2. 核心业务表（7张）
- ✅ memories - 记忆表
- ✅ chat_sessions - 会话表
- ✅ chat_memories - 对话记忆关联表
- ✅ chat_messages - 消息表

### 3. RBAC 权限系统表（5张）
- ✅ users - 用户表
- ✅ roles - 角色表
- ✅ permissions - 权限表
- ✅ user_roles - 用户-角色关联表
- ✅ role_permissions - 角色-权限关联表

### 4. 种子数据

#### 角色数据（3个）
- **超级管理员 (admin)** - 拥有所有权限
- **普通用户 (user)** - 基础使用权限
- **版主 (moderator)** - 内容管理权限

#### 权限数据（20个）
- 用户管理：user:read, user:create, user:update, user:delete
- 角色管理：role:read, role:create, role:update, role:delete
- 权限管理：permission:read, permission:create, permission:update, permission:delete
- 聊天管理：chat:read, chat:create, chat:update, chat:delete
- 记忆管理：memory:read, memory:create, memory:update, memory:delete
- 会话组管理：session-group:read, session-group:create, session-group:update, session-group:delete
- 日志管理：log:read, log:export

#### 角色-权限关系
- admin 角色 → 所有20个权限
- user 角色 → 5个基础权限（聊天、记忆、会话组读取）
- moderator 角色 → 13个内容管理权限

## 🔄 重复执行安全

脚本使用了 `IF NOT EXISTS` 和 `ON CONFLICT DO NOTHING`，可以安全地重复执行，不会造成数据重复或错误。

## ⚠️ 注意事项

1. **首次运行前**：确保 PostgreSQL 服务已启动
2. **环境变量**：检查 `.env` 文件中的数据库配置是否正确
3. **pgvector 扩展**：需要 PostgreSQL 安装 pgvector 扩展
4. **生产环境**：建议在生产环境中设置强密码

## 🎯 下一步

初始化完成后，您可以：

1. 启动服务器：`npm start` 或 `npm run dev`
2. 访问 API 文档：http://localhost:65432/api-docs
3. 使用默认账户登录（如果创建了的话）

---

**提示**：所有数据库初始化都在一个命令中完成，无需分别执行多个脚本！