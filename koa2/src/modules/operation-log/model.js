const { pool } = require('../../config/db')

class OperationLogModel {
  /**
   * 记录操作日志
   */
  async create(logData) {
    const {
      userId,
      username,
      operation,
      module,
      action,
      method,
      path,
      ipAddress,
      userAgent,
      requestParams,
      responseStatus,
      responseData,
      duration,
      status,
      errorMessage,
    } = logData

    const query = `
      INSERT INTO operation_logs (
        user_id, username, operation, module, action, method, path,
        ip_address, user_agent, request_params, response_status,
        response_data, duration, status, error_message
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `

    const values = [
      userId,
      username,
      operation,
      module,
      action,
      method,
      path,
      ipAddress,
      userAgent,
      JSON.stringify(requestParams || {}),
      responseStatus,
      responseData ? JSON.stringify(responseData) : null,
      duration,
      status || 'success',
      errorMessage,
    ]

    const result = await pool.query(query, values)
    return result.rows[0]
  }

  /**
   * 获取操作日志列表（分页）
   */
  async getList(params) {
    const {
      page = 1,
      limit = 20,
      userId,
      username,
      module,
      operation,
      status,
      startDate,
      endDate,
      keyword,
    } = params

    const offset = (page - 1) * limit
    let whereConditions = []
    let values = []
    let paramIndex = 1

    // 构建查询条件
    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`)
      values.push(userId)
      paramIndex++
    }

    if (username) {
      whereConditions.push(`username ILIKE $${paramIndex}`)
      values.push(`%${username}%`)
      paramIndex++
    }

    if (module) {
      whereConditions.push(`module = $${paramIndex}`)
      values.push(module)
      paramIndex++
    }

    if (operation) {
      whereConditions.push(`operation ILIKE $${paramIndex}`)
      values.push(`%${operation}%`)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      values.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      values.push(endDate)
      paramIndex++
    }

    if (keyword) {
      whereConditions.push(
        `(operation ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR module ILIKE $${paramIndex})`,
      )
      values.push(`%${keyword}%`)
      paramIndex++
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 查询总数
    const countQuery = `SELECT COUNT(*) FROM operation_logs ${whereClause}`
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].count)

    // 查询数据
    const dataQuery = `
      SELECT * FROM operation_logs 
      ${whereClause}
      ORDER BY created_at DESC
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
   * 获取操作日志详情
   */
  async getById(id) {
    const query = 'SELECT * FROM operation_logs WHERE id = $1'
    const result = await pool.query(query, [id])
    return result.rows[0]
  }

  /**
   * 删除操作日志
   */
  async delete(id) {
    const query = 'DELETE FROM operation_logs WHERE id = $1 RETURNING *'
    const result = await pool.query(query, [id])
    return result.rows[0]
  }

  /**
   * 批量删除操作日志
   */
  async batchDelete(ids) {
    const query = 'DELETE FROM operation_logs WHERE id = ANY($1) RETURNING *'
    const result = await pool.query(query, [ids])
    return result.rows
  }

  /**
   * 清空所有操作日志
   */
  async clearAll() {
    const query = 'DELETE FROM operation_logs'
    await pool.query(query)
  }

  /**
   * 获取统计数据
   */
  async getStats(startDate, endDate) {
    let whereConditions = []
    let values = []
    let paramIndex = 1

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      values.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      values.push(endDate)
      paramIndex++
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 总操作数
    const totalQuery = `SELECT COUNT(*) FROM operation_logs ${whereClause}`
    const totalResult = await pool.query(totalQuery, values)

    // 成功操作数
    const successQuery = `SELECT COUNT(*) FROM operation_logs ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'success'`
    const successResult = await pool.query(successQuery, values)

    // 失败操作数
    const failedQuery = `SELECT COUNT(*) FROM operation_logs ${whereClause} ${whereClause ? 'AND' : 'WHERE'} status = 'failed'`
    const failedResult = await pool.query(failedQuery, values)

    // 平均响应时间
    const avgDurationQuery = `SELECT AVG(duration) FROM operation_logs ${whereClause}`
    const avgDurationResult = await pool.query(avgDurationQuery, values)

    // 按模块统计
    const moduleStatsQuery = `
      SELECT module, COUNT(*) as count
      FROM operation_logs
      ${whereClause}
      GROUP BY module
      ORDER BY count DESC
      LIMIT 10
    `
    const moduleStatsResult = await pool.query(moduleStatsQuery, values)

    // 按用户统计
    const userStatsQuery = `
      SELECT username, COUNT(*) as count
      FROM operation_logs
      ${whereClause}
      GROUP BY username
      ORDER BY count DESC
      LIMIT 10
    `
    const userStatsResult = await pool.query(userStatsQuery, values)

    return {
      total: parseInt(totalResult.rows[0].count),
      success: parseInt(successResult.rows[0].count),
      failed: parseInt(failedResult.rows[0].count),
      avgDuration: parseFloat(avgDurationResult.rows[0].avg) || 0,
      moduleStats: moduleStatsResult.rows,
      userStats: userStatsResult.rows,
    }
  }
}

module.exports = new OperationLogModel()
