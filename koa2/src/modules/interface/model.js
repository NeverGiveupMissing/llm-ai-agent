/**
 * 接口管理数据模型
 */

const { pool } = require('../../config/db')

class InterfaceModel {
  /**
   * 获取接口列表（分页）
   * @param {Object} params - 查询参数（下划线格式）
   * @returns {Promise<{list: Array, total: number}>}
   */
  async list(params = {}) {
    const { api_name, api_url, api_method, status, page = 1, page_size = 10 } = params

    // 强制类型转换，防止注入
    const pageNum = parseInt(page) || 1
    const page_sizeNum = parseInt(page_size) || 10

    // 构建 WHERE 条件
    const conditions = []
    const values = []
    let idx = 1

    // ✅ 接口名称模糊匹配
    if (api_name) {
      conditions.push(`api_name ILIKE $${idx++}`)
      values.push(`%${api_name}%`)
    }

    // ✅ 接口路径模糊匹配
    if (api_url) {
      conditions.push(`api_url ILIKE $${idx++}`)
      values.push(`%${api_url}%`)
    }

    // ✅ 请求方式精确匹配
    if (api_method) {
      conditions.push(`api_method = $${idx++}`)
      values.push(api_method)
    }

    // ✅ 状态过滤（精确匹配）
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
        api_id,
        api_name,
        api_url,
        api_method,
        api_category,
        status,
        remark,
        create_time,
        update_time
      FROM sys_interface
      ${whereClause}
      ORDER BY api_id DESC
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
      SELECT * FROM sys_interface WHERE api_id = $1
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
        api_name, api_url, api_method, api_category, status, remark
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING *
    `
    const result = await pool.query(query, [
      interfaceData.api_name,
      interfaceData.api_url,
      interfaceData.api_method || 'GET',
      interfaceData.api_category,
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

    if (updates.api_name !== undefined) {
      fields.push(`api_name = $${idx++}`)
      values.push(updates.api_name)
    }
    if (updates.api_url !== undefined) {
      fields.push(`api_url = $${idx++}`)
      values.push(updates.api_url)
    }
    if (updates.api_method !== undefined) {
      fields.push(`api_method = $${idx++}`)
      values.push(updates.api_method)
    }
    if (updates.api_category !== undefined) {
      fields.push(`api_category = $${idx++}`)
      values.push(updates.api_category)
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
      WHERE api_id = $${idx}
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
      DELETE FROM sys_interface WHERE api_id = $1 RETURNING api_id
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
      SELECT api_id, api_name, api_url, api_method, api_category
      FROM sys_interface
      WHERE status = '0'
      ORDER BY api_category ASC, api_url ASC
    `
    const result = await pool.query(query)
    return result.rows
  }
}

module.exports = new InterfaceModel()
