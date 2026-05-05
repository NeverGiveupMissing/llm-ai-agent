/**
 * 若依（RuoYi）风格数据模型层
 * 完全使用整型主键（BIGSERIAL），废弃 UUID
 * 所有查询结果直接返回数据库原始字段（下划线格式）
 */

const { pool } = require('../../config/db')

// =====================================================
// 用户模型 (SysUser)
// =====================================================
class UserModel {
  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>}
   */
  async list(params = {}) {
    const { userName, nickName, status, deptId } = params
    
    let query = `
      SELECT 
        user_id, user_name, nick_name, user_type, email, phonenumber,
        sex, avatar, status, del_flag, login_ip, login_date,
        pwd_update_date, create_by, create_time, update_by, update_time, remark
      FROM sys_user
      WHERE del_flag = '0'
    `
    const values = []
    let idx = 1

    if (userName) {
      query += ` AND user_name ILIKE $${idx++}`
      values.push(`%${userName}%`)
    }
    if (nickName) {
      query += ` AND nick_name ILIKE $${idx++}`
      values.push(`%${nickName}%`)
    }
    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }
    if (deptId) {
      query += ` AND dept_id = $${idx++}`
      values.push(deptId)
    }

    query += ` ORDER BY user_id ASC`

    const result = await pool.query(query, values)
    return toCamelCaseArray(result.rows)
  }

  /**
   * 根据ID获取用户详情
   * @param {number} user_id 
   * @returns {Promise<Object|null>}
   */
  async getById(user_id) {
    const query = `
      SELECT 
        user_id, user_name, nick_name, user_type, email, phonenumber,
        sex, avatar, status, del_flag, login_ip, login_date,
        pwd_update_date, create_by, create_time, update_by, update_time, remark
      FROM sys_user
      WHERE user_id = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [user_id])
    return result.rows[0] || null
  }

  /**
   * 根据用户名获取用户（用于登录）
   * @param {string} userName 
   * @returns {Promise<Object|null>}
   */
  async getByUserName(userName) {
    const query = `
      SELECT 
        user_id, user_name, nick_name, password, status, del_flag
      FROM sys_user
      WHERE user_name = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [userName])
    return result.rows[0] || null
  }

  /**
   * 创建用户
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  async create(userData) {
    const query = `
      INSERT INTO sys_user (
        user_name, nick_name, user_type, email, phonenumber, sex, avatar,
        password, status, create_by, remark
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `
    const result = await pool.query(query, [
      userData.user_name,
      userData.nick_name,
      userData.user_type || '00',
      userData.email || '',
      userData.phonenumber || '',
      userData.sex || '0',
      userData.avatar || '',
      userData.password,
      userData.status || '0',
      userData.create_by || '',
      userData.remark || '',
    ])
    return result.rows[0]
  }

  /**
   * 更新用户
   * @param {number} user_id 
   * @param {Object} updates 
   * @returns {Promise<Object|null>}
   */
  async update(user_id, updates) {
    const fields = []
    const values = []
    let idx = 1

    const fieldMap = {
      nick_name: 'nick_name',
      email: 'email',
      phonenumber: 'phonenumber',
      sex: 'sex',
      avatar: 'avatar',
      status: 'status',
      remark: 'remark',
      update_by: 'update_by',
    }

    for (const [dbKey, _] of Object.entries(fieldMap)) {
      if (updates[dbKey] !== undefined) {
        fields.push(`${dbKey} = $${idx++}`)
        values.push(updates[dbKey])
      }
    }

    if (fields.length === 0) {
      return await this.getById(user_id)
    }

    values.push(user_id)
    const query = `
      UPDATE sys_user 
      SET ${fields.join(', ')}
      WHERE user_id = $${idx}
      RETURNING *
    `
    
    const result = await pool.query(query, values)
    return toCamelCase(result.rows[0]) || null
  }

  /**
   * 删除用户（软删除）
   * @param {number} user_id 
   * @returns {Promise<boolean>}
   */
  async delete(user_id) {
    const query = `
      UPDATE sys_user 
      SET del_flag = '2', update_time = NOW()
      WHERE user_id = $1
    `
    const result = await pool.query(query, [user_id])
    return result.rowCount > 0
  }

  /**
   * 重置密码
   * @param {number} user_id 
   * @param {string} newPassword 
   * @returns {Promise<boolean>}
   */
  async resetPassword(user_id, newPassword) {
    const query = `
      UPDATE sys_user 
      SET password = $1, pwd_update_date = NOW(), update_time = NOW()
      WHERE user_id = $2
    `
    const result = await pool.query(query, [newPassword, user_id])
    return result.rowCount > 0
  }
}

