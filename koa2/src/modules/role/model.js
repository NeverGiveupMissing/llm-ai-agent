// 说明：角色数据模型 - 管理角色的创建、查询、权限分配
// 已迁移到若依（RuoYi）风格 sys_role 表
// 表名：sys_role（角色信息表）
//
// 相关关联表：
// - sys_user_role（用户和角色关联表）：user_id (bigint) + role_id (bigint)
// - sys_role_menu（角色和菜单关联表）：role_id (bigint) + menu_id (bigint)
// - sys_role_interface（角色和接口权限关联表）：role_id (bigint) + interface_id (bigint)

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

    query += ` ORDER BY update_time DESC, role_id DESC LIMIT $${idx++} OFFSET $${idx}`
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
   * ✅ 修复：自动包含所有父菜单ID，确保菜单树正确显示
   */
  async assignMenus(role_id, menu_ids) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // ✅ 修复：自动收集所有选中菜单的父菜单ID
      let allMenuIds = [...new Set(menu_ids)] // 先去重
      const parentIds = []
      
      // 递归获取所有父菜单ID
      const collectParentIds = async (ids) => {
        if (ids.length === 0) return
        
        const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(',')
        const query = `
          SELECT menu_id, parent_id
          FROM sys_menu
          WHERE menu_id IN (${placeholders})
            AND parent_id != 0
            AND parent_id IS NOT NULL
        `
        const result = await client.query(query, ids)
        
        for (const row of result.rows) {
          if (!allMenuIds.includes(row.parent_id)) {
            parentIds.push(row.parent_id)
            allMenuIds.push(row.parent_id)
          }
        }
        
        // 继续递归获取更上层的父菜单
        const newParentIds = result.rows.map(r => r.parent_id)
        await collectParentIds(newParentIds)
      }
      
      await collectParentIds([...menu_ids])
      
      console.log(`🔧 [菜单分配] 角色 ${role_id}：选中 ${menu_ids.length} 个菜单，包含父菜单后共 ${allMenuIds.length} 个`)
      if (parentIds.length > 0) {
        console.log(`   自动添加父菜单ID: ${parentIds.join(', ')}`)
      }

      // 删除角色现有的所有菜单权限
      console.log(`🗑️ [菜单分配] 正在删除角色 ${role_id} 的旧菜单权限...`)
      const deleteResult = await client.query('DELETE FROM sys_role_menu WHERE role_id = $1', [role_id])
      console.log(`   已删除 ${deleteResult.rowCount} 条旧权限记录`)

      // 插入新的菜单权限关联（包含所有父菜单）
      // ✅ 修复：使用 ON CONFLICT 避免联合主键冲突
      if (allMenuIds && allMenuIds.length > 0) {
        console.log(`💾 [菜单分配] 开始插入 ${allMenuIds.length} 条新权限记录...`)
        const values = allMenuIds
          .map((menu_id, idx) => `($1, $${idx + 2})`)
          .join(',')
        const params = [role_id, ...allMenuIds]
        
        // ✅ 明确指定冲突约束名，防止误伤其他约束
        await client.query(
          `INSERT INTO sys_role_menu (role_id, menu_id) VALUES ${values} ON CONFLICT ON CONSTRAINT sys_role_menu_pkey DO NOTHING`,
          params,
        )
        console.log(`✅ [菜单分配] 插入完成`)
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
   * 获取角色的所有菜单ID（用于编辑回显）
   * @param {number} role_id - 角色ID
   * @returns {Array} 菜单ID数组
   * @description 只返回用户直接勾选的叶子节点，不返回父菜单
   *              Naive UI Tree 会根据子节点自动显示父节点为“半选”状态
   *              注意：只过滤目录节点（'M'），不过滤菜单节点（'C'）和按钮节点（'F'）
   */
  async getRolemenu_ids(role_id) {
    const query = `
      SELECT menu_id
      FROM sys_role_menu
      WHERE role_id = $1
      ORDER BY menu_id ASC
    `
    const result = await pool.query(query, [role_id])
    let allMenuIds = result.rows.map((row) => row.menu_id)
    
    // ✅ 只过滤目录节点（menu_type = 'M'），不过滤菜单节点（'C'）和按钮节点（'F'）
    // 原理：目录节点（'M'）是纯粹的容器，菜单节点（'C'）是用户实际勾选的菜单项
    // 如果某个目录ID是其他菜单的 parent_id，说明它是目录，应该过滤掉
    const parentIdsQuery = `
      SELECT DISTINCT m.menu_id
      FROM sys_menu m
      WHERE m.menu_id IN (${allMenuIds.map((_, idx) => `$${idx + 1}`).join(',')})
        AND m.menu_type = 'M'
        AND EXISTS (
          SELECT 1 FROM sys_menu child 
          WHERE child.parent_id = m.menu_id
        )
    `
    
    if (allMenuIds.length > 0) {
      const parentIdsResult = await pool.query(parentIdsQuery, allMenuIds)
      const directoryIds = parentIdsResult.rows.map(row => row.menu_id)
      
      // 只过滤目录节点ID，保留菜单节点和按钮节点
      allMenuIds = allMenuIds.filter(id => !directoryIds.includes(id))
      
      console.log(` [菜单回显] 角色 ${role_id}：数据库中有 ${result.rows.length} 个菜单，过滤目录节点后返回 ${allMenuIds.length} 个叶子节点（菜单+按钮）`)
      if (directoryIds.length > 0) {
        console.log(`   过滤掉的目录节点ID: ${directoryIds.join(', ')}`)
      }
    }
    
    return allMenuIds
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
   * @param {Array} interface_ids - 接口ID数组
   * @returns {boolean} 是否成功
   * @description 通过 sys_role_interface 表关联角色和接口权限
   */
  async assignApis(role_id, interface_ids) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 删除角色现有的所有接口权限
      await client.query('DELETE FROM sys_role_interface WHERE role_id = $1', [role_id])

      // 插入新的接口权限关联
      if (interface_ids && interface_ids.length > 0) {
        const values = interface_ids
          .map((_, idx) => `($1, $${idx + 2})`)
          .join(',')
        const params = [role_id, ...interface_ids]
        
        await client.query(
          `INSERT INTO sys_role_interface (role_id, interface_id) VALUES ${values} ON CONFLICT ON CONSTRAINT sys_role_interface_pkey DO NOTHING`,
          params,
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
   * 获取角色的所有接口ID列表
   * @param {number} role_id - 角色ID
   * @returns {Array} 返回接口ID数组
   * @description 从 sys_role_interface 表查询
   */
  async getRoleApiPaths(role_id) {
    const query = `
      SELECT ri.interface_id, i.interface_url, i.interface_name, i.interface_method
      FROM sys_role_interface ri
      INNER JOIN sys_interface i ON ri.interface_id = i.interface_id
      WHERE ri.role_id = $1 AND i.status = '0'
      ORDER BY i.interface_url ASC
    `
    const result = await pool.query(query, [role_id])
    return result.rows.map((row) => ({
      interface_id: row.interface_id,
      interface_url: row.interface_url,
      interface_name: row.interface_name,
      interface_method: row.interface_method,
    }))
  }

  /**
   * 为角色分配按钮权限（覆盖更新）
   * @param {number} role_id - 角色ID
   * @param {Array} button_ids - 按钮ID数组
   * @returns {boolean} 是否成功
   * @description 通过 sys_role_button 表关联角色和按钮权限
   */
  async assignButtons(role_id, button_ids) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 删除角色现有的所有按钮权限
      console.log(`️ [按钮分配] 正在删除角色 ${role_id} 的旧按钮权限...`)
      const deleteResult = await client.query('DELETE FROM sys_role_button WHERE role_id = $1', [role_id])
      console.log(`   已删除 ${deleteResult.rowCount} 条旧权限记录`)

      // 插入新的按钮权限关联
      if (button_ids && button_ids.length > 0) {
        console.log(`💾 [按钮分配] 开始插入 ${button_ids.length} 条新权限记录...`)
        const values = button_ids
          .map((button_id, idx) => `($1, $${idx + 2})`)
          .join(',')
        const params = [role_id, ...button_ids]
        
        await client.query(
          `INSERT INTO sys_role_button (role_id, button_id) VALUES ${values} ON CONFLICT ON CONSTRAINT sys_role_button_pkey DO NOTHING`,
          params,
        )
        console.log(`✅ [按钮分配] 插入完成`)
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
   * 获取角色的所有按钮ID（用于编辑回显）
   * @param {number} role_id - 角色ID
   * @returns {Array} 按钮ID数组
   */
  async getRoleButtonIds(role_id) {
    const query = `
      SELECT button_id
      FROM sys_role_button
      WHERE role_id = $1
      ORDER BY button_id ASC
    `
    const result = await pool.query(query, [role_id])
    const buttonIds = result.rows.map((row) => row.button_id)
    console.log(`[按钮回显] 角色 ${role_id}：数据库中有 ${buttonIds.length} 个按钮权限`)
    return buttonIds
  }

  /**
   * 获取角色的所有权限（聚合查询）
   * @param {number} role_id - 角色ID
   * @returns {Object} 包含 menus、buttons、apis 的聚合对象
   */
  async getRoleAllPermissions(role_id) {
    // 1. 查询菜单权限
    const menuQuery = `
      SELECT menu_id
      FROM sys_role_menu
      WHERE role_id = $1
      ORDER BY menu_id ASC
    `
    const menuResult = await pool.query(menuQuery, [role_id])
    const menus = menuResult.rows.map((row) => row.menu_id)

    // 2. 查询按钮权限
    const buttonQuery = `
      SELECT button_id
      FROM sys_role_button
      WHERE role_id = $1
      ORDER BY button_id ASC
    `
    const buttonResult = await pool.query(buttonQuery, [role_id])
    const buttons = buttonResult.rows.map((row) => row.button_id)

    // 3. 查询接口权限
    const apiQuery = `
      SELECT interface_id
      FROM sys_role_interface
      WHERE role_id = $1
      ORDER BY interface_id ASC
    `
    const apiResult = await pool.query(apiQuery, [role_id])
    const apis = apiResult.rows.map((row) => row.interface_id)

    console.log(`[权限聚合] 角色 ${role_id}：菜单 ${menus.length} 个，按钮 ${buttons.length} 个，接口 ${apis.length} 个`)

    return {
      menus,
      buttons,
      apis,
    }
  }
}

module.exports = new RoleModel()
