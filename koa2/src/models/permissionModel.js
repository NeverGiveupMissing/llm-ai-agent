// 说明：权限数据模型 - 管理权限的查询和分配

const { pool } = require('../config/db')

class PermissionModel {
  /**
   * 根据代码查询权限
   */
  async getByCode(code) {
    const query = `
      SELECT * FROM permissions WHERE code = $1
    `
    const result = await pool.query(query, [code])
    return result.rows[0] || null
  }

  /**
   * 根据 ID 查询权限
   */
  async getById(permissionId) {
    const query = `
      SELECT * FROM permissions WHERE id = $1
    `
    const result = await pool.query(query, [permissionId])
    return result.rows[0] || null
  }

  /**
   * 获取权限列表（支持筛选）
   */
  async list(params = {}) {
    const { module, action, resource, keyword } = params

    let query = `
      SELECT * FROM permissions WHERE 1=1
    `
    const values = []
    let idx = 1

    if (module) {
      query += ` AND module = $${idx++}`
      values.push(module)
    }

    if (action) {
      query += ` AND action = $${idx++}`
      values.push(action)
    }

    if (resource) {
      query += ` AND resource = $${idx++}`
      values.push(resource)
    }

    if (keyword) {
      query += ` AND (code ILIKE $${idx} OR name ILIKE $${idx} OR description ILIKE $${idx})`
      values.push(`%${keyword}%`)
    }

    query += ` ORDER BY module, action, code`

    const result = await pool.query(query, values)
    return result.rows
  }

  /**
   * 按模块分组获取权限
   */
  async listByModule() {
    const query = `
      SELECT module, json_agg(
        json_build_object(
          'id', id,
          'code', code,
          'name', name,
          'description', description,
          'action', action,
          'resource', resource
        )
      ) as permissions
      FROM permissions
      GROUP BY module
      ORDER BY module
    `
    const result = await pool.query(query)
    return result.rows
  }

  /**
   * 获取用户的所有权限（通过角色）
   */
  async getUserPermissions(userId) {
    const query = `
      SELECT DISTINCT p.id, p.code, p.name, p.description, p.module, p.action, p.resource
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY p.module, p.action
    `
    const result = await pool.query(query, [userId])
    return result.rows
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(userId, permissionCode) {
    const query = `
      SELECT COUNT(*) as count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1 AND p.code = $2
    `
    const result = await pool.query(query, [userId, permissionCode])
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async hasAnyPermission(userId, permissionCodes) {
    const query = `
      SELECT COUNT(*) as count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1 AND p.code = ANY($2)
    `
    const result = await pool.query(query, [userId, permissionCodes])
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async hasAllPermissions(userId, permissionCodes) {
    const query = `
      SELECT COUNT(DISTINCT p.code) as count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1 AND p.code = ANY($2)
    `
    const result = await pool.query(query, [userId, permissionCodes])
    return parseInt(result.rows[0].count) === permissionCodes.length
  }
}

module.exports = new PermissionModel()
