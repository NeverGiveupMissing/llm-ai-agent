// 说明：权限业务逻辑 - 从 sys_button.perms 字段读取按钮权限标识
// ✅ 已完全迁移到若依菜单权限体系，废弃旧的 permissions 表

const { pool } = require('../../config/db')

class PermissionService {
  /**
   * 获取用户的所有权限标识（从 sys_button.perms）
   */
  async getUserPermissions(user_id) {
    console.log('🔍 [Permission] 查询用户权限标识, user_id:', user_id)

    // ✅ 管理员权限判断：如果是 admin 角色，直接返回通配符
    const isAdmin = await this.checkIsAdmin(user_id)
    if (isAdmin) {
      console.log('👑 [Permission] 管理员用户，返回通配符 ["*:*"]')
      return {
        success: true,
        data: ['*:*:*'],
        total: 1,
      }
    }

    // 普通用户：通过角色关联查询按钮权限
    // ✅ 从 sys_button.perms 查询
    const query = `
      SELECT DISTINCT b.perms
      FROM sys_button b
      INNER JOIN sys_role_button srb ON b.button_id = srb.button_id
      INNER JOIN sys_user_role ur ON srb.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1::int
        AND b.status = '0'
        AND r.status = '0'
        AND b.perms IS NOT NULL
        AND b.perms != ''
    `

    const result = await pool.query(query, [user_id])
    const permissions = result.rows.map((row) => row.perms)

    console.log('✅ [Permission] 查询到权限标识数:', permissions.length)

    return {
      success: true,
      data: permissions,
      total: permissions.length,
    }
  }

  /**
   * 检查用户是否为超级管理员
   * @param {number} user_id - 用户ID
   * @returns {Promise<boolean>}
   */
  async checkIsAdmin(user_id) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM sys_user_role ur
        INNER JOIN sys_role r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1::int
          AND r.status = '0'
          AND (r.role_key = 'admin' OR r.role_key LIKE '%admin%')
      `
      const result = await pool.query(query, [user_id])
      return parseInt(result.rows[0].count) > 0
    } catch (error) {
      console.error('❌ [Permission] 检查管理员权限失败:', error.message)
      return false
    }
  }

  /**
   * 检查用户是否拥有指定权限
   * ✅ 从 sys_button.perms 查询
   */
  async checkPermission(user_id, permissionCode) {
    const query = `
      SELECT COUNT(*) as count
      FROM sys_button b
      INNER JOIN sys_role_button srb ON b.button_id = srb.button_id
      INNER JOIN sys_user_role ur ON srb.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1::int
        AND b.perms = $2
        AND b.status = '0'
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
   * ✅ 从 sys_button.perms 查询
   */
  async checkAnyPermission(user_id, permissionCodes) {
    const query = `
      SELECT COUNT(DISTINCT b.perms) as count
      FROM sys_button b
      INNER JOIN sys_role_button srb ON b.button_id = srb.button_id
      INNER JOIN sys_user_role ur ON srb.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1::int
        AND b.perms = ANY($2)
        AND b.status = '0'
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
   * ✅ 从 sys_button.perms 查询
   */
  async checkAllPermissions(user_id, permissionCodes) {
    const query = `
      SELECT COUNT(DISTINCT b.perms) as count
      FROM sys_button b
      INNER JOIN sys_role_button srb ON b.button_id = srb.button_id
      INNER JOIN sys_user_role ur ON srb.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1::int
        AND b.perms = ANY($2)
        AND b.status = '0'
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
