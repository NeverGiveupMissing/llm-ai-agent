// 说明：角色数据模型 - 管理角色的创建、查询、权限分配
// 已迁移到若依（RuoYi）风格 sys_role 表
// 表名：sys_role（角色信息表）
//
// 相关关联表：
// - sys_user_role（用户和角色关联表）：user_id (bigint) + role_id (bigint)
// - sys_role_menu（角色和菜单关联表）：role_id (bigint) + menu_id (bigint)
// - sys_role_api（角色和接口权限关联表）：role_id (bigint) + api_path (varchar(255)) + api_method (varchar(10))

const { pool } = require('../../config/db')

class RoleModel {
  /**
   * 创建新角色
   * @param {Object} roleData - 角色数据（下划线格式）
   * @param {string} roleData.roleName - 角色名称 (varchar(30), NOT NULL)
   * @param {string} roleData.roleKey - 角色标识 (varchar(100), NOT NULL, UNIQUE)
   * @param {number} roleData.roleSort - 显示排序 (integer, NOT NULL, DEFAULT 0)
   * @param {string} roleData.dataScope - 数据权限范围 (character(1), DEFAULT '1')
   * @param {string} roleData.status - 状态 (character(1), NOT NULL, DEFAULT '0', 0正常 1停用)
   * @param {string} roleData.createBy - 创建者 (varchar(64), DEFAULT '')
   * @param {string} roleData.remark - 备注 (varchar(500))
   */
  async create(roleData) {
    const query = `
      INSERT INTO sys_role (
        role_name, role_key, role_sort, data_scope, status, create_by, remark
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `
    const result = await pool.query(query, [
      roleData.roleName,
      roleData.roleKey,
      roleData.roleSort || 0,
      roleData.dataScope || '1',
      roleData.status || '0',
      roleData.createBy || '',
      roleData.remark || '',
    ])
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows[0]
  }

