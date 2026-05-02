// 说明：初始化默认数据（角色、权限、管理员用户等）

const { pool } = require('../db')

async function initDefaultData() {
  // ============================================
  // 1. 插入 RBAC 初始数据（仅当表为空时）
  // ============================================
  console.log('🔍 检查 RBAC 初始数据...')
  
  // 检查 roles 表是否为空
  const rolesCount = await pool.query('SELECT COUNT(*) FROM roles')
  if (parseInt(rolesCount.rows[0].count) === 0) {
    console.log('📝 插入初始角色数据...')
    await pool.query(`
      INSERT INTO roles (id, name, display_name, description, is_system) VALUES
      ('a0000000-0000-0000-0000-000000000001', 'admin', '超级管理员', '系统最高权限管理员，拥有所有权限', true),
      ('a0000000-0000-0000-0000-000000000002', 'user', '普通用户', '基本使用权限', true),
      ('a0000000-0000-0000-0000-000000000003', 'moderator', '版主', '内容管理权限', true)
      ON CONFLICT (name) DO NOTHING;
    `)
    console.log('✅ 初始角色数据插入成功（3个角色）')
  } else {
    console.log('ℹ️  角色数据已存在')
  }

  // 检查 permissions 表是否为空
  const permissionsCount = await pool.query('SELECT COUNT(*) FROM permissions')
  if (parseInt(permissionsCount.rows[0].count) === 0) {
    console.log('📝 插入初始权限数据...')
    await insertInitialPermissions()
    console.log('✅ 初始权限数据插入成功（13个菜单 + 24个按钮权限 = 37个权限）')
  } else {
    console.log('ℹ️  权限数据已存在')
  }

  // 为 admin 角色分配所有权限
  await assignAdminPermissions()

  // 更新旧格式权限代码
  await updatePermissionCodes()

  // 补充菜单数据
  await supplementMenuData()

  // 为 user 和 moderator 角色分配权限
  await assignUserRolePermissions()
  await assignModeratorPermissions()

  // 创建默认管理员用户
  await createDefaultAdminUser()

  // ✅ 初始化数据库管理模块权限
  const initDatabaseManagement = require('./init-database-management')
  await initDatabaseManagement()

  // ============================================
  // 2. 创建 updated_at 自动更新触发器
  // ============================================
  console.log('⚙️  创建 updated_at 自动更新触发器...')
  await createUpdatedAtTriggers()

  // ============================================
  // 3. 创建常用视图
  // ============================================
  console.log('👁️  创建常用视图...')
  await createRBACViews()
}

