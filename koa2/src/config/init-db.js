// 说明：数据库初始化脚本 - 自动创建所有必需的表（仅在表不存在时创建）

const { pool } = require('../config/db')
const constants = require('./constants')

/**
 * 初始化所有数据库表
 * 使用 IF NOT EXISTS 确保只在表不存在时才创建
 */
async function initDatabase() {
  console.log('🚀 开始初始化数据库...')

  try {
    // ============================================
    // 1. 启用 vector 扩展（用于向量搜索）
    // ============================================
    console.log('📦 检查 vector 扩展...')
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('✅ vector 扩展已就绪')

    // ============================================
    // 2. 创建 memories 表（记忆表）
    // ============================================
    console.log('📊 创建 memories 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(64) NOT NULL,
        session_id VARCHAR(64),
        content TEXT NOT NULL,
        summary VARCHAR(500),
        embedding VECTOR(${constants.DB_CONFIG.VECTOR_DIMENSION}),
        memory_type VARCHAR(32) DEFAULT '${constants.MEMORY_TYPES.FACT}',
        tags TEXT[] DEFAULT '{}',
        importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
        source VARCHAR(64),
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引（使用 IF NOT EXISTS 避免重复创建报错）
      DO $$ BEGIN
        -- 用户ID索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_user_id') THEN
          CREATE INDEX idx_memories_user_id ON memories(user_id);
        END IF;

        -- 记忆类型索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_type') THEN
          CREATE INDEX idx_memories_type ON memories(memory_type);
        END IF;

        -- 激活状态索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_active') THEN
          CREATE INDEX idx_memories_active ON memories(is_active);
        END IF;

        -- 向量索引（用于相似度搜索）
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_embedding') THEN
          CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = ${constants.DB_CONFIG.IVFFLAT_LISTS});
        END IF;

        -- 标签索引
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memories_tags') THEN
          CREATE INDEX idx_memories_tags ON memories USING GIN (tags);
        END IF;
      END $$;
    `)
    console.log('✅ memories 表创建成功')

    // ============================================
    // 3. 创建 chat_sessions 表（会话表）
    // ============================================
    console.log('📊 创建 chat_sessions 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(200),
        message_count INTEGER DEFAULT 0,
        memory_ids UUID[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_user_id') THEN
          CREATE INDEX idx_sessions_user_id ON chat_sessions(user_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_created') THEN
          CREATE INDEX idx_sessions_created ON chat_sessions(created_at DESC);
        END IF;
      END $$;
    `)
    console.log('✅ chat_sessions 表创建成功')

    // ============================================
    // 4. 创建 chat_memories 表（对话记忆关联表）
    // ============================================
    console.log('📊 创建 chat_memories 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_memories (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL,
        memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(session_id, memory_id)
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_memories_session_id') THEN
          CREATE INDEX idx_chat_memories_session_id ON chat_memories(session_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_memories_memory_id') THEN
          CREATE INDEX idx_chat_memories_memory_id ON chat_memories(memory_id);
        END IF;
      END $$;
    `)
    console.log('✅ chat_memories 表创建成功')

    // ============================================
    // 5. 创建 chat_messages 表（消息表）
    // ============================================
    console.log('📊 创建 chat_messages 表...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id UUID NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_session
          FOREIGN KEY (session_id)
          REFERENCES chat_sessions(id)
          ON DELETE CASCADE
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_session_id') THEN
          CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_created_at') THEN
          CREATE INDEX idx_messages_created_at ON chat_messages(created_at);
        END IF;
      END $$;
    `)
    console.log('✅ chat_messages 表创建成功')

    // ============================================
    // 6. 检查并添加 chat_sessions.message_count 字段（如果不存在）
    // ============================================
    console.log('🔍 检查 chat_sessions.message_count 字段...')
    const checkColumn = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_sessions' AND column_name = 'message_count'
    `
    const result = await pool.query(checkColumn)
    if (result.rows.length === 0) {
      await pool.query('ALTER TABLE chat_sessions ADD COLUMN message_count INTEGER DEFAULT 0')
      console.log('✅ 已添加 message_count 字段')
    } else {
      console.log('ℹ️  message_count 字段已存在')
    }

    // ============================================
    // 7. 检查并添加 chat_sessions.memory_ids 字段（如果不存在）
    // ============================================
    console.log('🔍 检查 chat_sessions.memory_ids 字段...')
    const checkMemoryIdsColumn = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_sessions' AND column_name = 'memory_ids'
    `
    const memoryIdsResult = await pool.query(checkMemoryIdsColumn)
    if (memoryIdsResult.rows.length === 0) {
      await pool.query("ALTER TABLE chat_sessions ADD COLUMN memory_ids UUID[] DEFAULT '{}'")
      console.log('✅ 已添加 memory_ids 字段')
    } else {
      console.log('ℹ️  memory_ids 字段已存在')
    }

    // ============================================
    // 8. RBAC 权限系统 - 创建 users 表
    // ============================================
    console.log('📊 创建 users 表（RBAC 系统）...')
    await pool.query(`
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

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_username') THEN
          CREATE INDEX idx_users_username ON users(username);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
          CREATE INDEX idx_users_email ON users(email);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_status') THEN
          CREATE INDEX idx_users_status ON users(status);
        END IF;
      END $$;
    `)
    console.log('✅ users 表创建成功')

    // ============================================
    // 9. RBAC 权限系统 - 创建 roles 表
    // ============================================
    console.log('📊 创建 roles 表（RBAC 系统）...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(64) NOT NULL UNIQUE,
        display_name VARCHAR(128) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_roles_name') THEN
          CREATE INDEX idx_roles_name ON roles(name);
        END IF;
      END $$;
    `)
    console.log('✅ roles 表创建成功')

    // ============================================
    // 10. RBAC 权限系统 - 创建 permissions 表
    // ============================================
    console.log('📊 创建 permissions 表（RBAC 系统）...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(128) NOT NULL UNIQUE,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        module VARCHAR(64) NOT NULL,
        action VARCHAR(32) NOT NULL,
        resource VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_code') THEN
          CREATE INDEX idx_permissions_code ON permissions(code);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_module') THEN
          CREATE INDEX idx_permissions_module ON permissions(module);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_action') THEN
          CREATE INDEX idx_permissions_action ON permissions(action);
        END IF;
      END $$;
    `)
    console.log('✅ permissions 表创建成功')

    // ============================================
    // 11. RBAC 权限系统 - 创建 user_roles 关联表
    // ============================================
    console.log('📊 创建 user_roles 表（RBAC 系统）...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, role_id)
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_user_id') THEN
          CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_role_id') THEN
          CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
        END IF;
      END $$;
    `)
    console.log('✅ user_roles 表创建成功')

    // ============================================
    // 12. RBAC 权限系统 - 创建 role_permissions 关联表
    // ============================================
    console.log('📊 创建 role_permissions 表（RBAC 系统）...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (role_id, permission_id)
      );

      -- 创建索引
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_role_id') THEN
          CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_permission_id') THEN
          CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
        END IF;
      END $$;
    `)
    console.log('✅ role_permissions 表创建成功')

    // ============================================
    // 13. 插入 RBAC 初始数据（仅当表为空时）
    // ============================================
    console.log('🔍 检查 RBAC 初始数据...')
    
    // 检查 roles 表是否为空
    const rolesCount = await pool.query('SELECT COUNT(*) FROM roles')
    if (parseInt(rolesCount.rows[0].count) === 0) {
      console.log('📝 插入初始角色数据...')
      await pool.query(`
        INSERT INTO roles (id, name, display_name, description, is_system) VALUES
        ('a0000000-0000-0000-0000-000000000001', 'admin', '管理员', '系统管理员，拥有所有权限', true),
        ('a0000000-0000-0000-0000-000000000002', 'user', '普通用户', '基本使用权限', true)
        ON CONFLICT (name) DO NOTHING;
      `)
      console.log('✅ 初始角色数据插入成功')
    } else {
      console.log('ℹ️  角色数据已存在')
    }

    // 检查 permissions 表是否为空
    const permissionsCount = await pool.query('SELECT COUNT(*) FROM permissions')
    if (parseInt(permissionsCount.rows[0].count) === 0) {
      console.log('📝 插入初始权限数据...')
      await pool.query(`
        INSERT INTO permissions (id, code, name, description, module, action, resource) VALUES
        -- 用户管理权限
        ('b0000000-0000-0000-0000-000000000001', 'user:read', '查看用户', '查看用户列表和详情', 'user', 'read', 'user'),
        ('b0000000-0000-0000-0000-000000000002', 'user:create', '创建用户', '创建新用户', 'user', 'create', 'user'),
        ('b0000000-0000-0000-0000-000000000003', 'user:update', '更新用户', '更新用户信息', 'user', 'update', 'user'),
        ('b0000000-0000-0000-0000-000000000004', 'user:delete', '删除用户', '删除用户', 'user', 'delete', 'user'),
        
        -- 角色管理权限
        ('b0000000-0000-0000-0000-000000000005', 'role:read', '查看角色', '查看角色列表和详情', 'role', 'read', 'role'),
        ('b0000000-0000-0000-0000-000000000006', 'role:create', '创建角色', '创建新角色', 'role', 'create', 'role'),
        ('b0000000-0000-0000-0000-000000000007', 'role:update', '更新角色', '更新角色信息', 'role', 'update', 'role'),
        ('b0000000-0000-0000-0000-000000000008', 'role:delete', '删除角色', '删除角色', 'role', 'delete', 'role'),
        
        -- 权限管理权限
        ('b0000000-0000-0000-0000-000000000009', 'permission:read', '查看权限', '查看权限列表和详情', 'permission', 'read', 'permission'),
        ('b0000000-0000-0000-0000-00000000000a', 'permission:create', '创建权限', '创建新权限', 'permission', 'create', 'permission'),
        ('b0000000-0000-0000-0000-00000000000b', 'permission:update', '更新权限', '更新权限信息', 'permission', 'update', 'permission'),
        ('b0000000-0000-0000-0000-00000000000c', 'permission:delete', '删除权限', '删除权限', 'permission', 'delete', 'permission'),
        
        -- 聊天管理权限
        ('b0000000-0000-0000-0000-00000000000d', 'chat:read', '查看聊天', '查看聊天记录', 'chat', 'read', 'chat'),
        ('b0000000-0000-0000-0000-00000000000e', 'chat:create', '创建聊天', '创建新对话', 'chat', 'create', 'chat'),
        ('b0000000-0000-0000-0000-00000000000f', 'chat:update', '更新聊天', '更新对话信息', 'chat', 'update', 'chat'),
        ('b0000000-0000-0000-0000-000000000010', 'chat:delete', '删除聊天', '删除对话', 'chat', 'delete', 'chat'),
        
        -- 记忆管理权限
        ('b0000000-0000-0000-0000-000000000011', 'memory:read', '查看记忆', '查看记忆数据', 'memory', 'read', 'memory'),
        ('b0000000-0000-0000-0000-000000000012', 'memory:create', '创建记忆', '创建新记忆', 'memory', 'create', 'memory'),
        ('b0000000-0000-0000-0000-000000000013', 'memory:update', '更新记忆', '更新记忆信息', 'memory', 'update', 'memory'),
        ('b0000000-0000-0000-0000-000000000014', 'memory:delete', '删除记忆', '删除记忆', 'memory', 'delete', 'memory')
        ON CONFLICT (code) DO NOTHING;
      `)
      console.log('✅ 初始权限数据插入成功')
    } else {
      console.log('ℹ️  权限数据已存在')
    }

    // 为 admin 角色分配所有权限
    const adminRolePermissions = await pool.query(
      'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
      ['a0000000-0000-0000-0000-000000000001']
    )
    if (parseInt(adminRolePermissions.rows[0].count) === 0) {
      console.log('📝 为 admin 角色分配所有权限...')
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 'a0000000-0000-0000-0000-000000000001', id FROM permissions
        ON CONFLICT DO NOTHING;
      `)
      console.log('✅ admin 角色权限分配成功')
    } else {
      console.log('ℹ️  admin 角色权限已存在')
    }

    // 为 user 角色分配基础权限
    const userRolePermissions = await pool.query(
      'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
      ['a0000000-0000-0000-0000-000000000002']
    )
    if (parseInt(userRolePermissions.rows[0].count) === 0) {
      console.log('📝 为 user 角色分配基础权限...')
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 'a0000000-0000-0000-0000-000000000002', id 
        FROM permissions 
        WHERE code IN ('chat:read', 'chat:create', 'memory:read', 'memory:create')
        ON CONFLICT DO NOTHING;
      `)
      console.log('✅ user 角色权限分配成功')
    } else {
      console.log('ℹ️  user 角色权限已存在')
    }

    console.log('🎉 数据库初始化完成！所有表和初始数据已就绪')
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message)
    console.error('详细错误:', error)
    throw error
  }
}

module.exports = { initDatabase }
