-- ============================================
-- Koa2 项目数据库表结构初始化脚本
-- 使用 PostgreSQL 数据库
-- 所有表使用 IF NOT EXISTS，可重复执行
-- 执行方式: psql -U username -d database -f database/create_tables.sql
-- ============================================

-- 启用 vector 扩展（用于向量搜索）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. RBAC 权限系统表
-- ============================================

-- users 表（用户表）
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  email         VARCHAR(100) UNIQUE,
  nickname      VARCHAR(50),
  avatar        VARCHAR(255),
  status        SMALLINT     NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP    DEFAULT NULL
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.password IS '密码(bcrypt)';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.nickname IS '昵称';
COMMENT ON COLUMN users.avatar IS '头像URL';
COMMENT ON COLUMN users.status IS '状态 1启用 0禁用';
COMMENT ON COLUMN users.deleted_at IS '软删除时间';

-- roles 表（角色表）
CREATE TABLE IF NOT EXISTS roles (
  id            SERIAL PRIMARY KEY,
  role_name     VARCHAR(50)  NOT NULL UNIQUE,
  role_code     VARCHAR(50)  NOT NULL UNIQUE,
  description   VARCHAR(255),
  status        SMALLINT     NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP    DEFAULT NULL
);

COMMENT ON TABLE roles IS '角色表';
COMMENT ON COLUMN roles.role_name IS '角色名称';
COMMENT ON COLUMN roles.role_code IS '角色编码 如 ADMIN/USER';
COMMENT ON COLUMN roles.description IS '角色描述';