async function insertInitialPermissions() {
  await pool.query(`
    INSERT INTO permissions (id, code, name, description, module, action, resource, type, parent_id, path, icon, sort_order) VALUES
    -- 一级菜单
    ('c0000000-0000-0000-0000-000000000001', 'dashboard:view', '工作台', '系统工作台首页', 'dashboard', 'view', 'dashboard', 'menu', NULL, '/dashboard', 'dashboard', 1),
    ('c0000000-0000-0000-0000-000000000002', 'chat:view', 'AI对话', 'AI智能对话功能', 'chat', 'view', 'chat', 'menu', NULL, '/chat', 'chat', 2),
    ('c0000000-0000-0000-0000-000000000003', 'agent:view', '智能体', '智能体管理', 'agent', 'view', 'agent', 'menu', NULL, '/agent', 'agent', 3),
    ('c0000000-0000-0000-0000-000000000004', 'knowledge:view', '知识库', '知识库管理', 'knowledge', 'view', 'knowledge', 'menu', NULL, '/knowledge', 'knowledge', 4),
    ('c0000000-0000-0000-0000-000000000005', 'memory:view', '记忆管理', '记忆数据管理', 'memory', 'view', 'memory', 'menu', NULL, '/memory', 'memory', 5),
    ('c0000000-0000-0000-0000-000000000006', 'tools:view', '工具', '工具箱', 'tools', 'view', 'tools', 'menu', NULL, '/tools', 'tools', 6),
    ('c0000000-0000-0000-0000-000000000007', 'settings:view', '系统设置', '系统配置管理', 'settings', 'view', 'settings', 'menu', NULL, '/settings', 'settings', 7),
    ('c0000000-0000-0000-0000-000000000008', 'docs:view', 'API文档', 'API接口文档', 'docs', 'view', 'api-docs', 'menu', NULL, 'api-docs', 'docs', 8),
    ('c0000000-0000-0000-0000-000000000009', 'logs:view', '对话日志', '聊天记录查看', 'chatlogs', 'view', 'chat-logs', 'menu', NULL, 'chat-logs', 'logs', 9),
    
    -- ✅ 新增：系统访问控制父菜单（父菜单不需要 path，仅作为容器）
    ('c0000000-0000-0000-0000-000000000015', 'system-access:view', '系统管理', '系统访问控制和安全管理', 'system-access', 'view', 'system-access', 'menu', NULL, NULL, 'shield-checkmark', 10),
    
    -- 二级菜单（系统管理子菜单）
    ('c0000000-0000-0000-0000-000000000010', 'user-management:view', '用户管理', '用户列表和管理', 'user-management', 'view', 'user-management', 'menu', 'c0000000-0000-0000-0000-000000000015', 'user-management', 'people', 1),
    ('c0000000-0000-0000-0000-000000000011', 'role-management:view', '角色管理', '角色和权限管理', 'role-management', 'view', 'role-management', 'menu', 'c0000000-0000-0000-0000-000000000015', 'role-management', 'shield', 2),
    ('c0000000-0000-0000-0000-000000000012', 'permission-management:view', '权限管理', '权限配置和管理', 'permission-management', 'view', 'permission-management', 'menu', 'c0000000-0000-0000-0000-000000000015', 'permission-management', 'key', 3),
    ('c0000000-0000-0000-0000-000000000013', 'operation-log:view', '操作日志', '系统操作日志查看', 'operation-log', 'view', 'operation-log', 'menu', 'c0000000-0000-0000-0000-000000000015', 'operation-log', 'document-text', 4),
    
    -- 其他一级菜单
    ('c0000000-0000-0000-0000-000000000014', 'pm2-logs:view', 'PM2日志管理', 'PM2进程日志查看', 'pm2-logs', 'view', 'pm2-logs', 'menu', NULL, '/pm2-logs', 'server', 11),
    
    -- 按钮权限
    ('b0000000-0000-0000-0000-000000000001', 'user:read', '查看用户', '查看用户列表和详情', 'user', 'read', 'user', 'button', NULL, NULL, NULL, 10),
    ('b0000000-0000-0000-0000-000000000002', 'user:create', '创建用户', '创建新用户', 'user', 'create', 'user', 'button', NULL, NULL, NULL, 11),
    ('b0000000-0000-0000-0000-000000000003', 'user:update', '更新用户', '更新用户信息', 'user', 'update', 'user', 'button', NULL, NULL, NULL, 12),
    ('b0000000-0000-0000-0000-000000000004', 'user:delete', '删除用户', '删除用户', 'user', 'delete', 'user', 'button', NULL, NULL, NULL, 13),
    ('b0000000-0000-0000-0000-000000000005', 'role:read', '查看角色', '查看角色列表和详情', 'role', 'read', 'role', 'button', NULL, NULL, NULL, 20),
    ('b0000000-0000-0000-0000-000000000006', 'role:create', '创建角色', '创建新角色', 'role', 'create', 'role', 'button', NULL, NULL, NULL, 21),
    ('b0000000-0000-0000-0000-000000000007', 'role:update', '更新角色', '更新角色信息', 'role', 'update', 'role', 'button', NULL, NULL, NULL, 22),
    ('b0000000-0000-0000-0000-000000000008', 'role:delete', '删除角色', '删除角色', 'role', 'delete', 'role', 'button', NULL, NULL, NULL, 23),
    ('b0000000-0000-0000-0000-000000000009', 'permission:read', '查看权限', '查看权限列表和详情', 'permission', 'read', 'permission', 'button', NULL, NULL, NULL, 30),
    ('b0000000-0000-0000-0000-00000000000a', 'permission:create', '创建权限', '创建新权限', 'permission', 'create', 'permission', 'button', NULL, NULL, NULL, 31),
    ('b0000000-0000-0000-0000-00000000000b', 'permission:update', '更新权限', '更新权限信息', 'permission', 'update', 'permission', 'button', NULL, NULL, NULL, 32),
    ('b0000000-0000-0000-0000-00000000000c', 'permission:delete', '删除权限', '删除权限', 'permission', 'delete', 'permission', 'button', NULL, NULL, NULL, 33),
    ('b0000000-0000-0000-0000-00000000000d', 'chat:read', '查看聊天', '查看聊天记录', 'chat', 'read', 'chat', 'button', NULL, NULL, NULL, 40),
    ('b0000000-0000-0000-0000-00000000000e', 'chat:create', '创建聊天', '创建新对话', 'chat', 'create', 'chat', 'button', NULL, NULL, NULL, 41),
    ('b0000000-0000-0000-0000-00000000000f', 'chat:update', '更新聊天', '更新对话信息', 'chat', 'update', 'chat', 'button', NULL, NULL, NULL, 42),
    ('b0000000-0000-0000-0000-000000000010', 'chat:delete', '删除聊天', '删除对话', 'chat', 'delete', 'chat', 'button', NULL, NULL, NULL, 43),
    ('b0000000-0000-0000-0000-000000000011', 'memory:read', '查看记忆', '查看记忆数据', 'memory', 'read', 'memory', 'button', NULL, NULL, NULL, 50),
    ('b0000000-0000-0000-0000-000000000012', 'memory:create', '创建记忆', '创建新记忆', 'memory', 'create', 'memory', 'button', NULL, NULL, NULL, 51),
    ('b0000000-0000-0000-0000-000000000013', 'memory:update', '更新记忆', '更新记忆信息', 'memory', 'update', 'memory', 'button', NULL, NULL, NULL, 52),
    ('b0000000-0000-0000-0000-000000000014', 'memory:delete', '删除记忆', '删除记忆', 'memory', 'delete', 'memory', 'button', NULL, NULL, NULL, 53),
    ('b0000000-0000-0000-0000-000000000015', 'session-group:read', '查看会话组', '查看会话组列表和详情', 'session-group', 'read', 'session-group', 'button', NULL, NULL, NULL, 60),
    ('b0000000-0000-0000-0000-000000000016', 'session-group:create', '创建会话组', '创建新会话组', 'session-group', 'create', 'session-group', 'button', NULL, NULL, NULL, 61),
    ('b0000000-0000-0000-0000-000000000017', 'session-group:update', '更新会话组', '更新会话组信息', 'session-group', 'update', 'session-group', 'button', NULL, NULL, NULL, 62),
    ('b0000000-0000-0000-0000-000000000018', 'session-group:delete', '删除会话组', '删除会话组', 'session-group', 'delete', 'session-group', 'button', NULL, NULL, NULL, 63),
    ('b0000000-0000-0000-0000-000000000019', 'log:read', '查看日志', '查看系统日志', 'log', 'read', 'log', 'button', NULL, NULL, NULL, 70),
    ('b0000000-0000-0000-0000-00000000001a', 'log:export', '导出日志', '导出系统日志', 'log', 'export', 'log', 'button', NULL, NULL, NULL, 71),
    ('b0000000-0000-0000-0000-00000000001b', 'log:delete', '删除日志', '删除操作日志', 'log', 'delete', 'operation-log', 'button', NULL, NULL, NULL, 72),
    ('b0000000-0000-0000-0000-00000000001c', 'pm2-logs:read', '查看PM2日志', '查看PM2进程日志', 'pm2-logs', 'read', 'pm2-logs', 'button', 'c0000000-0000-0000-0000-000000000014', NULL, NULL, 140),
    ('b0000000-0000-0000-0000-00000000001d', 'pm2-logs:clear', '清空PM2日志', '清空PM2进程日志', 'pm2-logs', 'clear', 'pm2-logs', 'button', 'c0000000-0000-0000-0000-000000000014', NULL, NULL, 141)
    ON CONFLICT (code) DO NOTHING;
  `)
}

