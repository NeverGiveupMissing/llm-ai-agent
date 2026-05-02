// 说明：用户数据模型 - 管理用户的创建、查询、更新

const { pool } = require('../../config/db')
const { v4: uuidv4 } = require('uuid')

class UserModel {
  /**
   * 创建新用户
   */
  async create(userData) {
    const id = uuidv4()
    const query = `
      INSERT INTO users (id, username, password_hash, email, avatar_url, nickname, phone, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const result = await pool.query(query, [
      id,
      userData.username,
      userData.passwordHash,
      userData.email || null,
      userData.avatarUrl || null,
      userData.nickname || null,
      userData.phone || null,
      userData.bio || null,
    ])
    return result.rows[0]
  }

  /**
   * 根据用户名查询用户
   */
  async getByUsername(username) {
    const query = `
      SELECT * FROM users WHERE username = $1
    `
    const result = await pool.query(query, [username])
    return result.rows[0] || null
  }

  /**
   * 根据 ID 查询用户
   */
  async getById(userId) {
    const query = `
      SELECT id, username, email, avatar_url, nickname, phone, bio, status, last_login_at, last_login_ip, created_at, updated_at, deleted_at
      FROM users
      WHERE id = $1
    `
    const result = await pool.query(query, [userId])
    return result.rows[0] || null
  }

  /**
   * 获取用户列表（分页）
   */
  async list(params = {}) {
    const { page = 1, limit = 20, status, keyword } = params
    const offset = (page - 1) * limit

    let query = `
      SELECT id, username, email, avatar_url, nickname, phone, bio, status, last_login_at, created_at, updated_at
      FROM users
      WHERE deleted_at IS NULL
    `
    const values = []
    let idx = 1

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    if (keyword) {
      query += ` AND (username ILIKE $${idx} OR email ILIKE $${idx} OR nickname ILIKE $${idx})`
      values.push(`%${keyword}%`)
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`
    values.push(limit, offset)

    const result = await pool.query(query, values)
    return result.rows
  }

  /**
   * 获取用户总数
   */
  async count(params = {}) {
    const { status, keyword } = params

    let query = `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL`
    const values = []
    let idx = 1

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    if (keyword) {
      query += ` AND (username ILIKE $${idx} OR email ILIKE $${idx} OR nickname ILIKE $${idx})`
      values.push(`%${keyword}%`)
    }

    const result = await pool.query(query, values)
    return parseInt(result.rows[0].count)
  }

  /**
   * 更新用户信息
   */
  async update(userId, updates) {
    const fields = []
    const values = []
    let idx = 1

    if (updates.email !== undefined) {
      fields.push(`email = $${idx++}`)
      values.push(updates.email)
    }
    if (updates.avatarUrl !== undefined || updates.avatar !== undefined) {
      fields.push(`avatar_url = $${idx++}`)
      values.push(updates.avatarUrl || updates.avatar)
    }
    if (updates.nickname !== undefined) {
      fields.push(`nickname = $${idx++}`)
      values.push(updates.nickname)
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${idx++}`)
      values.push(updates.phone)
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${idx++}`)
      values.push(updates.bio)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`)
      values.push(updates.status)
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`password_hash = $${idx++}`)
      values.push(updates.passwordHash)
    }
    if (updates.lastLoginAt !== undefined) {
      fields.push(`last_login_at = $${idx++}`)
      values.push(updates.lastLoginAt)
    }

    if (fields.length === 0) {
      return await this.getById(userId)
    }

    fields.push(`updated_at = NOW()`)
    values.push(userId)

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, username, email, avatar_url, nickname, phone, bio, status, last_login_at, created_at, updated_at
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除用户（软删除）
   */
  async delete(userId) {
    const query = `
      UPDATE users 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `
    const result = await pool.query(query, [userId])
    return result.rows.length > 0
  }

  /**
   * 更新用户状态（启用/禁用）
   */
  async updateStatus(userId, status) {
    const query = `
      UPDATE users 
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, username, status
    `
    const result = await pool.query(query, [status, userId])
    return result.rows[0] || null
  }

  /**
   * 为用户分配角色
   */
  async assignRole(userId, roleId) {
    const query = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
      RETURNING *
    `
    const result = await pool.query(query, [userId, roleId])
    return result.rows[0] || null
  }

  /**
   * 移除用户角色
   */
  async removeRole(userId, roleId) {
    const query = `
      DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2
    `
    const result = await pool.query(query, [userId, roleId])
    return result.rows.length > 0
  }

  /**
   * 获取用户的所有角色
   */
  async getUserRoles(userId) {
    const query = `
      SELECT r.id, r.name, r.display_name, r.description
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `
    const result = await pool.query(query, [userId])
    return result.rows
  }
}

module.exports = new UserModel()
