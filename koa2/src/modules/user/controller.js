// 说明：用户控制器 - 处理用户的 HTTP 请求

const userService = require('./service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')
const { authMiddleware } = require('../../middlewares/auth.middleware')

class UserController {
  /**
   * 用户注册
   */
  register = asyncHandler(async (ctx) => {
    const { username, password, email, avatarUrl, nickname, phone, bio } = ctx.request.body

    if (!username || !password) {
      throw new BadRequestError('用户名和密码不能为空')
    }

    const result = await userService.createUser({
      username,
      password,
      email,
      avatarUrl,
      nickname,
      phone,
      bio,
    })

    ctx.success(result.data, result.message)
  })

  /**
   * 用户登录
   */
  login = asyncHandler(async (ctx) => {
    const { username, password } = ctx.request.body

    if (!username || !password) {
      throw new BadRequestError('用户名和密码不能为空')
    }

    const result = await userService.login(username, password)

    ctx.success(result.data, result.message)
  })

  /**
   * 获取当前用户信息（需要认证）
   */
  getCurrentUser = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId

    if (!userId) {
      throw new UnauthorizedError('未登录')
    }

    const result = await userService.getUserDetail(userId)

    ctx.success(result.data)
  })

  /**
   * 修改当前用户密码（需要认证）
   */
  changePassword = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId
    const { oldPassword, newPassword } = ctx.request.body

    if (!userId) {
      throw new UnauthorizedError('未登录')
    }

    if (!oldPassword || !newPassword) {
      throw new BadRequestError('旧密码和新密码不能为空')
    }

    const result = await userService.changePassword(userId, oldPassword, newPassword)

    ctx.success(null, result.message)
  })

  /**
   * 更新当前用户信息（需要认证）
   */
  updateCurrentUser = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId
    const updates = ctx.request.body

    if (!userId) {
      throw new UnauthorizedError('未登录')
    }

    // 不允许更新 username 和 password
    delete updates.username
    delete updates.password
    delete updates.password_hash

    const result = await userService.updateUser(userId, updates)

    ctx.success(result.data, result.message)
  })

  /**
   * 上传头像（需要认证）
   */
  uploadAvatar = asyncHandler(async (ctx) => {
    const userId = ctx.state.userId

    if (!userId) {
      throw new UnauthorizedError('未登录')
    }

    const file = ctx.request.files?.avatar
    if (!file) {
      throw new BadRequestError('请上传头像文件')
    }

    const result = await userService.uploadAvatar(userId, file)

    ctx.success(result.data, result.message)
  })

  /**
   * 获取用户列表
   */
  listUsers = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      limit: parseInt(ctx.query.limit) || 20,
      status: ctx.query.status,
      keyword: ctx.query.keyword,
    }

    const result = await userService.listUsers(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(
      result.data,
      result.total,
      result.page,
      result.limit
    )
  })

  /**
   * 获取用户详情
   */
  getUserDetail = asyncHandler(async (ctx) => {
    const { userId } = ctx.params

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    const result = await userService.getUserDetail(userId)

    ctx.success(result.data)
  })

  /**
   * 更新用户信息
   */
  updateUser = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const updates = ctx.request.body

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    const result = await userService.updateUser(userId, updates)

    ctx.success(result.data, result.message)
  })

  /**
   * 删除用户（软删除）
   */
  deleteUser = asyncHandler(async (ctx) => {
    const { userId } = ctx.params

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    // 不允许删除自己
    if (userId === ctx.state.userId) {
      throw new BadRequestError('不能删除自己的账号')
    }

    const result = await userService.deleteUser(userId)

    ctx.success(null, result.message)
  })

  /**
   * 更新用户状态（启用/禁用）
   */
  updateUserStatus = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const { status } = ctx.request.body

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    if (!status) {
      throw new BadRequestError('缺少 status 参数')
    }

    // 不允许修改自己的状态
    if (userId === ctx.state.userId) {
      throw new BadRequestError('不能修改自己的账号状态')
    }

    const result = await userService.updateUserStatus(userId, status)

    ctx.success(result.data, result.message)
  })

  /**
   * 为用户分配角色
   */
  assignRole = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const { roleId } = ctx.request.body

    if (!userId || !roleId) {
      throw new BadRequestError('缺少 userId 或 roleId 参数')
    }

    const result = await userService.assignRole(userId, roleId)

    ctx.success(null, result.message)
  })

  /**
   * 移除用户角色
   */
  removeRole = asyncHandler(async (ctx) => {
    const { userId, roleId } = ctx.params

    if (!userId || !roleId) {
      throw new BadRequestError('缺少 userId 或 roleId 参数')
    }

    const result = await userService.removeRole(userId, roleId)

    ctx.success(null, result.message)
  })

  /**
   * 重置用户密码
   */
  resetPassword = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const { newPassword } = ctx.request.body

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    if (!newPassword) {
      throw new BadRequestError('缺少 newPassword 参数')
    }

    const result = await userService.resetPassword(userId, newPassword)

    ctx.success(null, result.message)
  })

  /**
   * 批量为用户分配角色
   */
  assignRoles = asyncHandler(async (ctx) => {
    const { userId } = ctx.params
    const { roleIds } = ctx.request.body

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      throw new BadRequestError('缺少 roleIds 参数或参数格式错误')
    }

    const result = await userService.assignRoles(userId, roleIds)

    ctx.success(null, result.message)
  })
}

module.exports = new UserController()
