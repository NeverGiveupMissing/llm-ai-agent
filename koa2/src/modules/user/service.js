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
    const existingUser = await userModel.getByUsername(userData.username)
    if (existingUser) {
      throw new Error('用户名已存在')
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(userData.password, 10)

    // 创建用户
    const user = await userModel.create({
      username: userData.username,
      passwordHash,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      nickname: userData.nickname,
      phone: userData.phone,
      bio: userData.bio,
    })

    // 默认分配普通用户角色
    const defaultRole = await roleModel.getByName('user')
    if (defaultRole) {
      await userModel.assignRole(user.id, defaultRole.id)
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        nickname: user.nickname,
        phone: user.phone,
        bio: user.bio,
      },
      message: '用户创建成功',
    }
  }

  /**
   * 用户登录
   */
  async login(username, password) {
    const user = await userModel.getByUsername(username)
    if (!user) {
      throw new Error('用户名或密码错误')
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error('用户名或密码错误')
    }

    // 检查用户状态
    if (user.status === 'banned') {
      throw new Error('账号已被禁用')
    }
    if (user.status === 'inactive') {
      throw new Error('账号未激活')
    }

    // 更新最后登录时间
    await userModel.update(user.id, { lastLoginAt: new Date() })

    // 获取用户角色
    const roles = await userModel.getUserRoles(user.id)

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    })

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        roles: roles.map((r) => r.name),
        token, // 返回 JWT Token
      },
      message: '登录成功',
    }
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(userId) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    const roles = await userModel.getUserRoles(userId)

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
  async changePassword(userId, oldPassword, newPassword) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash)
    if (!isValidPassword) {
      throw new Error('旧密码错误')
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      throw new Error('新密码长度不能少于6位')
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await userModel.update(userId, { passwordHash })

    return {
      success: true,
      message: '密码修改成功',
    }
  }

  /**
   * 上传头像
   */
  async uploadAvatar(userId, file) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('只支持 JPG、PNG、GIF、WEBP 格式的图片')
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('图片大小不能超过 5MB')
    }

    // 生成文件名
    const ext = file.originalFilename.split('.').pop()
    const filename = `avatar_${userId}_${Date.now()}.${ext}`
    
    // 保存路径
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars')
    const filepath = path.join(uploadDir, filename)

    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // 移动文件
    await fs.promises.rename(file.filepath, filepath)

    // 生成访问URL
    const avatarUrl = `/uploads/avatars/${filename}`

    // 更新数据库
    await userModel.update(userId, { avatar: avatarUrl })

    // 删除旧头像文件（如果存在）
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldFile = path.join(process.cwd(), user.avatar)
      if (fs.existsSync(oldFile)) {
        try {
          await fs.promises.unlink(oldFile)
        } catch (error) {
          console.error('删除旧头像失败:', error)
        }
      }
    }

    return {
      success: true,
      message: '头像上传成功',
      data: {
        avatar: avatarUrl,
      },
    }
  }

  /**
   * 获取用户列表
   */
  async listUsers(params) {
    const users = await userModel.list(params)
    const total = await userModel.count(params)

    // 为每个用户附加角色信息
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await userModel.getUserRoles(user.id)
        return {
          ...user,
          roles,
        }
      }),
    )

    return {
      success: true,
      data: usersWithRoles,
      total,
      page: params.page || 1,
      limit: params.limit || 20,
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, updates) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 如果更新密码，需要加密
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10)
      delete updates.password
    }

    const updatedUser = await userModel.update(userId, updates)

    return {
      success: true,
      data: updatedUser,
      message: '用户更新成功',
    }
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(userId) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查是否已删除
    if (user.deleted_at) {
      throw new Error('用户已被删除')
    }

    const deleted = await userModel.delete(userId)
    if (!deleted) {
      throw new Error('删除失败')
    }

    return {
      success: true,
      message: '用户删除成功',
    }
  }

  /**
   * 更新用户状态（启用/禁用）
   */
  async updateUserStatus(userId, status) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 检查是否已删除
    if (user.deleted_at) {
      throw new Error('用户已被删除，无法修改状态')
    }

    // 验证状态值
    const validStatuses = ['active', 'inactive', 'banned']
    if (!validStatuses.includes(status)) {
      throw new Error('无效的状态值')
    }

    // 不允许禁用自己
    // 这个检查应该在 controller 层做

    const updatedUser = await userModel.updateStatus(userId, status)
    if (!updatedUser) {
      throw new Error('状态更新失败')
    }

    const statusText = {
      active: '启用',
      inactive: '禁用',
      banned: '封禁',
    }

    return {
      success: true,
      message: `用户已${statusText[status]}`,
      data: updatedUser,
    }
  }

  /**
   * 为用户分配角色
   */
  async assignRole(userId, roleId) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    const role = await roleModel.getById(roleId)
    if (!role) {
      throw new Error('角色不存在')
    }

    await userModel.assignRole(userId, roleId)

    return {
      success: true,
      message: '角色分配成功',
    }
  }

  /**
   * 移除用户角色
   */
  async removeRole(userId, roleId) {
    const removed = await userModel.removeRole(userId, roleId)
    if (!removed) {
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
  async resetPassword(userId, newPassword) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // 更新密码
    await userModel.update(userId, { passwordHash })

    return {
      success: true,
      message: '密码重置成功',
    }
  }

  /**
   * 批量为用户分配角色
   */
  async assignRoles(userId, roleIds) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    // 验证所有角色是否存在
    for (const roleId of roleIds) {
      const role = await roleModel.getById(roleId)
      if (!role) {
        throw new Error(`角色 ${roleId} 不存在`)
      }
    }

    // 批量分配角色
    const client = await require('../../config/db').pool.connect()
    try {
      await client.query('BEGIN')
      
      for (const roleId of roleIds) {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, roleId]
        )
      }
      
      await client.query('COMMIT')
      
      return {
        success: true,
        message: `成功分配 ${roleIds.length} 个角色`,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

module.exports = new UserService()
