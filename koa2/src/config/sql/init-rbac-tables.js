// 说明：初始化 RBAC 权限系统表

const { pool } = require('../db')

async function initRbacTables() {
  // ============================================
  // 1. 创建 users 表
  // ============================================
  console.log('📊 创建 users 表（RBAC 系统）...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(128),
      avatar_url VARCHAR(255),
      nickname VARCHAR(64),
      phone VARCHAR(20),
      bio TEXT,
      status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
      last_login_at TIMESTAMPTZ,
      last_login_ip VARCHAR(45),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
  `)
  console.log('✅ users 表创建成功')

  // 检查并添加缺失字段
  await ensureUserFields()

  // ============================================
  // 2. 创建 roles 表
  // ============================================
  console.log('📊 创建 roles 表（RBAC 系统）...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(64) NOT NULL UNIQUE,
      display_name VARCHAR(128) NOT NULL,
      description TEXT,
      is_system BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
  `)
  console.log('✅ roles 表创建成功')

  await ensureRoleFields()

  // 创建索引
  await createRoleIndexes()

  // ============================================
  // 3. 创建 permissions 表
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
      type VARCHAR(32) DEFAULT 'button' CHECK (type IN ('menu', 'button', 'api')),
      parent_id UUID REFERENCES permissions(id) ON DELETE SET NULL,
      path VARCHAR(255),
      icon VARCHAR(128),
      component VARCHAR(255),
      sort_order INTEGER DEFAULT 0,
      hidden BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );
  `)
  console.log('✅ permissions 表创建成功')

  await ensurePermissionFields()
  await createPermissionIndexes()

  // ============================================
  // 4. 创建 user_roles 关联表
  // ============================================
  console.log('📊 创建 user_roles 表（RBAC 系统）...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      created_by UUID REFERENCES users(id),
      PRIMARY KEY (user_id, role_id)
    );
  `)
  console.log('✅ user_roles 表创建成功')

  await ensureUserRoleFields()
  await createUserRoleIndexes()

  // ============================================
  // 5. 创建 role_permissions 关联表
  // ============================================
  console.log('📊 创建 role_permissions 表（RBAC 系统）...')
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      created_by UUID REFERENCES users(id),
      PRIMARY KEY (role_id, permission_id)
    );
  `)
  console.log('✅ role_permissions 表创建成功')

  await ensureRolePermissionFields()
  await createRolePermissionIndexes()

  // ============================================
  // 6. 修复 RBAC 表结构（添加缺失的 updated_at 字段）
  // ============================================
  console.log('🔧 检查并修复 RBAC 表结构...')
  await ensureRBACFields()

  // ============================================
  // 7. 修复路径字段（移除前导斜杠）
  // ============================================
  console.log('🔍 检查并修复权限路径字段...')
  await fixPermissionPaths()
}

// ============================================
// 辅助函数：确保字段存在
// ============================================

async function ensureUserFields() {
  const fields = [
    { name: 'deleted_at', type: 'TIMESTAMPTZ' },
    { name: 'nickname', type: 'VARCHAR(100)' },
    { name: 'phone', type: 'VARCHAR(20)' },
    { name: 'bio', type: 'TEXT' },
  ]

  for (const field of fields) {
    const exists = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = '${field.name}'
    `)
    if (exists.rows.length === 0) {
      console.log(`⚠️  users 表缺少 ${field.name} 字段，正在添加...`)
      await pool.query(`ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`)
      console.log(`✅ 已添加 users.${field.name} 字段`)
    }
  }
}

async function ensureRoleFields() {
  const fields = [
    { name: 'deleted_at', type: 'TIMESTAMPTZ' },
    { name: 'sort_order', type: 'INTEGER DEFAULT 0' },
  ]

  for (const field of fields) {
    const exists = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'roles' AND column_name = '${field.name}'
    `)
    if (exists.rows.length === 0) {
      console.log(`⚠️  roles 表缺少 ${field.name} 字段，正在添加...`)
      await pool.query(`ALTER TABLE roles ADD COLUMN ${field.name} ${field.type}`)
      console.log(`✅ 已添加 roles.${field.name} 字段`)
    }
  }
}

async function ensurePermissionFields() {
  const fields = [
    { name: 'deleted_at', type: 'TIMESTAMPTZ' },
    { name: 'sort_order', type: 'INTEGER DEFAULT 0' },
    { name: 'parent_id', type: 'UUID REFERENCES permissions(id) ON DELETE SET NULL' },
    { name: 'path', type: 'VARCHAR(255)' },
    { name: 'icon', type: 'VARCHAR(128)' },
  ]

  for (const field of fields) {
    const exists = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'permissions' AND column_name = '${field.name}'
    `)
    if (exists.rows.length === 0) {
      console.log(`⚠️  permissions 表缺少 ${field.name} 字段，正在添加...`)
      await pool.query(`ALTER TABLE permissions ADD COLUMN ${field.name} ${field.type}`)
      console.log(`✅ 已添加 permissions.${field.name} 字段`)
    }
  }
}

