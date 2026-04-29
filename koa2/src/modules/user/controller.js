// 说明：用户控制器 - 处理用户的 HTTP 请求

const userService = require('../../services/userService')
const ResponseUtil = require('../../utils/response')

class UserController {
  /**
   * 用户注册
   */
  async register(ctx) {
    try {
      const { username, password, email, avatarUrl } = ctx.request.body

      if (!username || !password) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('用户名和密码不能为空')
        return
      }

      const result = await userService.createUser({
        username,
        password,
        email,
        avatarUrl,
      })

      ctx.status = 201
      ctx.body = ResponseUtil.success(result.data, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '用户注册失败')
    }
  }

  /**
   * 用户登录
   */
  async login(ctx) {
    try {
      const { username, password } = ctx.request.body

      if (!username || !password) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('用户名和密码不能为空')
        return
      }

      const result = await userService.login(username, password)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data, result.message)
    } catch (err) {
      ctx.status = 401
      ctx.body = ResponseUtil.error(err.message || '用户名或密码错误')
    }
  }

  /**
   * 获取用户列表
   */
  async listUsers(ctx) {
    try {
      const params = {
        page: parseInt(ctx.query.page) || 1,
        limit: parseInt(ctx.query.limit) || 20,
        status: ctx.query.status,
        keyword: ctx.query.keyword,
      }

      const result = await userService.listUsers(params)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取用户列表失败')
    }
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(ctx) {
    try {
      const { userId } = ctx.params

      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 参数')
        return
      }

      const result = await userService.getUserDetail(userId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '获取用户详情失败')
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(ctx) {
    try {
      const { userId } = ctx.params
      const updates = ctx.request.body

      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 参数')
        return
      }

      const result = await userService.updateUser(userId, updates)

      ctx.status = 200
      ctx.body = ResponseUtil.success(result.data, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '更新用户信息失败')
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(ctx) {
    try {
      const { userId } = ctx.params

      if (!userId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 参数')
        return
      }

      const result = await userService.deleteUser(userId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '删除用户失败')
    }
  }

  /**
   * 为用户分配角色
   */
  async assignRole(ctx) {
    try {
      const { userId } = ctx.params
      const { roleId } = ctx.request.body

      if (!userId || !roleId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 或 roleId 参数')
        return
      }

      const result = await userService.assignRole(userId, roleId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '分配角色失败')
    }
  }

  /**
   * 移除用户角色
   */
  async removeRole(ctx) {
    try {
      const { userId, roleId } = ctx.params

      if (!userId || !roleId) {
        ctx.status = 400
        ctx.body = ResponseUtil.error('缺少 userId 或 roleId 参数')
        return
      }

      const result = await userService.removeRole(userId, roleId)

      ctx.status = 200
      ctx.body = ResponseUtil.success(null, result.message)
    } catch (err) {
      ctx.status = 500
      ctx.body = ResponseUtil.serverError(err.message || '移除角色失败')
    }
  }
}

module.exports = new UserController()
