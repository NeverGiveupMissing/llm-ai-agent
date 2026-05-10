// 说明：用户数据模型 - 管理用户的创建、查询、更新
// 已迁移到若依（RuoYi）风格 sys_user 表
// 表名：sys_user（用户信息表）

const { pool } = require('../../config/db')

class UserModel {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据（下划线格式）
   * @param {string} userData.user_name - 用户名 (varchar(30), NOT NULL, UNIQUE)
   * @param {string} userData.nick_name - 昵称 (varchar(30), NOT NULL)
   * @param {string} userData.user_type - 用户类型 (varchar(2), DEFAULT '00')
   * @param {string} userData.email - 邮箱 (varchar(50), DEFAULT '')
   * @param {string} userData.phonenumber - 手机号 (varchar(11), DEFAULT '')
   * @param {string} userData.sex - 性别 (character(1), DEFAULT '0', 0男 1女 2未知)
   * @param {string} userData.avatar - 头像 (varchar(200), DEFAULT '')
   * @param {string} userData.password - 密码 (varchar(100), NOT NULL)
   * @param {string} userData.status - 状态 (character(1), DEFAULT '0', 0正常 1停用)
   * @param {string} userData.create_by - 创建者 (varchar(64), DEFAULT '')
   * @param {string} userData.remark - 备注 (varchar(500))
   * @returns {Object} 创建的用户对象（下划线格式）
   * @property {number} user_id - 用户ID (SERIAL, PRIMARY KEY)
   */
  async insertUser(userData) {
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
      userData.nick_name || userData.user_name,
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
   * 根据 user_name 查询用户
   * @param {string} userName - 用户名
   * @returns {Object|null} 用户对象（下划线格式）
   * @property {number} user_id - 用户ID
   * @property {string} user_name - 用户名
   * @property {string} nick_name - 昵称
   * @property {string} password - 密码
   * @property {string} status - 状态
   * @property {string} del_flag - 删除标志
   */
  async selectUserByUserName(userName) {
    const query = `
      SELECT 
        user_id, 
        user_name,
        nick_name, 
        password, 
        status, 
        del_flag
      FROM sys_user 
      WHERE user_name = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [userName])
    return result.rows[0] || null
  }

  /**
   * 根据 ID 查询用户
   * @param {number} user_id - 用户ID
   * @returns {Object|null} 用户对象（下划线格式）
   * @property {number} user_id - 用户ID (SERIAL, PRIMARY KEY)
   * @property {string} user_name - 用户名
   * @property {string} nick_name - 昵称
   * @property {string} user_type - 用户类型
   * @property {string} email - 邮箱
   * @property {string} phonenumber - 手机号
   * @property {string} sex - 性别
   * @property {string} avatar - 头像
   * @property {string} status - 状态
   * @property {string} del_flag - 删除标志 (character(1), DEFAULT '0', 0正常 1删除)
   * @property {string} login_ip - 最后登录IP (varchar(128), DEFAULT '')
   * @property {Date} login_date - 最后登录时间 (timestamp)
   * @property {Date} pwd_update_date - 密码最后更新时间 (timestamp)
   * @property {string} create_by - 创建者
   * @property {Date} create_time - 创建时间
   * @property {string} update_by - 更新者
   * @property {Date} update_time - 更新时间
   * @property {string} remark - 备注
   */
  async selectUserById(user_id) {
    const query = `
      SELECT 
        user_id, 
        user_name,
        nick_name, 
        user_type, 
        email, 
        phonenumber, 
        sex, 
        avatar, 
        status, 
        del_flag, 
        login_ip, 
        login_date,
        pwd_update_date, 
        create_by, 
        create_time, 
        update_by, 
        update_time, 
        remark
      FROM sys_user
      WHERE user_id = $1::int AND del_flag = '0'
    `
    const result = await pool.query(query, [user_id])
    // ✅ 返回数据库原始字段（下划线格式）
    return result.rows[0] || null
  }

  /**
   * 获取用户列表（分页）
   * @param {Object} params - 查询参数（下划线格式）
   * @param {number} params.page_num - 页码
   * @param {number} params.page_size - 每页数量
   * @param {string} params.status - 状态
   * @param {string} params.user_name - 用户名（模糊查询）
   * @param {string} params.phonenumber - 手机号（模糊查询）
   * @param {string} params.start_time - 开始时间
   * @param {string} params.end_time - 结束时间
   * @returns {Array} 用户列表（下划线格式，包含 roles 数组）
   */
  async list(params = {}) {
    const { page_num = 1, page_size = 20, status, user_name, phonenumber, start_time, end_time } = params
    const offset = (page_num - 1) * page_size

    let query = `
      SELECT 
        u.user_id, u.user_name, u.nick_name, u.user_type, u.email, u.phonenumber,
        u.sex, u.avatar, u.status, u.del_flag, u.login_ip, u.login_date,
        u.create_time, u.update_time, u.remark,
        json_agg(json_build_object(
          'role_id', r.role_id, 
          'role_name', r.role_name, 
          'role_key', r.role_key
        )) FILTER (WHERE r.role_id IS NOT NULL) as roles
      FROM sys_user u
      LEFT JOIN sys_user_role ur ON u.user_id = ur.user_id
      LEFT JOIN sys_role r ON ur.role_id = r.role_id
      WHERE u.del_flag = '0'
    `
    const values = []
    let idx = 1

    // ✅ 状态过滤（精确匹配）
    if (status) {
      query += ` AND u.status = $${idx++}`
      values.push(status)
    }

    // ✅ 用户名模糊匹配
    if (user_name) {
      query += ` AND u.user_name ILIKE $${idx++}`
      values.push(`%${user_name}%`)
    }

    // ✅ 手机号模糊匹配
    if (phonenumber) {
      query += ` AND u.phonenumber ILIKE $${idx++}`
      values.push(`%${phonenumber}%`)
    }

    // ✅ 时间范围处理
    if (start_time) {
      query += ` AND u.create_time >= $${idx++}`
      // 如果是数字类型（毫秒时间戳），转换为日期对象
      const beginDate = typeof start_time === 'number' ? new Date(start_time) : start_time
      values.push(beginDate)
    }

    if (end_time) {
      query += ` AND u.create_time <= $${idx++}`
      // 如果是数字类型（毫秒时间戳），转换为日期对象
      const endDate = typeof end_time === 'number' ? new Date(end_time) : end_time
      values.push(endDate)
    }

    query += ` GROUP BY u.user_id ORDER BY u.create_time DESC LIMIT $${idx++} OFFSET $${idx}`
    values.push(page_size, offset)

    const result = await pool.query(query, values)
    
    // ✅ 直接返回数据库原始字段（下划线格式）
    return result.rows
  }

  /**
   * 获取用户总数
   * @param {Object} params - 查询参数（下划线格式）
   */
  async count(params = {}) {
    const { status, user_name, phonenumber, start_time, end_time } = params

    let query = `SELECT COUNT(*) FROM sys_user WHERE del_flag = '0'`
    const values = []
    let idx = 1

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    if (user_name) {
      query += ` AND user_name ILIKE $${idx++}`
      values.push(`%${user_name}%`)
    }

    if (phonenumber) {
      query += ` AND phonenumber ILIKE $${idx++}`
      values.push(`%${phonenumber}%`)
    }

    if (start_time) {
      query += ` AND create_time >= $${idx++}`
      // 如果是数字类型（毫秒时间戳），转换为日期对象
      const beginDate = typeof start_time === 'number' ? new Date(start_time) : start_time
      values.push(beginDate)
    }

    if (end_time) {
      query += ` AND create_time <= $${idx++}`
      // 如果是数字类型（毫秒时间戳），转换为日期对象
      const endDate = typeof end_time === 'number' ? new Date(end_time) : end_time
      values.push(endDate)
    }

    const result = await pool.query(query, values)
    return parseInt(result.rows[0].count)
  }

  /**
   * 更新用户信息
   */
  async updateUser(user_id, updates) {
    const fields = []
    const values = []
    let idx = 1

    const fieldMap = {
      email: 'email',
      avatar: 'avatar',
      nick_name: 'nick_name',
      phonenumber: 'phonenumber',
      sex: 'sex',
      remark: 'remark',
      status: 'status',
      password: 'password',
      login_date: 'login_date',
      update_by: 'update_by',
    }

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = $${idx++}`)
        values.push(updates[key])
      }
    }

    if (fields.length === 0) {
      return await this.selectUserById(user_id)
    }

    fields.push(`update_time = NOW()`)
    values.push(user_id)

    const query = `
      UPDATE sys_user
      SET ${fields.join(', ')}
      WHERE user_id = $${idx} AND del_flag = '0'
      RETURNING 
        user_id,
        user_name,
        nick_name,
        status,
        update_time
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUserById(user_id, updateBy = '') {
    const query = `
      UPDATE sys_user 
      SET del_flag = '2', update_time = NOW(), update_by = $2
      WHERE user_id = $1::int AND del_flag = '0'
    `
    const result = await pool.query(query, [user_id, updateBy])
    return result.rowCount > 0
  }

  /**
   * 更新用户状态（启用/禁用）
   */
  async updateStatus(user_id, status) {
    const query = `
      UPDATE sys_user 
      SET status = $1, update_time = NOW()
      WHERE user_id = $2 AND del_flag = '0'
      RETURNING user_id, user_name, status
    `
    const result = await pool.query(query, [status, user_id])
    return result.rows[0] || null
  }

  /**
   * 获取用户的所有角色
   * @param {number} user_id - 用户ID
   * @returns {Array} 角色列表（下划线格式）
   */
  async getUserRoles(user_id) {
    const query = `
      SELECT r.role_id, r.role_name, r.role_key, r.remark as description
      FROM sys_role r
      INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1::int
        AND r.del_flag = '0'
        AND r.status = '0'
    `
    const result = await pool.query(query, [user_id])
    // ✅ 直接返回数据库原始字段（下划线格式）
    return result.rows
  }
}

module.exports = new UserModel()
