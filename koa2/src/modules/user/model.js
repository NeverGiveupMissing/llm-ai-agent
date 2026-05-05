// 说明：用户数据模型 - 管理用户的创建、查询、更新
// 已迁移到若依（RuoYi）风格 sys_user 表

const { pool } = require('../../config/db')

class UserModel {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据（驼峰格式）
   * @param {string} userData.userName - 用户名
   * @param {string} userData.nickName - 昵称
   * @param {string} userData.userType - 用户类型
   * @param {string} userData.email - 邮箱
   * @param {string} userData.phonenumber - 手机号
   * @param {string} userData.sex - 性别（0男 1女 2未知）
   * @param {string} userData.avatar - 头像
   * @param {string} userData.password - 密码
   * @param {string} userData.status - 状态（0正常 1停用）
   * @param {string} userData.createBy - 创建者
   * @param {string} userData.remark - 备注
   * @returns {Object} 创建的用户对象（驼峰格式）
   */
  async insertUser(userData) {
    const query = `
      INSERT INTO sys_user (
        user_name, nick_name, user_type, email, phonenumber, sex, avatar,
        password, status, create_by, remark
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING 
        user_id,
        user_name
        nick_name
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
   * 根据 userName 查询用户
   * @param {string} userName - 用户名（驼峰格式）
   * @returns {Object|null} 用户对象（驼峰格式）
   */
  async selectUserByUserName(userName) {
    const query = `
      SELECT 
        user_id, 
        user_name
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
   * @returns {Object|null} 用户对象（驼峰格式，包含 user_id, userName, nickName, userType, email, phonenumber, sex, avatar, status, delFlag, loginIp, loginDate, pwdUpdateDate, createBy, createTime, updateBy, updateTime, remark）
   */
  async selectUserById(user_id) {
    const query = `
      SELECT 
        user_id, 
        user_name
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
      WHERE user_id = $1 AND del_flag = '0'
    `
    const result = await pool.query(query, [user_id])
    // ✅ 返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows[0] || null
  }

  /**
   * 获取用户列表（分页）
   * @param {Object} params - 查询参数（驼峰格式）
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.status - 状态
   * @param {string} params.keyword - 关键词（用户名/昵称/邮箱）
   * @param {string} params.phone - 手机号
   * @param {string} params.beginTime - 开始时间
   * @param {string} params.endTime - 结束时间
   * @returns {Array} 用户列表（驼峰格式，包含 roles 数组）
   */
  async list(params = {}) {
    const { page = 1, limit = 20, status, keyword, phone, beginTime, endTime } = params
    const offset = (page - 1) * limit

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

    if (status) {
      query += ` AND u.status = $${idx++}`
      values.push(status)
    }

    if (keyword) {
      query += ` AND (u.user_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.nick_name ILIKE $${idx})`
      values.push(`%${keyword}%`)
    }

    if (phone) {
      query += ` AND u.phonenumber ILIKE $${idx}`
      values.push(`%${phone}%`)
    }

    if (beginTime) {
      query += ` AND u.create_time >= $${idx++}`
      values.push(new Date(beginTime))
    }

    if (endTime) {
      query += ` AND u.create_time <= $${idx++}`
      values.push(new Date(endTime))
    }

    query += ` GROUP BY u.user_id ORDER BY u.create_time DESC LIMIT $${idx++} OFFSET $${idx}`
    values.push(limit, offset)

    const result = await pool.query(query, values)
    
    // ✅ 直接返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows
  }

  /**
   * 获取用户总数
   */
  async count(params = {}) {
    const { status, keyword, phone, beginTime, endTime } = params

    let query = `SELECT COUNT(*) FROM sys_user WHERE del_flag = '0'`
    const values = []
    let idx = 1

    if (status) {
      query += ` AND status = $${idx++}`
      values.push(status)
    }

    if (keyword) {
      query += ` AND (user_name ILIKE $${idx} OR email ILIKE $${idx} OR nick_name ILIKE $${idx})`
      values.push(`%${keyword}%`)
    }

    if (phone) {
      query += ` AND phonenumber ILIKE $${idx}`
      values.push(`%${phone}%`)
    }

    if (beginTime) {
      query += ` AND create_time >= $${idx++}`
      values.push(new Date(beginTime))
    }

    if (endTime) {
      query += ` AND create_time <= $${idx++}`
      values.push(new Date(endTime))
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
        user_name
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
      WHERE user_id = $1 AND del_flag = '0'
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
   * @returns {Array} 角色列表（驼峰格式，经过 response-transformer 转换）
   */
  async getUserRoles(user_id) {
    const query = `
      SELECT r.role_id, r.role_name, r.role_key, r.remark as description
      FROM sys_role r
      INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1
        AND r.del_flag = '0'
        AND r.status = '0'
    `
    const result = await pool.query(query, [user_id])
    // ✅ 直接返回数据库原始字段（下划线格式），经过 response-transformer 中间件后前端收到的是驼峰格式
    return result.rows
  }
}

module.exports = new UserModel()
