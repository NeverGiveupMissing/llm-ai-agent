// 说明：权限业务逻辑 - 从 sys_menu.perms 字段读取权限标识
// ✅ 已完全迁移到若依菜单权限体系，废弃旧的 permissions 表

const { pool } = require('../../config/db')

class PermissionService {
  /**
   * 获取用户的所有权限标识（从 sys_menu.perms）
   * ✅ 替代旧版 permissionModel.getUserPermissions()
   */

  /**
   * 获取用户的所有权限标识（从 sys_menu.perms）
   * ✅ 替代旧版 permissionModel.getUserPermissions()
   */
  async getUserPermissions(user_id) {
    console.log('🔍 [Permission] 查询用户权限标识, user_id:', user_id)
    
    const query = `
      SELECT DISTINCT m.perms
      FROM sys_menu m
      INNER JOIN sys_role_menu srm ON m.menu_id = srm.menu_id
      INNER JOIN sys_user_role ur ON srm.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
        AND m.status = '0'
        AND r.status = '0'
        AND m.perms IS NOT NULL
        AND m.perms != ''
    `
    
    const result = await pool.query(query, [user_id])
    const permissions = result.rows.map(row => row.perms)
    
    console.log('✅ [Permission] 查询到权限标识数:', permissions.length)
    
    return {
      success: true,
      data: permissions,
      total: permissions.length,
    }
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async checkPermission(user_id, permissionCode) {
    const query = `
      SELECT COUNT(*) as count
      FROM sys_menu m
      INNER JOIN sys_role_menu srm ON m.menu_id = srm.menu_id
      INNER JOIN sys_user_role ur ON srm.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
        AND m.perms = $2
        AND m.status = '0'
        AND r.status = '0'
    `
    
    const result = await pool.query(query, [user_id, permissionCode])
    const hasPermission = parseInt(result.rows[0].count) > 0
    
    return {
      success: true,
      data: {
        hasPermission,
        permissionCode,
      },
    }
  }



  /**
   * 检查用户是否拥有任一权限
   */
  async checkAnyPermission(user_id, permissionCodes) {
    const query = `
      SELECT COUNT(DISTINCT m.perms) as count
      FROM sys_menu m
      INNER JOIN sys_role_menu srm ON m.menu_id = srm.menu_id
      INNER JOIN sys_user_role ur ON srm.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
        AND m.perms = ANY($2)
        AND m.status = '0'
        AND r.status = '0'
    `
    
    const result = await pool.query(query, [user_id, permissionCodes])
    const hasAny = parseInt(result.rows[0].count) > 0
    
    return {
      success: true,
      data: {
        hasAny,
        permissionCodes,
      },
    }
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async checkAllPermissions(user_id, permissionCodes) {
    const query = `
      SELECT COUNT(DISTINCT m.perms) as count
      FROM sys_menu m
      INNER JOIN sys_role_menu srm ON m.menu_id = srm.menu_id
      INNER JOIN sys_user_role ur ON srm.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
        AND m.perms = ANY($2)
        AND m.status = '0'
        AND r.status = '0'
    `
    
    const result = await pool.query(query, [user_id, permissionCodes])
    const hasAll = parseInt(result.rows[0].count) === permissionCodes.length
    
    return {
      success: true,
      data: {
        hasAll,
        permissionCodes,
      },
    }
  }

  async createPermission() {
    throw new Error('创建权限功能已废弃，请使用菜单模块')
  }

  async updatePermission() {
    throw new Error('更新权限功能已废弃，请使用菜单模块')
  }

  async deletePermission() {
    throw new Error('删除权限功能已废弃，请使用菜单模块')
  }
}

module.exports = new PermissionService()
