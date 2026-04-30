// 说明：用户控制器 - 处理用户的 HTTP 请求

const userService = require('../../services/userService')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')
const { authMiddleware } = require('../../middlewares/auth.middleware')

class UserController {
  /**
   * 用户注册
   */
  register = asyncHandler(async (ctx) => {
    const { username, password, email, avatarUrl } = ctx.request.body

    if (!username || !password) {
      throw new BadRequestError('用户名和密码不能为空')
    }

    const result = await userService.createUser({
      username,
      password,
      email,
      avatarUrl,
    })

    ctx.body = ResponseUtil.success(result.data, result.message)
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

    ctx.body = ResponseUtil.success(result.data, result.message)
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

    ctx.body = ResponseUtil.success(result.data)
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

    ctx.body = ResponseUtil.success(result)
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

    ctx.body = ResponseUtil.success(result.data)
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

    ctx.body = ResponseUtil.success(result.data, result.message)
  })

  /**
   * 删除用户
   */
  deleteUser = asyncHandler(async (ctx) => {
    const { userId } = ctx.params

    if (!userId) {
      throw new BadRequestError('缺少 userId 参数')
    }

    const result = await userService.deleteUser(userId)

    ctx.body = ResponseUtil.success(null, result.message)
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

    ctx.body = ResponseUtil.success(null, result.message)
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

    ctx.body = ResponseUtil.success(null, result.message)
  })
}

module.exports = new UserController()