async function ensureUserRoleFields() {
  const fields = [
    { name: 'deleted_at', type: 'TIMESTAMPTZ' },
    { name: 'created_by', type: 'UUID REFERENCES users(id)' },
  ]

  for (const field of fields) {
    const exists = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_roles' AND column_name = '${field.name}'
    `)
    if (exists.rows.length === 0) {
      console.log(`⚠️  user_roles 表缺少 ${field.name} 字段，正在添加...`)
      await pool.query(`ALTER TABLE user_roles ADD COLUMN ${field.name} ${field.type}`)
      console.log(`✅ 已添加 user_roles.${field.name} 字段`)
    }
  }
}

async function ensureRolePermissionFields() {
  const fields = [
    { name: 'deleted_at', type: 'TIMESTAMPTZ' },
    { name: 'created_by', type: 'UUID REFERENCES users(id)' },
  ]

  for (const field of fields) {
    const exists = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'role_permissions' AND column_name = '${field.name}'
    `)
    if (exists.rows.length === 0) {
      console.log(`⚠️  role_permissions 表缺少 ${field.name} 字段，正在添加...`)
      await pool.query(`ALTER TABLE role_permissions ADD COLUMN ${field.name} ${field.type}`)
      console.log(`✅ 已添加 role_permissions.${field.name} 字段`)
    }
  }
}

// ============================================
// 辅助函数：创建索引
// ============================================

async function createRoleIndexes() {
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_roles_name') THEN
        CREATE INDEX idx_roles_name ON roles(name);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_roles_deleted_at') THEN
        CREATE INDEX idx_roles_deleted_at ON roles(deleted_at);
      END IF;
    END $$;
  `)
}

async function createPermissionIndexes() {
  await pool.query(`
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
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_parent_id') THEN
        CREATE INDEX idx_permissions_parent_id ON permissions(parent_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_type') THEN
        CREATE INDEX idx_permissions_type ON permissions(type);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_sort_order') THEN
        CREATE INDEX idx_permissions_sort_order ON permissions(sort_order);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_permissions_deleted_at') THEN
        CREATE INDEX idx_permissions_deleted_at ON permissions(deleted_at);
      END IF;
    END $$;
  `)
}

async function createUserRoleIndexes() {
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_user_id') THEN
        CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_role_id') THEN
        CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_deleted_at') THEN
        CREATE INDEX idx_user_roles_deleted_at ON user_roles(deleted_at);
      END IF;
    END $$;
  `)
}

async function createRolePermissionIndexes() {
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_role_id') THEN
        CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_permission_id') THEN
        CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_role_permissions_deleted_at') THEN
        CREATE INDEX idx_role_permissions_deleted_at ON role_permissions(deleted_at);
      END IF;
    END $$;
  `)
}

// ============================================
// 辅助函数：修复 RBAC 表结构
// ============================================

async function ensureRBACFields() {
  const rbacTables = ['users', 'roles', 'permissions']
  for (const table of rbacTables) {
    const hasUpdatedAt = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = '${table}' AND column_name = 'updated_at'
    `)
    if (hasUpdatedAt.rows.length === 0) {
      console.log(`⚠️  ${table} 表缺少 updated_at 字段，正在添加...`)
      await pool.query(`ALTER TABLE ${table} ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()`)
      console.log(`✅ 已添加 ${table}.updated_at 字段`)
    } else {
      console.log(`ℹ️  ${table}.updated_at 字段已存在`)
    }
  }
}

// ============================================
// 辅助函数：修复路径字段
// ============================================

