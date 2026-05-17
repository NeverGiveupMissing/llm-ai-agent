/**
 * 接口管理数据模型
 */

const { pool } = require('../../config/db')

class InterfaceModel {
  /**
   * 获取接口列表（分页）
   * @param {Object} params - 查询参数
   * @returns {Promise<{list: Array, total: number}>}
   */
  async list(params = {}) {
    const { interface_name, interface_url, status, page = 1, page_size = 10 } = params

    // 强制类型转换，防止注入
    const pageNum = parseInt(page) || 1
    const page_sizeNum = parseInt(page_size) || 10

    // 构建 WHERE 条件
    const conditions = []
    const values = []
    let idx = 1

    if (interface_name) {
      conditions.push(`interface_name ILIKE $${idx++}`)
      values.push(`%${interface_name}%`)
    }

    if (interface_url) {
      conditions.push(`interface_url ILIKE $${idx++}`)
      values.push(`%${interface_url}%`)
    }

    if (status !== undefined && status !== '') {
      conditions.push(`status = $${idx++}`)
      values.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM sys_interface ${whereClause}`
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].total)

    // 分页查询
    const offset = (pageNum - 1) * page_sizeNum
    const query = `
      SELECT 
        interface_id,
        interface_name,
        interface_url,
        interface_method,
        interface_category,
        status,
        remark,
        create_time,
        update_time
      FROM sys_interface
      ${whereClause}
      ORDER BY interface_id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `
    values.push(page_sizeNum, offset)

    const result = await pool.query(query, values)

    return {
      list: result.rows,
      total,
      page: pageNum,
      page_size: page_sizeNum,
    }
  }

  /**
   * 根据ID查询接口详情
   * @param {number} interface_id - 接口ID
   * @returns {Promise<Object|null>}
   */
  async getById(interface_id) {
    const query = `
      SELECT * FROM sys_interface WHERE interface_id = $1
    `
    const result = await pool.query(query, [interface_id])
    return result.rows[0] || null
  }

  /**
   * 创建接口
   * @param {Object} interfaceData - 接口数据
   * @returns {Promise<Object>}
   */
  async create(interfaceData) {
    const query = `
      INSERT INTO sys_interface (
        interface_name, interface_url, interface_method, interface_category, status, remark
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING *
    `
    const result = await pool.query(query, [
      interfaceData.interface_name,
      interfaceData.interface_url,
      interfaceData.interface_method || 'GET',
      interfaceData.interface_category,
      interfaceData.status || '0',
      interfaceData.remark || '',
    ])
    return result.rows[0]
  }

  /**
   * 更新接口
   * @param {number} interface_id - 接口ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object|null>}
   */
  async update(interface_id, updates) {
    const fields = []
    const values = []
    let idx = 1

    if (updates.interface_name !== undefined) {
      fields.push(`interface_name = $${idx++}`)
      values.push(updates.interface_name)
    }
    if (updates.interface_url !== undefined) {
      fields.push(`interface_url = $${idx++}`)
      values.push(updates.interface_url)
    }
    if (updates.interface_method !== undefined) {
      fields.push(`interface_method = $${idx++}`)
      values.push(updates.interface_method)
    }
    if (updates.interface_category !== undefined) {
      fields.push(`interface_category = $${idx++}`)
      values.push(updates.interface_category)
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`)
      values.push(updates.status)
    }
    if (updates.remark !== undefined) {
      fields.push(`remark = $${idx++}`)
      values.push(updates.remark)
    }

    if (fields.length === 0) {
      return await this.getById(interface_id)
    }

    fields.push(`update_time = NOW()`)
    values.push(interface_id)

    const query = `
      UPDATE sys_interface
      SET ${fields.join(', ')}
      WHERE interface_id = $${idx}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除接口
   * @param {number} interface_id - 接口ID
   * @returns {Promise<boolean>}
   */
  async delete(interface_id) {
    const query = `
      DELETE FROM sys_interface WHERE interface_id = $1 RETURNING interface_id
    `
    const result = await pool.query(query, [interface_id])
    return result.rows.length > 0
  }

  /**
   * 获取所有接口（不分页，用于下拉选择等）
   * @returns {Promise<Array>}
   */
  async all() {
    const query = `
      SELECT interface_id, interface_name, interface_url, interface_method, interface_category
      FROM sys_interface
      WHERE status = '0'
      ORDER BY interface_category ASC, interface_url ASC
    `
    const result = await pool.query(query)
    return result.rows
  }
}

module.exports = new InterfaceModel()