async function assignAdminPermissions() {
  const adminRole = await pool.query('SELECT id FROM roles WHERE id = $1', ['a0000000-0000-0000-0000-000000000001'])
  if (adminRole.rows.length > 0) {
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
  } else {
    console.log('⚠️  admin 角色不存在，跳过权限分配')
  }
}

async function updatePermissionCodes() {
  const oldMenuCodeCheck = await pool.query(
    "SELECT COUNT(*) FROM permissions WHERE code LIKE 'menu:%' AND type = 'menu'"
  )
  if (parseInt(oldMenuCodeCheck.rows[0].count) > 0) {
    console.log('📝 更新旧格式权限代码 (menu:xxx -> xxx:view)...')
    await pool.query(`
      UPDATE permissions SET code = 'dashboard:view' WHERE code = 'menu:dashboard';
      UPDATE permissions SET code = 'chat:view' WHERE code = 'menu:chat';
      UPDATE permissions SET code = 'agent:view' WHERE code = 'menu:agent';
      UPDATE permissions SET code = 'knowledge:view' WHERE code = 'menu:knowledge';
      UPDATE permissions SET code = 'memory:view' WHERE code = 'menu:memory';
      UPDATE permissions SET code = 'tools:view' WHERE code = 'menu:tools';
      UPDATE permissions SET code = 'settings:view' WHERE code = 'menu:settings';
      UPDATE permissions SET code = 'docs:view' WHERE code = 'menu:docs';
      UPDATE permissions SET code = 'logs:view' WHERE code = 'menu:chatlogs';
      UPDATE permissions SET code = 'user-management:view' WHERE code = 'menu:user-management';
      UPDATE permissions SET code = 'role-management:view' WHERE code = 'menu:role-management';
      UPDATE permissions SET code = 'permission-management:view' WHERE code = 'menu:permission-management';
    `)
    console.log('✅ 权限代码格式更新成功')
  }
}