-- permissions 表（权限表）
CREATE TABLE IF NOT EXISTS permissions (
  id              SERIAL PRIMARY KEY,
  permission_name VARCHAR(50)  NOT NULL,
  permission_code VARCHAR(100) NOT NULL UNIQUE,
  type            SMALLINT     NOT NULL DEFAULT 1,
  parent_id       INTEGER      DEFAULT 0,
  path            VARCHAR(255),
  method          VARCHAR(10),
  description     VARCHAR(255),
  sort            INTEGER      DEFAULT 0,
  status          SMALLINT     NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permissions IS '权限表';
COMMENT ON COLUMN permissions.permission_name IS '权限名称';
COMMENT ON COLUMN permissions.permission_code IS '权限编码 如 user:list';
COMMENT ON COLUMN permissions.type IS '1菜单 2按钮 3接口';
COMMENT ON COLUMN permissions.parent_id IS '父级ID';
COMMENT ON COLUMN permissions.path IS '路由路径';
COMMENT ON COLUMN permissions.method IS 'HTTP方法 GET/POST等';

-- user_roles 表（用户角色关联表）
CREATE TABLE IF NOT EXISTS user_roles (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER  NOT NULL,
  role_id     INTEGER  NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_user_role UNIQUE (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_roles IS '用户角色关联表';

-- role_permissions 表（角色权限关联表）
CREATE TABLE IF NOT EXISTS role_permissions (
  id              SERIAL PRIMARY KEY,
  role_id         INTEGER  NOT NULL,
  permission_id   INTEGER  NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_role_permission UNIQUE (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

COMMENT ON TABLE role_permissions IS '角色权限关联表';

-- ============================================
-- 2. 聊天会话相关表
-- ============================================

-- session_groups 表（会话分组表）
CREATE TABLE IF NOT EXISTS session_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  icon          VARCHAR(255),
  user_id       VARCHAR(64) NOT NULL,
  is_pinned     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE session_groups IS '会话分组表';
COMMENT ON COLUMN session_groups.name IS '分组名称';
COMMENT ON COLUMN session_groups.icon IS '分组图标';
COMMENT ON COLUMN session_groups.user_id IS '用户ID';
COMMENT ON COLUMN session_groups.is_pinned IS '是否置顶';

-- chat_sessions 表（会话表）
CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         VARCHAR(64) NOT NULL,
  title           VARCHAR(200),
  message_count   INTEGER DEFAULT 0,
  memory_ids      UUID[] DEFAULT '{}',
  is_pinned       BOOLEAN DEFAULT false,
  share_token     VARCHAR(255),
  group_id        UUID REFERENCES session_groups(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE chat_sessions IS '聊天会话表';
COMMENT ON COLUMN chat_sessions.user_id IS '用户ID';
COMMENT ON COLUMN chat_sessions.title IS '会话标题';
COMMENT ON COLUMN chat_sessions.message_count IS '消息数量';
COMMENT ON COLUMN chat_sessions.memory_ids IS '关联的记忆ID数组';
COMMENT ON COLUMN chat_sessions.is_pinned IS '是否置顶';
COMMENT ON COLUMN chat_sessions.share_token IS '分享令牌';
COMMENT ON COLUMN chat_sessions.group_id IS '所属分组ID';

-- chat_messages 表（消息表）
CREATE TABLE IF NOT EXISTS chat_messages (
  id            SERIAL PRIMARY KEY,
  session_id    UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role          VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE chat_messages IS '聊天消息表';
COMMENT ON COLUMN chat_messages.session_id IS '会话ID';
COMMENT ON COLUMN chat_messages.role IS '角色 user/assistant/system';
COMMENT ON COLUMN chat_messages.content IS '消息内容';
COMMENT ON COLUMN chat_messages.metadata IS '元数据';

-- ============================================
-- 3. 记忆系统相关表
-- ============================================

-- memories 表（记忆表）
CREATE TABLE IF NOT EXISTS memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(64) NOT NULL,
  session_id    VARCHAR(64),
  content       TEXT NOT NULL,
  summary       VARCHAR(500),
  embedding     VECTOR(1536),
  memory_type   VARCHAR(32) DEFAULT 'fact',
  tags          TEXT[] DEFAULT '{}',
  importance    INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  source        VARCHAR(64),
  metadata      JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE memories IS '记忆表';
COMMENT ON COLUMN memories.user_id IS '用户ID';
COMMENT ON COLUMN memories.session_id IS '会话ID';
COMMENT ON COLUMN memories.content IS '记忆内容';
COMMENT ON COLUMN memories.summary IS '记忆摘要';
COMMENT ON COLUMN memories.embedding IS '向量嵌入(1536维)';
COMMENT ON COLUMN memories.memory_type IS '记忆类型 fact/opinion/preference';
COMMENT ON COLUMN memories.tags IS '标签数组';
COMMENT ON COLUMN memories.importance IS '重要性 1-10';
COMMENT ON COLUMN memories.source IS '来源 auto_extract/manual';
COMMENT ON COLUMN memories.metadata IS '元数据';
COMMENT ON COLUMN memories.is_active IS '是否激活';

-- chat_memories 表（会话记忆关联表）
CREATE TABLE IF NOT EXISTS chat_memories (
  id            SERIAL PRIMARY KEY,
  session_id    UUID NOT NULL,
  memory_id     UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_session_memory UNIQUE (session_id, memory_id)
);

COMMENT ON TABLE chat_memories IS '会话记忆关联表';
COMMENT ON COLUMN chat_memories.session_id IS '会话ID';
COMMENT ON COLUMN chat_memories.memory_id IS '记忆ID';

-- ============================================
-- 4. 创建索引
-- ============================================

-- RBAC 系统索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_roles_role_code ON roles(role_code);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_code ON permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 会话系统索引
CREATE INDEX IF NOT EXISTS idx_session_groups_user_id ON session_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_session_groups_is_pinned ON session_groups(is_pinned);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_pinned ON chat_sessions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_group_id ON chat_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_share_token ON chat_sessions(share_token);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 记忆系统索引
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_is_active ON memories(is_active);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_chat_memories_session_id ON chat_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_memories_memory_id ON chat_memories(memory_id);

-- 向量索引（用于相似度搜索）
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 5. 插入初始数据（可选）
-- ============================================

-- 插入默认管理员角色（如果不存在）
INSERT INTO roles (role_name, role_code, description)
VALUES ('管理员', 'ADMIN', '系统管理员角色')
ON CONFLICT (role_code) DO NOTHING;

-- 插入默认用户角色（如果不存在）
INSERT INTO roles (role_name, role_code, description)
VALUES ('普通用户', 'USER', '普通用户角色')
ON CONFLICT (role_code) DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库表结构初始化完成！';
  RAISE NOTICE '📊 已创建 10 个表：users, roles, permissions, user_roles, role_permissions, session_groups, chat_sessions, chat_messages, memories, chat_memories';
  RAISE NOTICE '📈 已创建所有必要的索引（包括向量索引）';
  RAISE NOTICE '🌱 已插入默认角色数据';
END $$;
