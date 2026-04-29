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
      INSERT INTO users (id, username, password_hash, email, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await pool.query(query, [
      id,
      userData.username,
      userData.passwordHash,
      userData.email || null,
      userData.avatarUrl || null,
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
      SELECT id, username, email, avatar_url, status, last_login_at, created_at, updated_at
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
      SELECT id, username, email, avatar_url, status, last_login_at, created_at, updated_at
      FROM users
      WHERE 1=1
    `
    const values = []
    let idx = 1

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    if (keyword) {
      query += ` AND (username ILIKE $${idx} OR email ILIKE $${idx})`
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

    let query = `SELECT COUNT(*) FROM users WHERE 1=1`
    const values = []
    let idx = 1

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    if (keyword) {
      query += ` AND (username ILIKE $${idx} OR email ILIKE $${idx})`
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
    if (updates.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${idx++}`)
      values.push(updates.avatarUrl)
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
      RETURNING id, username, email, avatar_url, status, last_login_at, created_at, updated_at
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除用户
   */
  async delete(userId) {
    const query = `
      DELETE FROM users WHERE id = $1 RETURNING id
    `
    const result = await pool.query(query, [userId])
    return result.rows.length > 0
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
