// 说明：角色数据模型 - 管理角色的创建、查询、权限分配

const { pool } = require('../../config/db')
const { v4: uuidv4 } = require('uuid')

class RoleModel {
  /**
   * 创建新角色
   */
  async create(roleData) {
    const id = uuidv4()
    const query = `
      INSERT INTO roles (id, name, display_name, description, is_system, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `
    const result = await pool.query(query, [
      id,
      roleData.name,
      roleData.displayName,
      roleData.description || null,
      roleData.isSystem || false,
      roleData.sortOrder || 0,
    ])
    return result.rows[0]
  }

  /**
   * 根据名称查询角色
   */
  async getByName(name) {
    const query = `
      SELECT * FROM roles WHERE name = $1
    `
    const result = await pool.query(query, [name])
    return result.rows[0] || null
  }

  /**
   * 根据 ID 查询角色
   */
  async getById(roleId) {
    const query = `
      SELECT id, name, display_name, description, is_system, sort_order, created_at, updated_at, deleted_at
      FROM roles
      WHERE id = $1
    `
    const result = await pool.query(query, [roleId])
    return result.rows[0] || null
  }

  /**
   * 获取角色列表（分页）
   */
  async list(params = {}) {
    const { page = 1, limit = 20, keyword } = params
    const offset = (page - 1) * limit

    let query = `
      SELECT id, name, display_name, description, is_system, sort_order, created_at, updated_at
      FROM roles
      WHERE deleted_at IS NULL
    `
    const values = []
    let idx = 1

    if (keyword) {
      query += ` AND (name ILIKE $${idx} OR display_name ILIKE $${idx} OR description ILIKE $${idx})`
      values.push(`%${keyword}%`)
    }

    query += ` ORDER BY is_system DESC, sort_order ASC, created_at DESC LIMIT $${idx++} OFFSET $${idx}`
    values.push(limit, offset)

    const result = await pool.query(query, values)
    return result.rows
  }

  /**
   * 获取角色总数
   */
  async count(params = {}) {
    const { keyword } = params

    let query = `SELECT COUNT(*) FROM roles WHERE deleted_at IS NULL`
    const values = []

    if (keyword) {
      query += ` AND (name ILIKE $1 OR display_name ILIKE $1 OR description ILIKE $1)`
      values.push(`%${keyword}%`)
    }

    const result = await pool.query(query, values)
    return parseInt(result.rows[0].count)
  }

  /**
   * 更新角色信息
   */
  async update(roleId, updates) {
    // 系统角色不允许修改名称
    const role = await this.getById(roleId)
    if (role && role.is_system && updates.name) {
      throw new Error('系统角色不允许修改名称')
    }

    const fields = []
    const values = []
    let idx = 1

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`)
      values.push(updates.name)
    }
    if (updates.displayName !== undefined) {
      fields.push(`display_name = $${idx++}`)
      values.push(updates.displayName)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${idx++}`)
      values.push(updates.description)
    }
    if (updates.sortOrder !== undefined) {
      fields.push(`sort_order = $${idx++}`)
      values.push(updates.sortOrder)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`)
      values.push(updates.status)
    }

    if (fields.length === 0) {
      return await this.getById(roleId)
    }

    fields.push(`updated_at = NOW()`)
    values.push(roleId)

    const query = `
      UPDATE roles
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除角色（软删除）
   */
  async delete(roleId) {
    const role = await this.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }
    if (role.is_system) {
      throw new Error('系统角色不允许删除')
    }

    // 检查是否已删除
    if (role.deleted_at) {
      throw new Error('角色已被删除')
    }

    // 检查是否有用户绑定该角色
    const userCountQuery = `
      SELECT COUNT(*) as count
      FROM user_roles
      WHERE role_id = $1 AND deleted_at IS NULL
    `
    const userCountResult = await pool.query(userCountQuery, [roleId])
    const userCount = parseInt(userCountResult.rows[0].count)

    if (userCount > 0) {
      throw new Error(`该角色已被 ${userCount} 个用户使用，无法删除`)
    }

    // 软删除
    const query = `
      UPDATE roles 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `
    const result = await pool.query(query, [roleId])
    return result.rows.length > 0
  }

  /**
   * 更新角色状态（启用/禁用）
   */
  async updateStatus(roleId, status) {
    const role = await this.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }

    // 检查是否已删除
    if (role.deleted_at) {
      throw new Error('角色已被删除，无法修改状态')
    }

    // 验证状态值
    const validStatuses = ['active', 'inactive']
    if (!validStatuses.includes(status)) {
      throw new Error('无效的状态值')
    }

    const query = `
      UPDATE roles 
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, name, display_name, status
    `
    const result = await pool.query(query, [status, roleId])
    return result.rows[0] || null
  }

  /**
   * 为角色分配权限
   */
  async assignPermission(roleId, permissionId) {
    const query = `
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES ($1, $2)
      ON CONFLICT (role_id, permission_id) DO NOTHING
      RETURNING *
    `
    const result = await pool.query(query, [roleId, permissionId])
    return result.rows[0] || null
  }

  /**
   * 移除角色权限
   */
  async removePermission(roleId, permissionId) {
    const query = `
      DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2
    `
    const result = await pool.query(query, [roleId, permissionId])
    return result.rows.length > 0
  }

  /**
   * 批量为角色分配权限
   */
  async assignPermissions(roleId, permissionIds) {
    const queries = permissionIds.map((permissionId) => ({
      text: `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `,
      values: [roleId, permissionId],
    }))

    // 使用事务批量插入
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const q of queries) {
        await client.query(q.text, q.values)
      }
      await client.query('COMMIT')
      return true
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 获取角色的所有权限
   */
  async getRolePermissions(roleId) {
    const query = `
      SELECT p.id, p.code, p.name, p.description, p.module, p.action, p.resource
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module, p.action
    `
    const result = await pool.query(query, [roleId])
    return result.rows
  }

  /**
   * 获取角色的所有用户
   */
  async getRoleUsers(roleId, params = {}) {
    const { page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) FROM user_roles WHERE role_id = $1
    `
    const countResult = await pool.query(countQuery, [roleId])
    const total = parseInt(countResult.rows[0].count)

    // 查询数据
    const query = `
      SELECT u.id, u.username, u.email, u.status, u.created_at
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = $1
      ORDER BY ur.created_at DESC
      LIMIT $2 OFFSET $3
    `
    const result = await pool.query(query, [roleId, limit, offset])
    
    return {
      list: result.rows,
      total,
    }
  }
}

module.exports = new RoleModel()
