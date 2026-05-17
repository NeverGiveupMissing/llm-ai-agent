/**
 * 按钮数据模型 - 处理数据库操作
 * @description 管理 sys_button 表中的按钮权限数据，提供 CRUD 及按菜单ID查询功能
 * @author System
 * @date 2026-05-13
 */

const { pool } = require('../../config/db')

class ButtonModel {
  /**
   * 获取按钮列表（分页）
   * @param {Object} params - 查询参数（下划线格式）
   * @returns {Promise<{list: Array, total: number, page: number, page_size: number}>}
   */
  async list(params = {}) {
    const {
      button_id,
      button_name,
      parent_id,
      perms,
      status,
      show_location,
      page = 1,
      page_size = 10,
    } = params

    // 强制类型转换，防止注入
    const pageNum = parseInt(page) || 1
    const pageSizeNum = parseInt(page_size) || 10

    // 构建 WHERE 条件
    const conditions = []
    const values = []
    let idx = 1

    // 按钮ID精确匹配
    if (button_id) {
      conditions.push(`b.button_id = $${idx++}`)
      values.push(button_id)
    }

    // 按钮名称模糊匹配
    if (button_name) {
      conditions.push(`b.button_name ILIKE $${idx++}`)
      values.push(`%${button_name}%`)
    }

    // 父级菜单ID精确匹配（支持查询目录下所有子菜单的按钮）
    if (parent_id !== undefined && parent_id !== '') {
      if (parent_id === 0) {
        // ✅ 主类目：查询所有顶级菜单（parent_id=0）及其子菜单 + 顶级按钮（parent_id=0）
        const allMenusQuery = `
          WITH RECURSIVE menu_tree AS (
            SELECT menu_id, parent_id FROM sys_menu WHERE parent_id = 0
            UNION ALL
            SELECT m.menu_id, m.parent_id FROM sys_menu m
            INNER JOIN menu_tree mt ON m.parent_id = mt.menu_id
          )
          SELECT menu_id FROM menu_tree
        `
        const allMenusResult = await pool.query(allMenusQuery)
        const menuIds = allMenusResult.rows.map((row) => row.menu_id)

        console.log('[ButtonModel] 主类目查询 - 所有菜单 ID 列表:', menuIds)

        // 主类目需要同时包含：1. 所有菜单下的按钮  2. parent_id=0 的顶级按钮
        if (menuIds.length > 0) {
          const placeholders = menuIds.map((_, i) => `$${idx + i}::bigint`).join(',')
          conditions.push(`(b.parent_id IN (${placeholders}) OR b.parent_id = 0)`)
          values.push(...menuIds)
          idx += menuIds.length
        } else {
          // 如果没有找到菜单，只查询顶级按钮
          conditions.push(`b.parent_id = 0`)
        }
      } else {
        // ✅ 指定菜单：查询该菜单及其所有子菜单
        const menuIdsQuery = `
          WITH RECURSIVE menu_tree AS (
            SELECT menu_id FROM sys_menu WHERE menu_id = $${idx}::bigint
            UNION ALL
            SELECT m.menu_id FROM sys_menu m
            INNER JOIN menu_tree mt ON m.parent_id = mt.menu_id
          )
          SELECT menu_id FROM menu_tree
        `
        const menuIdsResult = await pool.query(menuIdsQuery, [parent_id])
        const menuIds = menuIdsResult.rows.map((row) => row.menu_id)
        console.log('[ButtonModel] 指定菜单查询 - 菜单树 ID 列表:', menuIds)

        if (menuIds.length > 0) {
          // 使用 IN 查询所有菜单的按钮
          const placeholders = menuIds.map((_, i) => `$${idx + i}::bigint`).join(',')
          conditions.push(`b.parent_id IN (${placeholders})`)
          values.push(...menuIds)
          idx += menuIds.length
        } else {
          // 如果没有找到菜单，返回空结果
          conditions.push('1=0')
        }
      }
    }

    // 权限标识模糊匹配
    if (perms) {
      conditions.push(`b.perms ILIKE $${idx++}`)
      values.push(`%${perms}%`)
    }

    // 状态过滤
    if (status !== undefined && status !== '') {
      conditions.push(`b.status = $${idx++}`)
      values.push(status)
    }

    // 展现位置过滤（支持模糊匹配，如搜索"0"匹配"0,1"）
    if (show_location !== undefined && show_location !== '') {
      conditions.push(`b.show_location LIKE $${idx++}`)
      values.push(`%${show_location}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // ✅ 调试日志：输出实际执行的 SQL 和参数
    console.log('[ButtonModel] 查询条件:', conditions)
    console.log('[ButtonModel] 查询参数:', values)

    // ✅ 调试：查询数据库中所有不同的 parent_id 分布
    const debugQuery =
      'SELECT parent_id, COUNT(*) as count FROM sys_button GROUP BY parent_id ORDER BY parent_id'
    const debugResult = await pool.query(debugQuery)
    console.log('[ButtonModel] 数据库按钮 parent_id 分布:', JSON.stringify(debugResult.rows))

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM sys_button b
      ${whereClause}
    `
    console.log('[ButtonModel] 计数 SQL:', countQuery)
    console.log('[ButtonModel] 计数参数:', values)
    const countResult = await pool.query(countQuery, values)
    const total = parseInt(countResult.rows[0].total)

    // 分页查询
    const offset = (pageNum - 1) * pageSizeNum
    const query = `
      SELECT 
        b.button_id,
        b.button_name,
        b.parent_id,
        b.order_num,
        b.perms,
        b.status,
        b.show_location,
        b.icon,
        b.remark,
        b.create_time,
        b.update_time,
        m.menu_name AS parent_menu_name,
        m.path AS parent_menu_path
      FROM sys_button b
      LEFT JOIN sys_menu m ON b.parent_id = m.menu_id
      ${whereClause}
      ORDER BY b.parent_id ASC, b.order_num ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `
    values.push(pageSizeNum, offset)

    const result = await pool.query(query, values)

    return {
      list: result.rows,
      total,
      page: pageNum,
      page_size: pageSizeNum,
    }
  }

  /**
   * 根据ID查询按钮详情
   * @param {number} button_id - 按钮ID
   * @returns {Promise<Object|null>}
   */
  async getById(button_id) {
    const query = `
      SELECT 
        b.button_id,
        b.button_name,
        b.parent_id,
        b.order_num,
        b.perms,
        b.status,
        b.show_location,
        b.icon,
        b.remark,
        b.create_time,
        b.update_time,
        m.menu_name AS parent_menu_name
      FROM sys_button b
      LEFT JOIN sys_menu m ON b.parent_id = m.menu_id
      WHERE b.button_id = $1
    `
    const result = await pool.query(query, [button_id])
    return result.rows[0] || null
  }

  /**
   * 创建按钮
   * @param {Object} data - 按钮数据
   * @returns {Promise<Object>}
   */
  async create(data) {
    const query = `
      INSERT INTO sys_button (
        button_name, parent_id, order_num, perms, status, show_location, icon, remark, create_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `
    const result = await pool.query(query, [
      data.button_name,
      data.parent_id || 0,
      data.order_num || 0,
      data.perms || null,
      data.status || '0',
      data.show_location || '1',
      data.icon || '#',
      data.remark || '',
      data.create_by || '',
    ])
    return result.rows[0]
  }

  /**
   * 更新按钮
   * @param {number} button_id - 按钮ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object|null>}
   */
  async update(button_id, updates) {
    const fields = []
    const values = []
    let idx = 1

    const dbFields = [
      'button_name',
      'parent_id',
      'order_num',
      'perms',
      'status',
      'show_location',
      'icon',
      'remark',
      'update_by',
    ]

    dbFields.forEach((field) => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${idx++}`)
        values.push(updates[field])
      }
    })

    if (fields.length === 0) {
      return this.getById(button_id)
    }

    fields.push(`update_time = CURRENT_TIMESTAMP`)
    values.push(button_id)

    const query = `
      UPDATE sys_button 
      SET ${fields.join(', ')} 
      WHERE button_id = $${idx}
      RETURNING *
    `
    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除按钮
   * @param {number} button_id - 按钮ID
   * @returns {Promise<boolean>}
   */
  async delete(button_id) {
    const query = `DELETE FROM sys_button WHERE button_id = $1`
    const result = await pool.query(query, [button_id])
    return result.rowCount > 0
  }

  /**
   * 批量删除按钮
   * @param {number[]} ids - 按钮ID数组
   * @returns {Promise<number>} 删除的数量
   */
  async batchDelete(ids) {
    const query = `DELETE FROM sys_button WHERE button_id = ANY($1::int[])`
    const result = await pool.query(query, [ids])
    return result.rowCount
  }

  /**
   * 根据菜单ID获取所有按钮
   * @param {number} menu_id - 菜单ID
   * @returns {Promise<Array>}
   */
  async getByMenuId(menu_id) {
    const query = `
      SELECT * FROM sys_button 
      WHERE parent_id = $1 AND status = '0'
      ORDER BY order_num ASC
    `
    const result = await pool.query(query, [menu_id])
    return result.rows
  }

  /**
   * 根据角色ID数组获取按钮权限列表
   * ✅ 从 sys_button.perms 查询按钮权限
   * @param {number[]} role_ids - 角色ID数组
   * @returns {Promise<Array>} 按钮权限列表
   */
  async getButtonsByRoleIds(role_ids) {
    if (!role_ids || role_ids.length === 0) {
      return []
    }

    const query = `
      SELECT DISTINCT b.*
      FROM sys_button b
      INNER JOIN sys_role_button srb ON b.button_id = srb.button_id
      WHERE srb.role_id = ANY($1::int[])
        AND b.status = '0'
      ORDER BY b.order_num ASC
    `
    const result = await pool.query(query, [role_ids])
    return result.rows
  }

  /**
   * 检查权限标识是否已存在
   * @param {string} perms - 权限标识
   * @param {number} excludeId - 排除的ID（编辑时使用）
   * @returns {Promise<boolean>}
   */
  async checkPermsExists(perms, excludeId = null) {
    let query = `SELECT COUNT(*) as count FROM sys_button WHERE perms = $1`
    const values = [perms]

    if (excludeId) {
      query += ` AND button_id != $2`
      values.push(excludeId)
    }

    const result = await pool.query(query, values)
    return parseInt(result.rows[0].count) > 0
  }
}

module.exports = new ButtonModel()
