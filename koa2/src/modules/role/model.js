// 说明：角色数据模型 - 管理角色的创建、查询、权限分配
// 已迁移到若依（RuoYi）风格 sys_role 表

const { pool } = require('../../config/db')

class RoleModel {
  /**
   * 创建新角色
   * @param {Object} roleData - 角色数据（驼峰格式）
   * @param {string} roleData.roleName - 角色名称
   * @param {string} roleData.roleKey - 角色标识
   * @param {number} roleData.roleSort - 显示排序
   * @param {string} roleData.dataScope - 数据权限范围
   * @param {string} roleData.status - 状态（0正常 1停用）
   * @param {string} roleData.createBy - 创建者
   * @param {string} roleData.remark - 备注
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
    // ✅ 返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows[0]
  }

  /**
   * 根据角色名称查询角色
   * @param {string} roleName - 角色名称（驼峰格式）
   * @returns {Object|null} 角色对象（驼峰格式）
   */
  async getByRoleName(roleName) {
    const query = `
      SELECT role_id, role_name, role_key, role_sort, data_scope, status, del_flag
      FROM sys_role 
      WHERE role_name = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [roleName])
    // ✅ 返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows[0] || null
  }

  /**
   * 根据 roleKey 查询角色
   * @param {string} roleKey - 角色标识（驼峰格式）
   * @returns {Object|null} 角色对象（驼峰格式）
   */
  async getByRoleKey(roleKey) {
    const query = `
      SELECT role_id, role_name, role_key, role_sort, data_scope, status, del_flag
      FROM sys_role 
      WHERE role_key = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [roleKey])
    // ✅ 返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows[0] || null
  }

  /**
   * 根据 ID 查询角色
   * @param {number} roleId - 角色ID
   * @returns {Object|null} 角色对象（驼峰格式，包含 roleId, roleName, roleKey, roleSort, dataScope, menuCheckStrictly, deptCheckStrictly, status, delFlag, createBy, createTime, updateBy, updateTime, remark）
   */
  async getById(roleId) {
    const query = `
      SELECT 
        role_id, role_name, role_key, role_sort, data_scope,
        menu_check_strictly, dept_check_strictly, status, del_flag,
        create_by, create_time, update_by, update_time, remark
      FROM sys_role
      WHERE role_id = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [roleId])
    // ✅ 返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows[0] || null
  }

  /**
   * 获取角色列表（分页）
   * @param {Object} params - 查询参数（驼峰格式）
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.roleName - 角色名称（模糊查询）
   * @param {string} params.roleKey - 角色标识（模糊查询）
   * @param {string} params.status - 状态
   * @returns {Array} 角色列表（驼峰格式）
   */
  async list(params = {}) {
    const { page = 1, limit = 20, roleName, roleKey, status } = params
    const offset = (page - 1) * limit

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

    if (roleName) {
      query += ` AND role_name ILIKE $${idx++}`
      values.push(`%${roleName}%`)
    }

    if (roleKey) {
      query += ` AND role_key ILIKE $${idx++}`
      values.push(`%${roleKey}%`)
    }

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    query += ` ORDER BY role_sort ASC, role_id ASC LIMIT $${idx++} OFFSET $${idx}`
    values.push(limit, offset)

    const result = await pool.query(query, values)
    // ✅ 返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows
  }

  /**
   * 获取角色总数
   */
  async count(params = {}) {
    const { roleName, roleKey, status } = params

    let query = `SELECT COUNT(*) FROM sys_role WHERE del_flag = '0'`
    const values = []
    let idx = 1

    if (roleName) {
      query += ` AND role_name ILIKE $${idx++}`
      values.push(`%${roleName}%`)
    }

    if (roleKey) {
      query += ` AND role_key ILIKE $${idx++}`
      values.push(`%${roleKey}%`)
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
   * @param {number} roleId - 角色ID
   * @param {Object} updates - 更新数据（驼峰格式）
   * @param {string} updates.roleName - 角色名称
   * @param {string} updates.roleKey - 角色标识
   * @param {number} updates.roleSort - 显示排序
   * @param {string} updates.dataScope - 数据权限范围
   * @param {string} updates.status - 状态
   * @param {string} updates.remark - 备注
   * @param {string} updates.updateBy - 更新者
   * @returns {Object} 更新后的角色对象（驼峰格式）
   */
  async update(roleId, updates) {
    // 系统角色（admin）不允许修改 roleKey
    const role = await this.getById(roleId)
    if (role && role.roleKey === 'admin' && updates.roleKey) {
      throw new Error('超级管理员角色不允许修改权限标识')
    }

    const fields = []
    const values = []
    let idx = 1

    // 前端传入驼峰格式，映射到数据库下划线字段
    const fieldMap = {
      roleName: 'role_name',
      roleKey: 'role_key',
      roleSort: 'role_sort',
      dataScope: 'data_scope',
      status: 'status',
      remark: 'remark',
      updateBy: 'update_by',
    }

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = $${idx++}`)
        values.push(updates[key])
      }
    }

    if (fields.length === 0) {
      return await this.getById(roleId)
    }

    fields.push(`update_time = NOW()`)
    values.push(roleId)

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
  async delete(roleId) {
    const role = await this.getById(roleId)
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
    const userCountResult = await pool.query(userCountQuery, [roleId])
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
    const result = await pool.query(query, [roleId])
    return result.rowCount > 0
  }

  /**
   * 更新角色状态（启用/禁用）
   */
  async updateStatus(roleId, status) {
    const role = await this.getById(roleId)
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
    const result = await pool.query(query, [status, roleId])
    return result.rows[0] || null
  }

  /**
   * 为角色分配菜单权限
   */
  async assignMenus(roleId, menuIds) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // 删除角色现有的所有菜单权限
      await client.query('DELETE FROM sys_role_menu WHERE role_id = $1', [roleId])
      
      // 插入新的菜单权限关联
      if (menuIds && menuIds.length > 0) {
        const values = menuIds.map((menuId, idx) => `($1, $${idx + 2})`).join(',')
        const params = [roleId, ...menuIds]
        await client.query(
          `INSERT INTO sys_role_menu (role_id, menu_id) VALUES ${values}`,
          params
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
   * 获取角色的所有菜单ID
   */
  async getRoleMenuIds(roleId) {
    const query = `
      SELECT menu_id
      FROM sys_role_menu
      WHERE role_id = $1
      ORDER BY menu_id ASC
    `
    const result = await pool.query(query, [roleId])
    return result.rows.map(row => row.menu_id)
  }

  /**
   * 获取角色的所有用户
   */
  async getRoleUsers(roleId, params = {}) {
    const { page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) FROM sys_user_role WHERE role_id = $1
    `
    const countResult = await pool.query(countQuery, [roleId])
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
    const result = await pool.query(query, [roleId, limit, offset])
    
    // ✅ 直接返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return {
      list: result.rows,
      total,
    }
  }
}

module.exports = new RoleModel()
