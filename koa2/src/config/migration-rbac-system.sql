-- ============================================
-- RBAC 权限系统数据库表结构
-- 创建时间：2026-04-29
-- 说明：用户、角色、权限管理系统
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(128),
  avatar_url VARCHAR(255),
  status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 2. 角色表
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(128),
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- 系统角色不可删除
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- 3. 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  module VARCHAR(64), -- 所属模块：user, role, permission, chat, memory 等
  action VARCHAR(32), -- 操作类型：create, read, update, delete
  resource VARCHAR(64), -- 资源类型
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- 4. 用户-角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- 5. 角色-权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 6. 插入初始系统角色
INSERT INTO roles (name, display_name, description, is_system) VALUES
('admin', '系统管理员', '拥有所有权限', true),
('user', '普通用户', '基本使用权限', true)
ON CONFLICT (name) DO NOTHING;

-- 7. 插入基础权限
INSERT INTO permissions (code, name, description, module, action, resource) VALUES
-- 用户管理权限
('user:create', '创建用户', '创建新用户账号', 'user', 'create', 'user'),
('user:read', '查看用户', '查看用户信息', 'user', 'read', 'user'),
('user:update', '更新用户', '更新用户信息', 'user', 'update', 'user'),
('user:delete', '删除用户', '删除用户账号', 'user', 'delete', 'user'),

-- 角色管理权限
('role:create', '创建角色', '创建新角色', 'role', 'create', 'role'),
('role:read', '查看角色', '查看角色信息', 'role', 'read', 'role'),
('role:update', '更新角色', '更新角色信息', 'role', 'update', 'role'),
('role:delete', '删除角色', '删除角色', 'role', 'delete', 'role'),

-- 权限管理权限
('permission:read', '查看权限', '查看权限列表', 'permission', 'read', 'permission'),

-- 聊天权限
('chat:create', '创建会话', '创建新的聊天会话', 'chat', 'create', 'session'),
('chat:read', '查看会话', '查看聊天会话', 'chat', 'read', 'session'),
('chat:update', '更新会话', '更新会话信息', 'chat', 'update', 'session'),
('chat:delete', '删除会话', '删除聊天会话', 'chat', 'delete', 'session'),

-- 记忆管理权限
('memory:create', '创建记忆', '创建新记忆', 'memory', 'create', 'memory'),
('memory:read', '查看记忆', '查看记忆内容', 'memory', 'read', 'memory'),
('memory:update', '更新记忆', '更新记忆信息', 'memory', 'update', 'memory'),
('memory:delete', '删除记忆', '删除记忆', 'memory', 'delete', 'memory')
ON CONFLICT (code) DO NOTHING;

-- 8. 为管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'admin'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- 9. 为普通用户分配基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'user'),
  id
FROM permissions
WHERE code IN (
  'user:read', 'user:update',
  'chat:create', 'chat:read', 'chat:update', 'chat:delete',
  'memory:create', 'memory:read', 'memory:update', 'memory:delete'
)
ON CONFLICT DO NOTHING;