  /**
   * 根据角色名称查询角色
   * @param {string} roleName - 角色名称
   * @returns {Object|null} 角色对象（下划线格式）
   */
  async getByRoleName(roleName) {
    const query = `
      SELECT role_id, role_name, role_key, role_sort, data_scope, status, del_flag
      FROM sys_role 
      WHERE role_name = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [roleName])
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows[0] || null
  }

  /**
   * 根据 roleKey 查询角色
   * @param {string} roleKey - 角色标识
   * @returns {Object|null} 角色对象（下划线格式）
   */
  async getByRoleKey(roleKey) {
    const query = `
      SELECT role_id, role_name, role_key, role_sort, data_scope, status, del_flag
      FROM sys_role 
      WHERE role_key = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [roleKey])
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows[0] || null
  }

  /**
   * 根据 ID 查询角色
   * @param {number} role_id - 角色ID (SERIAL, PRIMARY KEY)
   * @returns {Object|null} 角色对象（下划线格式）
   */
  async getById(role_id) {
    const query = `
      SELECT 
        role_id, role_name, role_key, role_sort, data_scope,
        menu_check_strictly, dept_check_strictly, status, del_flag,
        create_by, create_time, update_by, update_time, remark
      FROM sys_role
      WHERE role_id = $1::int AND del_flag = '0'
    `
    const result = await pool.query(query, [role_id])
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows[0] || null
  }

  /**
   * 获取角色列表（分页）
   * @param {Object} params - 查询参数（下划线格式）
   * @param {number} params.page_num - 页码
   * @param {number} params.page_size - 每页数量
   * @param {string} params.role_name - 角色名称（模糊查询）
   * @param {string} params.role_key - 角色标识（模糊查询）
   * @param {string} params.status - 状态
   * @returns {Array} 角色列表（下划线格式）
   * @property {number} role_id - 角色ID
   * @property {string} role_name - 角色名称
   * @property {string} role_key - 角色标识
   * @property {number} role_sort - 显示排序
   * @property {string} data_scope - 数据权限范围
   * @property {number} menu_check_strictly - 菜单树选择项是否关联显示 (smallint, DEFAULT 1)
   * @property {number} dept_check_strictly - 部门树选择项是否关联显示 (smallint, DEFAULT 1)
   * @property {string} status - 状态 (0正常 1停用)
   * @property {string} del_flag - 删除标志 (character(1), DEFAULT '0', 0正常 1删除)
   * @property {Date} create_time - 创建时间
   * @property {Date} update_time - 更新时间
   * @property {string} remark - 备注
   */
  async list(params = {}) {
    const { page_num = 1, page_size = 20, role_name, role_key, status } = params
    const offset = (page_num - 1) * page_size

    let query = `
      SELECT 
        role_id, role_name, role_key, role_sort, data_scope,
        menu_check_strictly, dept_check_strictly, status, del_flag,
        create_time, update_time, remark
      FROM sys_role
      WHERE del_flag = '0'
    `
    const values = []
    let idx = 1

    // ✅ 角色名称模糊匹配
    if (role_name) {
      query += ` AND role_name ILIKE $${idx++}`
      values.push(`%${role_name}%`)
    }

    // ✅ 角色标识模糊匹配
    if (role_key) {
      query += ` AND role_key ILIKE $${idx++}`
      values.push(`%${role_key}%`)
    }

    // ✅ 状态过滤（精确匹配）
    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    query += ` ORDER BY role_sort ASC, role_id ASC LIMIT $${idx++} OFFSET $${idx}`
    values.push(page_size, offset)

    const result = await pool.query(query, values)
    // ✅ 直接返回数据库原始字段（下划线格式）
    return result.rows
  }

  /**
   * 获取角色总数
   * @param {Object} params - 查询参数（下划线格式）
   */
  async count(params = {}) {
    const { role_name, role_key, status } = params

    let query = `SELECT COUNT(*) FROM sys_role WHERE del_flag = '0'`
    const values = []
    let idx = 1

    if (role_name) {
      query += ` AND role_name ILIKE $${idx++}`
      values.push(`%${role_name}%`)
    }

    if (role_key) {
      query += ` AND role_key ILIKE $${idx++}`
      values.push(`%${role_key}%`)
    }

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    const result = await pool.query(query, values)
    return parseInt(result.rows[0].count)
  }

  /**
   * 更新角色信息
   * @param {number} role_id - 角色ID
   * @param {Object} updates - 更新数据（下划线格式）
   * @param {string} [updates.role_name] - 角色名称
   * @param {string} [updates.role_key] - 角色标识
   * @param {number} [updates.role_sort] - 显示排序
   * @param {string} [updates.data_scope] - 数据权限范围
   * @param {string} [updates.status] - 状态
   * @param {string} [updates.remark] - 备注
   * @param {string} [updates.update_by] - 更新者
   * @returns {Object} 更新后的角色对象（下划线格式）
   */
  async update(role_id, updates) {
    // 系统角色（admin）不允许修改 roleKey
    const role = await this.getById(role_id)
    if (role && role.roleKey === 'admin' && updates.roleKey) {
      throw new Error('超级管理员角色不允许修改权限标识')
    }

    const fields = []
    const values = []
    let idx = 1

    // 前端传入下划线格式，映射到数据库下划线字段
    const fieldMap = {
      role_name: 'role_name',
      role_key: 'role_key',
      role_sort: 'role_sort',
      data_scope: 'data_scope',
      status: 'status',
      remark: 'remark',
      update_by: 'update_by',
    }

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = $${idx++}`)
        values.push(updates[key])
      }
    }

    if (fields.length === 0) {
      return await this.getById(role_id)
    }

    fields.push(`update_time = NOW()`)
    values.push(role_id)

    const query = `
      UPDATE sys_role
      SET ${fields.join(', ')}
      WHERE role_id = $${idx} AND del_flag = '0'
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除角色（软删除）
   */
  async delete(role_id) {
    const role = await this.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }
    if (role.roleKey === 'admin') {
      throw new Error('超级管理员角色不允许删除')
    }

    // 检查是否有用户绑定该角色
    const userCountQuery = `
      SELECT COUNT(*) as count
      FROM sys_user_role
      WHERE role_id = $1
    `
    const userCountResult = await pool.query(userCountQuery, [role_id])
    const userCount = parseInt(userCountResult.rows[0].count)

    if (userCount > 0) {
      throw new Error(`该角色已被 ${userCount} 个用户使用，无法删除`)
    }

    // 软删除
    const query = `
      UPDATE sys_role 
      SET del_flag = '2', update_time = NOW()
      WHERE role_id = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [role_id])
    return result.rowCount > 0
  }

  /**
   * 更新角色状态（启用/禁用）
   */
  async updateStatus(role_id, status) {
    const role = await this.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    // 验证状态值
    if (!['0', '1'].includes(status)) {
      throw new Error('无效的状态值（0正常 1停用）')
    }

    const query = `
      UPDATE sys_role 
      SET status = $1, update_time = NOW()
      WHERE role_id = $2 AND del_flag = '0'
      RETURNING role_id, role_name, role_key, status
    `
    const result = await pool.query(query, [status, role_id])
    return result.rows[0] || null
  }

  /**
   * 为角色分配菜单权限
   */
  async assignMenus(role_id, menu_ids) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 删除角色现有的所有菜单权限
      await client.query('DELETE FROM sys_role_menu WHERE role_id = $1', [role_id])

      // 插入新的菜单权限关联
      if (menu_ids && menu_ids.length > 0) {
        const values = menu_ids.map((menu_id, idx) => `($1, $${idx + 2})`).join(',')
        const params = [role_id, ...menu_ids]
        await client.query(`INSERT INTO sys_role_menu (role_id, menu_id) VALUES ${values}`, params)
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
   * 获取角色的所有菜单ID
   * @param {number} role_id - 角色ID
   * @returns {Array} 菜单ID数组
   * @description 从 sys_role_menu 表查询
   */
  async getRolemenu_ids(role_id) {
    const query = `
      SELECT menu_id
      FROM sys_role_menu
      WHERE role_id = $1
      ORDER BY menu_id ASC
    `
    const result = await pool.query(query, [role_id])
    return result.rows.map((row) => row.menu_id)
  }

  /**
   * 获取角色的所有用户
   * @param {number} role_id - 角色ID
   * @param {Object} params - 查询参数
   * @param {number} params.page_num - 页码
   * @param {number} params.page_size - 每页数量
   * @returns {Object} 用户列表和总数
   * @description 通过 sys_user_role 表关联查询
   */
  async getRoleUsers(role_id, params = {}) {
    const { page_num = 1, page_size = 20 } = params
    const offset = (page_num - 1) * page_size

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) FROM sys_user_role WHERE role_id = $1
    `
    const countResult = await pool.query(countQuery, [role_id])
    const total = parseInt(countResult.rows[0].count)

    // 查询数据
    const query = `
      SELECT u.user_id, u.user_name, u.nick_name, u.email, u.status, u.create_time
      FROM sys_user u
      INNER JOIN sys_user_role ur ON u.user_id = ur.user_id
      WHERE ur.role_id = $1
        AND u.del_flag = '0'
      ORDER BY u.create_time DESC
      LIMIT $2 OFFSET $3
    `
    const result = await pool.query(query, [role_id, page_size, offset])

    // ✅ 直接返回数据库原始字段（下划线格式）
    return {
      list: result.rows,
      total,
    }
  }

  /**
   * 为角色分配接口权限（覆盖更新）
   * @param {number} role_id - 角色ID
   * @param {Array} apiPaths - 接口路径数组
   * @returns {boolean} 是否成功
   * @description 通过 sys_role_api 表关联角色和接口权限
   */
  async assignApis(role_id, apiPaths) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 删除角色现有的所有接口权限
      await client.query('DELETE FROM sys_role_api WHERE role_id = $1', [role_id])

      // 插入新的接口权限关联
      if (apiPaths && apiPaths.length > 0) {
        // apiPaths 格式: [{ path: '/api/xxx' }, ...]
        const values = []
        const placeholders = []
        let idx = 1

        apiPaths.forEach((api) => {
          placeholders.push(`($${idx}, $${idx + 1})`)
          values.push(role_id, api.path)
          idx += 2
        })

        await client.query(
          `INSERT INTO sys_role_api (role_id, api_path) VALUES ${placeholders.join(',')}`,
          values,
        )
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
   * 获取角色的所有接口权限路径列表
   * @param {number} role_id - 角色ID
   * @returns {Array} 返回接口路径数组
   * @description 从 sys_role_api 表查询
   */
  async getRoleApiPaths(role_id) {
    const query = `
      SELECT api_path
      FROM sys_role_api
      WHERE role_id = $1
      ORDER BY api_path ASC
    `
    const result = await pool.query(query, [role_id])
    return result.rows.map((row) => ({
      api_path: row.api_path,
      api_name: '', // ✅ 默认值（数据库表无 api_name 字段）
      method: 'GET', // ✅ 默认值（数据库表无 method 字段）
    }))
  }
}

module.exports = new RoleModel()