async function supplementMenuData() {
  const menuCount = await pool.query("SELECT COUNT(*) FROM permissions WHERE type = 'menu'")
  const currentMenuCount = parseInt(menuCount.rows[0].count)
  
  // 如果菜单数量少于 14 个（应该有 14 个菜单），说明缺少新菜单
  if (currentMenuCount < 14) {
    console.log(` 检测到菜单数据不完整（当前 ${currentMenuCount} 个，应有 14 个），开始补充...`)
    
    // 补充缺失的菜单
    const missingMenus = await pool.query(`
      INSERT INTO permissions (id, code, name, description, module, action, resource, type, parent_id, path, icon, sort_order)
      VALUES 
        -- 系统管理父菜单
        ('c0000000-0000-0000-0000-000000000015', 'system-access:view', '系统管理', '系统访问控制和安全管理', 'system-access', 'view', 'system-access', 'menu', NULL, NULL, 'shield-checkmark', 10),
        -- RBAC 子菜单
        ('c0000000-0000-0000-0000-000000000010', 'user-management:view', '用户管理', '用户列表和管理', 'user-management', 'view', 'user-management', 'menu', 'c0000000-0000-0000-0000-000000000015', 'user-management', 'people', 1),
        ('c0000000-0000-0000-0000-000000000011', 'role-management:view', '角色管理', '角色和权限管理', 'role-management', 'view', 'role-management', 'menu', 'c0000000-0000-0000-0000-000000000015', 'role-management', 'shield', 2),
        ('c0000000-0000-0000-0000-000000000012', 'permission-management:view', '权限管理', '权限配置和管理', 'permission-management', 'view', 'permission-management', 'menu', 'c0000000-0000-0000-0000-000000000015', 'permission-management', 'key', 3),
        ('c0000000-0000-0000-0000-000000000013', 'operation-log:view', '操作日志', '系统操作日志查看', 'operation-log', 'view', 'operation-log', 'menu', 'c0000000-0000-0000-0000-000000000015', 'operation-log', 'document-text', 4),
        -- PM2 日志菜单
        ('c0000000-0000-0000-0000-000000000014', 'pm2-logs:view', 'PM2日志管理', 'PM2进程日志查看', 'pm2-logs', 'view', 'pm2-logs', 'menu', NULL, 'pm2-logs', 'server', 11)
      ON CONFLICT (code) DO NOTHING
      RETURNING code
    `)
    
    if (missingMenus.rows.length > 0) {
      console.log(`✅ 成功补充 ${missingMenus.rows.length} 个菜单: ${missingMenus.rows.map(r => r.code).join(', ')}`)
    } else {
      console.log('ℹ️  所有菜单已存在，检查路径和层级关系...')
    }
    
    // 强制修正路径和层级关系（即使菜单已存在）
    console.log('🔧 强制修正菜单路径和层级关系...')
    
    // 修正父菜单 path
    await pool.query(`
      UPDATE permissions SET path = NULL WHERE code = 'system-access:view' AND path IS NOT NULL
    `)
    
    // 修正 PM2 菜单 path
    await pool.query(`
      UPDATE permissions SET path = 'pm2-logs' WHERE code = 'pm2-logs:view' AND path = '/pm2-logs'
    `)
    
    // 设置 RBAC 子菜单的 parent_id 和 path
    const rbacUpdates = [
      { code: 'user-management:view', path: 'user-management', order: 1 },
      { code: 'role-management:view', path: 'role-management', order: 2 },
      { code: 'permission-management:view', path: 'permission-management', order: 3 },
      { code: 'operation-log:view', path: 'operation-log', order: 4 }
    ]
    
    for (const update of rbacUpdates) {
      await pool.query(`
        UPDATE permissions SET 
          parent_id = 'c0000000-0000-0000-0000-000000000015',
          path = $1,
          sort_order = $2
        WHERE code = $3
      `, [update.path, update.order, update.code])
    }
    
    // 设置 PM2 按钮权限的父级
    await pool.query(`
      UPDATE permissions SET parent_id = 'c0000000-0000-0000-0000-000000000014' 
      WHERE code IN ('pm2-logs:read', 'pm2-logs:clear')
    `)
    
    console.log('✅ 菜单路径和层级关系修正完成')
    
    console.log(' 为 admin 角色重新分配所有权限...')
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 'a0000000-0000-0000-0000-000000000001', id 
      FROM permissions
      WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions 
        WHERE role_id = 'a0000000-0000-0000-0000-000000000001' 
        AND permission_id = permissions.id
      )
      ON CONFLICT DO NOTHING;
    `)
    console.log('✅ admin 角色权限补充分配成功')
  } else {
    console.log(`️  菜单数据已存在（${currentMenuCount} 个菜单）`)
    
    // 即使菜单数量正确，也要确保路径和层级关系正确
    console.log('🔧 验证并修正菜单路径和层级关系...')
    
    // 修正父菜单 path
    const parentFix = await pool.query(`
      UPDATE permissions SET path = NULL WHERE code = 'system-access:view' AND path IS NOT NULL
    `)
    if (parentFix.rowCount > 0) {
      console.log('✅ 修正父菜单 system-access:view 的 path 为 NULL')
    }
    
    // 修正 PM2 菜单 path
    const pm2Fix = await pool.query(`
      UPDATE permissions SET path = 'pm2-logs' WHERE code = 'pm2-logs:view' AND path = '/pm2-logs'
    `)
    if (pm2Fix.rowCount > 0) {
      console.log('✅ 修正 PM2 菜单 path: /pm2-logs -> pm2-logs')
    }
    
    // 验证 RBAC 子菜单的层级关系
    const rbacCheck = await pool.query(`
      SELECT code, parent_id, path 
      FROM permissions 
      WHERE code IN ('user-management:view', 'role-management:view', 'permission-management:view', 'operation-log:view')
    `)
    
    let needFix = false
    for (const menu of rbacCheck.rows) {
      if (menu.parent_id !== 'c0000000-0000-0000-0000-000000000015' || !menu.path) {
        needFix = true
        break
      }
    }
    
    if (needFix) {
      console.log(' 修正 RBAC 子菜单层级关系...')
      const rbacUpdates = [
        { code: 'user-management:view', path: 'user-management', order: 1 },
        { code: 'role-management:view', path: 'role-management', order: 2 },
        { code: 'permission-management:view', path: 'permission-management', order: 3 },
        { code: 'operation-log:view', path: 'operation-log', order: 4 }
      ]
      
      for (const update of rbacUpdates) {
        await pool.query(`
          UPDATE permissions SET 
            parent_id = 'c0000000-0000-0000-0000-000000000015',
            path = $1,
            sort_order = $2
          WHERE code = $3
        `, [update.path, update.order, update.code])
      }
      console.log('✅ RBAC 子菜单层级关系修正完成')
    } else {
      console.log('✅ RBAC 子菜单层级关系已正确')
    }
  }
}

async function assignUserRolePermissions() {
  const userRole = await pool.query('SELECT id FROM roles WHERE id = $1', ['a0000000-0000-0000-0000-000000000002'])
  if (userRole.rows.length > 0) {
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
        WHERE code IN ('chat:read', 'chat:create', 'memory:read', 'memory:create', 'session-group:read')
        ON CONFLICT DO NOTHING;
      `)
      console.log('✅ user 角色权限分配成功')
    } else {
      console.log('ℹ️  user 角色权限已存在')
    }
  } else {
    console.log('⚠️  user 角色不存在，跳过权限分配')
  }
}