async function fixPermissionPaths() {
  // ✅ 1. 去掉路径开头的 /
  await pool.query(`
    UPDATE permissions 
    SET path = SUBSTRING(path FROM 2) 
    WHERE path LIKE '/%' AND path IS NOT NULL;
  `)

  // ✅ 2. 修复旧的不规范路径
  await pool.query(`
    UPDATE permissions SET path = 'api-docs' WHERE code = 'docs:view' AND path != 'api-docs';
    UPDATE permissions SET path = 'chat-logs' WHERE code = 'logs:view' AND path != 'chat-logs';
  `)

  // ✅ 3. 补充缺失的菜单和重组 RBAC 结构
  console.log(' 开始重组 RBAC 菜单结构...')
  
  // 创建父菜单：系统管理（父菜单不需要 path，仅作为容器）
  const parentResult = await pool.query(`
    INSERT INTO permissions (id, code, name, description, module, action, resource, type, parent_id, path, icon, sort_order)
    VALUES ('c0000000-0000-0000-0000-000000000015', 'system-access:view', '系统管理', '系统访问控制和安全管理', 'system-access', 'view', 'system-access', 'menu', NULL, NULL, 'shield-checkmark', 10)
    ON CONFLICT (code) DO NOTHING
    RETURNING id
  `)
  
  if (parentResult.rows.length > 0) {
    console.log('✅ 创建父菜单: system-access:view')
  } else {
    console.log('ℹ️  父菜单已存在')
  }
  
  // 如果已存在但 path 不为 NULL，修正为 NULL
  await pool.query(`
    UPDATE permissions SET path = NULL WHERE code = 'system-access:view' AND path IS NOT NULL
  `)
  
  // 补充缺失的菜单（如果不存在则插入）
  const missingMenusResult = await pool.query(`
    INSERT INTO permissions (id, code, name, description, module, action, resource, type, parent_id, path, icon, sort_order)
    VALUES 
      ('c0000000-0000-0000-0000-000000000013', 'operation-log:view', '操作日志', '系统操作日志查看', 'operation-log', 'view', 'operation-log', 'menu', 'c0000000-0000-0000-0000-000000000015', 'operation-log', 'document-text', 4),
      ('c0000000-0000-0000-0000-000000000014', 'pm2-logs:view', 'PM2日志管理', 'PM2进程日志查看', 'pm2-logs', 'view', 'pm2-logs', 'menu', NULL, 'pm2-logs', 'server', 11)
    ON CONFLICT (code) DO NOTHING
    RETURNING code
  `)
  
  if (missingMenusResult.rows.length > 0) {
    console.log(`✅ 补充缺失菜单: ${missingMenusResult.rows.map(r => r.code).join(', ')}`)
  }
  
  // 修正 PM2 菜单的 path（去掉开头的 /）
  const pm2PathResult = await pool.query(`
    UPDATE permissions SET path = 'pm2-logs' WHERE code = 'pm2-logs:view' AND path = '/pm2-logs'
  `)
  if (pm2PathResult.rowCount > 0) {
    console.log('✅ 修正 PM2 菜单 path: /pm2-logs -> pm2-logs')
  }
  
  // 将 RBAC 相关菜单改为子菜单
  console.log('🔄 将 RBAC 菜单重组为子菜单...')
  
  const rbacMenus = [
    { code: 'user-management:view', path: 'user-management', order: 1 },
    { code: 'role-management:view', path: 'role-management', order: 2 },
    { code: 'permission-management:view', path: 'permission-management', order: 3 },
    { code: 'operation-log:view', path: 'operation-log', order: 4 }
  ]
  
  for (const menu of rbacMenus) {
    const result = await pool.query(`
      UPDATE permissions SET 
        parent_id = 'c0000000-0000-0000-0000-000000000015',
        path = $1,
        sort_order = $2
      WHERE code = $3
    `, [menu.path, menu.order, menu.code])
    
    if (result.rowCount > 0) {
      console.log(`  ✅ ${menu.code} -> parent_id: c000...0015, path: ${menu.path}, order: ${menu.order}`)
    }
  }
  
  // 更新 PM2 按钮权限的父级
  const pm2BtnResult = await pool.query(`
    UPDATE permissions SET parent_id = 'c0000000-0000-0000-0000-000000000014' 
    WHERE code IN ('pm2-logs:read', 'pm2-logs:clear')
  `)
  if (pm2BtnResult.rowCount > 0) {
    console.log('✅ 更新 PM2 按钮权限父级')
  }
  
  console.log('✅ RBAC 菜单重组完成')

  const fixedPaths = await pool.query(`
    SELECT code, path 
    FROM permissions 
    WHERE path IS NOT NULL AND path != ''
    ORDER BY sort_order
    LIMIT 5
  `)

  if (fixedPaths.rows.length > 0) {
    console.log('✅ 路径字段修复完成，示例：')
    fixedPaths.rows.forEach(row => {
      console.log(`   ${row.code} -> path: "${row.path}"`)
    })
  }
}

module.exports = initRbacTables