// =====================================================
// 角色模型 (SysRole)
// =====================================================
class RoleModel {
  /**
   * 获取角色列表
   * @param {Object} params 
   * @returns {Promise<Array>}
   */
  async list(params = {}) {
    const { roleName, roleKey, status } = params
    
    let query = `
      SELECT 
        role_id, role_name, role_key, role_sort, data_scope,
        menu_check_strictly, dept_check_strictly, status, del_flag,
        create_by, create_time, update_by, update_time, remark
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

    query += ` ORDER BY role_sort ASC, role_id ASC`

    const result = await pool.query(query, values)
    return toCamelCaseArray(result.rows)
  }

  /**
   * 根据ID获取角色详情
   * @param {number} roleId 
   * @returns {Promise<Object|null>}
   */
  async getById(roleId) {
    const query = `
      SELECT * FROM sys_role
      WHERE role_id = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [roleId])
    return toCamelCase(result.rows[0]) || null
  }

  /**
   * 创建角色
   * @param {Object} roleData 
   * @returns {Promise<Object>}
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
    return toCamelCase(result.rows[0])
  }

  /**
   * 更新角色
   * @param {number} roleId 
   * @param {Object} updates 
   * @returns {Promise<Object|null>}
   */
  async update(roleId, updates) {
    const fields = []
    const values = []
    let idx = 1

    const fieldMap = {
      roleName: 'role_name',
      roleKey: 'role_key',
      roleSort: 'role_sort',
      dataScope: 'data_scope',
      status: 'status',
      remark: 'remark',
      updateBy: 'update_by',
    }

    for (const [camelKey, dbKey] of Object.entries(fieldMap)) {
      if (updates[camelKey] !== undefined) {
        fields.push(`${dbKey} = $${idx++}`)
        values.push(updates[camelKey])
      }
    }

    if (fields.length === 0) {
      return await this.getById(roleId)
    }

    values.push(roleId)
    const query = `
      UPDATE sys_role 
      SET ${fields.join(', ')}
      WHERE role_id = $${idx}
      RETURNING *
    `
    
    const result = await pool.query(query, values)
    return toCamelCase(result.rows[0]) || null
  }

  /**
   * 删除角色（软删除）
   * @param {number} roleId 
   * @returns {Promise<boolean>}
   */
  async delete(roleId) {
    const query = `
      UPDATE sys_role 
      SET del_flag = '2', update_time = NOW()
      WHERE role_id = $1
    `
    const result = await pool.query(query, [roleId])
    return result.rowCount > 0
  }

  /**
   * 检查角色是否被用户使用
   * @param {number} roleId 
   * @returns {Promise<number>} 使用该角色的用户数量
   */
  async countUsersByRole(roleId) {
    const query = `
      SELECT COUNT(*) as count
      FROM sys_user_role
      WHERE role_id = $1
    `
    const result = await pool.query(query, [roleId])
    return parseInt(result.rows[0].count)
  }
}

// =====================================================
// 用户角色关联模型 (SysUserRole)
// =====================================================
class UserRoleModel {
  /**
   * 为用户分配角色（事务操作）
   * @param {number} user_id 
   * @param {number[]} roleIds 
   * @returns {Promise<boolean>}
   */
  async assignRoles(user_id, roleIds) {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // 删除用户现有的所有角色
      await client.query('DELETE FROM sys_user_role WHERE user_id = $1', [user_id])
      
      // 插入新的角色关联
      if (roleIds && roleIds.length > 0) {
        const values = roleIds.map((roleId, idx) => `($1, $${idx + 2})`).join(',')
        const params = [user_id, ...roleIds]
        await client.query(
          `INSERT INTO sys_user_role (user_id, role_id) VALUES ${values}`,
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
   * 获取用户的角色列表
   * @param {number} user_id 
   * @returns {Promise<Array>}
   */
  async getUserRoles(user_id) {
    const query = `
      SELECT r.role_id, r.role_name, r.role_key, r.role_sort, r.status
      FROM sys_role r
      INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1
        AND r.del_flag = '0'
        AND r.status = '0'
      ORDER BY r.role_sort ASC
    `
    const result = await pool.query(query, [user_id])
    return toCamelCaseArray(result.rows)
  }
}

// =====================================================
// 角色菜单关联模型 (SysRoleMenu)
// =====================================================
class RoleMenuModel {
  /**
   * 为角色分配菜单权限（事务操作）
   * @param {number} roleId 
   * @param {number[]} menuIds 
   * @returns {Promise<boolean>}
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
   * 获取角色的菜单ID列表
   * @param {number} roleId 
   * @returns {Promise<number[]>}
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
}

// =====================================================
// 导出所有模型
// =====================================================
module.exports = {
  UserModel: new UserModel(),
  RoleModel: new RoleModel(),
  UserRoleModel: new UserRoleModel(),
  RoleMenuModel: new RoleMenuModel(),
  toCamelCase,
  toCamelCaseArray,
}
