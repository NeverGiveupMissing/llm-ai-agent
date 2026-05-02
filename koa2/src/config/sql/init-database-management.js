// 说明：数据库管理模块权限数据初始化
// 路径：koa2/src/config/sql/init-database-management.js

const { pool } = require('../db')

/**
 * 初始化数据库管理模块的权限数据
 */
async function initDatabaseManagement() {
  console.log('📊 初始化数据库管理模块权限...')

  try {
    // 0. 清理可能存在的重复记录（保留最早创建的一条）
    await pool.query(`
      DELETE FROM permissions 
      WHERE code = 'database' 
      AND id NOT IN (
        SELECT id FROM permissions 
        WHERE code = 'database' 
        ORDER BY created_at ASC 
        LIMIT 1
      )
    `)
    
    // 1. 插入数据库管理父级菜单
    await pool.query(`
      INSERT INTO permissions (id, code, name, description, module, action, resource, type, parent_id, path, icon, sort_order, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'database',
        '数据库管理',
        '数据库管理模块',
        'database',
        'view',
        'database',
        'menu',
        NULL,
        'database-management',
        'database',
        12,
        NOW(),
        NOW()
      ) ON CONFLICT (code) DO NOTHING
    `)
    console.log('✅ 数据库管理菜单已创建')

    // 1.5. 修正路径（去掉前导斜杠）
    await pool.query(`
      UPDATE permissions SET path = 'database-management' 
      WHERE code = 'database' AND path = '/database-management'
    `)
    
    // 2. 插入数据库管理子权限
    const buttonPermissions = [
      {
        code: 'database:view',
        name: '查看数据库管理页面',
        description: '查看数据库管理页面',
        path: 'database-management',
        icon: 'eye',
        sort_order: 1,
      },
      {
        code: 'database:execute',
        name: '执行SQL语句',
        description: '执行SQL语句权限',
        path: null,
        icon: 'play',
        sort_order: 2,
      },
      {
        code: 'database:export',
        name: '导出数据库',
        description: '导出数据库备份',
        path: null,
        icon: 'download',
        sort_order: 3,
      },
      {
        code: 'database:table',
        name: '查看表结构',
        description: '查看数据库表结构',
        path: null,
        icon: 'table-chart',
        sort_order: 4,
      },
    ]

    for (const perm of buttonPermissions) {
      await pool.query(
        `INSERT INTO permissions (id, code, name, description, module, action, resource, type, parent_id, path, icon, sort_order, created_at, updated_at)
         VALUES (
           gen_random_uuid(),
           $1, $2, $3, 'database', 'execute', 'database', 'button',
           (SELECT id FROM permissions WHERE code = 'database'),
           $4, $5, $6, NOW(), NOW()
         ) ON CONFLICT (code) DO NOTHING`,
        [perm.code, perm.name, perm.description, perm.path, perm.icon, perm.sort_order]
      )
    }
    console.log('✅ 数据库管理按钮权限已创建')

    // 3. 将数据库管理权限分配给 admin 角色
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT 
        (SELECT id FROM roles WHERE name = 'admin'),
        p.id
      FROM permissions p
      WHERE p.code IN ('database', 'database:view', 'database:execute', 'database:export', 'database:table')
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `)
    console.log('✅ 数据库管理权限已分配给 admin 角色')

    return true
  } catch (error) {
    console.error('❌ 数据库管理模块初始化失败:', error.message)
    throw error
  }
}

module.exports = initDatabaseManagement
