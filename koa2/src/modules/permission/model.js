// 说明：权限数据模型 - 管理权限的查询和分配

const { pool } = require('../../config/db')

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
  async getUserPermissions(user_id) {
    const query = `
      SELECT DISTINCT p.id, p.code, p.name, p.description, p.module, p.action, p.resource,
             p.type, p.parent_id, p.path, p.icon, p.sort_order
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1::int
      ORDER BY p.sort_order, p.module, p.action
    `
    const result = await pool.query(query, [user_id])
    return result.rows
  }

  /**
   * 获取使用此权限的角色
   */
  async getPermissionRoles(permissionId) {
    const query = `
      SELECT r.*
      FROM roles r
      INNER JOIN role_permissions rp ON r.id = rp.role_id
      WHERE rp.permission_id = $1
    `
    const result = await pool.query(query, [permissionId])
    return result.rows
  }

  /**
   * 创建权限
   */
  async create(permissionData) {
    const { name, code, type = 'button', parentId = null, path, icon, sortOrder = 0, description } = permissionData
    
    const query = `
      INSERT INTO permissions (id, name, code, type, parent_id, path, icon, sort_order, description)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    
    const values = [name, code, type, parentId, path || null, icon || null, sortOrder, description || null]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 更新权限
   */
  async update(permissionId, updates) {
    const allowedFields = ['name', 'code', 'type', 'parent_id', 'path', 'icon', 'sort_order', 'description']
    const updateFields = []
    const values = []
    let idx = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${idx++}`)
        values.push(value)
      }
    }

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段')
    }

    values.push(permissionId)
    const query = `
      UPDATE permissions
      SET ${updateFields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 删除权限
   */
  async delete(permissionId) {
    const query = `
      DELETE FROM permissions WHERE id = $1
    `
    const result = await pool.query(query, [permissionId])
    return result.rowCount > 0
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(user_id, permissionCode) {
    const query = `
      SELECT COUNT(*) as count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1::int AND p.code = $2
    `
    const result = await pool.query(query, [user_id, permissionCode])
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async hasAnyPermission(user_id, permissionCodes) {
    const query = `
      SELECT COUNT(*) as count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1::int AND p.code = ANY($2)
    `
    const result = await pool.query(query, [user_id, permissionCodes])
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async hasAllPermissions(user_id, permissionCodes) {
    const query = `
      SELECT COUNT(DISTINCT p.code) as count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1::int AND p.code = ANY($2)
    `
    const result = await pool.query(query, [user_id, permissionCodes])
    return parseInt(result.rows[0].count) === permissionCodes.length
  }
}

module.exports = new PermissionModel()
