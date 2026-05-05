const { pool } = require('../../config/db')

class LoginLogModel {
  /**
   * 创建登录日志
   */
  async create(logData) {
    const { user_id, username, ipAddress, loginLocation, browser, os, status, message } = logData

    const query = `
      INSERT INTO login_logs (
        user_id, username, login_ip, login_location, browser, os, status, msg
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `

    const values = [
      user_id || null,
      username,
      ipAddress || '',
      loginLocation || '',
      browser || '',
      os || '',
      status || '0',
      message || '',
    ]

    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 获取登录日志列表（分页）
   */
  async getList(params) {
    const { page = 1, limit = 20, user_id, username, status, startDate, endDate, keyword } = params

    const whereConditions = []
    const values = []
    let paramIndex = 1

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex}`)
      values.push(user_id)
      paramIndex++
    }

    if (username) {
      whereConditions.push(`username LIKE $${paramIndex}`)
      values.push(`%${username}%`)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`login_time >= $${paramIndex}`)
      values.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`login_time <= $${paramIndex}`)
      values.push(endDate)
      paramIndex++
    }

    if (keyword) {
      whereConditions.push(
        `(username LIKE $${paramIndex} OR login_ip LIKE $${paramIndex} OR login_location LIKE $${paramIndex})`,
      )
      values.push(`%${keyword}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 查询总数
    const countQuery = `SELECT COUNT(*) FROM login_logs ${whereClause}`
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].count)

    // 查询数据
    const offset = (page - 1) * limit
    const dataQuery = `
      SELECT * FROM login_logs 
      ${whereClause}
      ORDER BY login_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const dataValues = [...values, limit, offset]
    const dataResult = await pool.query(dataQuery, dataValues)

    return {
      list: dataResult.rows,
      total,
    }
  }

  /**
   * 获取当前用户的登录日志
   */
  async getByuser_id(user_id, page = 1, limit = 20) {
    return this.getList({ user_id, page, limit })
  }

  /**
   * 删除登录日志
   */
  async delete(id) {
    const query = 'DELETE FROM login_logs WHERE id = $1 RETURNING *'
    const result = await pool.query(query, [id])
    return result.rows[0]
  }

  /**
   * 批量删除登录日志
   */
  async batchDelete(ids) {
    const query = 'DELETE FROM login_logs WHERE id = ANY($1) RETURNING *'
    const result = await pool.query(query, [ids])
    return result.rows
  }

  /**
   * 清空所有登录日志
   */
  async clearAll() {
    const query = 'DELETE FROM login_logs'
    await pool.query(query)
  }
}

module.exports = new LoginLogModel()
