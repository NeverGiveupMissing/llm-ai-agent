// 说明：用户业务逻辑 - 处理用户的创建、认证、角色管理

const userModel = require('../models/userModel')
const roleModel = require('../models/roleModel')
const bcrypt = require('bcrypt')

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

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        roles: roles.map((r) => r.name),
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
   * 删除用户
   */
  async deleteUser(userId) {
    const user = await userModel.getById(userId)
    if (!user) {
      throw new Error('用户不存在')
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
}

module.exports = new UserService()