async function assignModeratorPermissions() {
  const moderatorRole = await pool.query('SELECT id FROM roles WHERE id = $1', ['a0000000-0000-0000-0000-000000000003'])
  if (moderatorRole.rows.length > 0) {
    const moderatorRolePermissions = await pool.query(
      'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
      ['a0000000-0000-0000-0000-000000000003']
    )
    if (parseInt(moderatorRolePermissions.rows[0].count) === 0) {
      console.log('📝 为 moderator 角色分配内容管理权限...')
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 'a0000000-0000-0000-0000-000000000003', id 
        FROM permissions 
        WHERE code IN (
          'chat:read', 'chat:create', 'chat:update', 'chat:delete',
          'memory:read', 'memory:create', 'memory:update', 'memory:delete',
          'session-group:read', 'session-group:create', 'session-group:update', 'session-group:delete',
          'log:read'
        )
        ON CONFLICT DO NOTHING;
      `)
      console.log('✅ moderator 角色权限分配成功')
    } else {
      console.log('ℹ️  moderator 角色权限已存在')
    }
  } else {
    console.log('⚠️  moderator 角色不存在，跳过权限分配')
  }
}

async function createDefaultAdminUser() {
  console.log('🔍 检查默认管理员用户...')
  const adminUser = await pool.query('SELECT id FROM users WHERE username = $1', ['admin'])

  if (adminUser.rows.length === 0) {
    console.log('📝 创建默认管理员用户...')
    const bcrypt = require('bcrypt')
    const passwordHash = await bcrypt.hash('admin123', 10)

    const newUser = await pool.query(
      `INSERT INTO users (id, username, password_hash, email, status) 
       VALUES ('c0000000-0000-0000-0000-000000000001', 'admin', $1, 'admin@example.com', 'active')
       RETURNING id;`,
      [passwordHash]
    )

    const adminUserId = newUser.rows[0].id
    console.log('✅ 默认管理员用户创建成功')

    console.log('🔗 为 admin 用户分配 admin 角色...')
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, 'a0000000-0000-0000-0000-000000000001')
       ON CONFLICT DO NOTHING;`,
      [adminUserId]
    )
    console.log('✅ admin 用户角色分配成功')
  } else {
    console.log('ℹ️  管理员用户已存在')
    const adminUserId = adminUser.rows[0].id
    const hasAdminRole = await pool.query(
      `SELECT COUNT(*) FROM user_roles 
       WHERE user_id = $1 AND role_id = 'a0000000-0000-0000-0000-000000000001'`,
      [adminUserId]
    )
    if (parseInt(hasAdminRole.rows[0].count) === 0) {
      console.log('🔗 为已存在的 admin 用户分配 admin 角色...')
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, 'a0000000-0000-0000-0000-000000000001')
         ON CONFLICT DO NOTHING;`,
        [adminUserId]
      )
      console.log('✅ admin 用户角色补充分配成功')
    } else {
      console.log('ℹ️  admin 用户角色已正确分配')
    }
  }
}

// ============================================
// 辅助函数：创建触发器和视图
// ============================================

async function createUpdatedAtTriggers() {
  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // ✅ 只对包含 updated_at 字段的表创建触发器
  const tables = ['users', 'roles', 'permissions', 'sessions', 'memories', 'operation_logs']
  
  for (const table of tables) {
    // 检查表是否存在且有 updated_at 字段
    const columnCheck = await pool.query(`
      SELECT COUNT(*) 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = 'updated_at'
    `, [table])
    
    if (parseInt(columnCheck.rows[0].count) > 0) {
      await pool.query(`
        DROP TRIGGER IF EXISTS trigger_${table}_updated_at ON ${table};
        CREATE TRIGGER trigger_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `)
      console.log(`✅ 表 ${table} 的 updated_at 触发器创建成功`)
    } else {
      console.log(`ℹ️  表 ${table} 没有 updated_at 字段，跳过触发器创建`)
    }
  }
  
  console.log('✅ updated_at 自动更新触发器创建完成')
}

async function createRBACViews() {
  await pool.query(`
    CREATE OR REPLACE VIEW v_active_users AS
    SELECT * FROM users WHERE deleted_at IS NULL AND status = 'active';
  `)

  await pool.query(`
    CREATE OR REPLACE VIEW v_active_roles AS
    SELECT * FROM roles WHERE deleted_at IS NULL;
  `)

  await pool.query(`
    CREATE OR REPLACE VIEW v_active_permissions AS
    SELECT * FROM permissions WHERE deleted_at IS NULL;
  `)

  await pool.query(`
    CREATE OR REPLACE VIEW v_user_roles_detail AS
    SELECT 
      u.id as user_id, u.username, u.email,
      r.id as role_id, r.name as role_name, r.display_name as role_display_name,
      ur.created_at as assigned_at, ur.created_by as assigned_by
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.deleted_at IS NULL AND r.deleted_at IS NULL AND ur.deleted_at IS NULL;
  `)

  await pool.query(`
    CREATE OR REPLACE VIEW v_role_permissions_detail AS
    SELECT 
      r.id as role_id, r.name as role_name,
      p.id as permission_id, p.code as permission_code, p.name as permission_name,
      p.type as permission_type, p.module, p.action,
      rp.created_at as assigned_at, rp.created_by as assigned_by
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE r.deleted_at IS NULL AND p.deleted_at IS NULL AND rp.deleted_at IS NULL;
  `)

  console.log('✅ 常用视图创建成功')
}

module.exports = initDefaultData
