// 说明：用户控制器 - 处理用户的 HTTP 请求

const userService = require('./service')
const ResponseUtil = require('../../utils/response')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, UnauthorizedError } = require('../../utils/app-error')
const { authMiddleware } = require('../../middlewares/auth.middleware')

class UserController {
  /**
   * 用户注册
   */
  register = asyncHandler(async (ctx) => {
    console.log('[DEBUG] Controller 接收到的 body:', JSON.stringify(ctx.request.body))
    
    const {
      user_name,
      password,
      nick_name,
      email,
      phonenumber,
      bio,
      remark,
      avatar,
      user_type,
    } = ctx.request.body

    console.log('[DEBUG] 解构后的 user_name:', user_name)
    console.log('[DEBUG] 解构后的 password:', password)

    if (!user_name || !password) {
      throw new BadRequestError('用户名和密码不能为空')
    }

    const result = await userService.createUser({
      user_name,
      password,
      nick_name,
      email,
      phonenumber,
      avatar,
      user_type: user_type || '00',
      create_by: ctx.state.user_name || 'system',
      remark: remark || bio,
    })

    ctx.success(result.data, result.message)
  })

  /**
   * 用户登录
   */
  login = asyncHandler(async (ctx) => {
    const { user_name, password } = ctx.request.body

    if (!user_name) {
      throw new BadRequestError('用户名和密码不能为空')
    }

    const result = await userService.login(user_name, password, ctx)

    ctx.success(result.data, result.message)
  })

  /**
   * 获取当前用户信息（需要认证）
   */
  getCurrentUser = asyncHandler(async (ctx) => {
    const user_id = ctx.state.user_id

    if (!user_id) {
      throw new UnauthorizedError('未登录')
    }

    const result = await userService.getUserDetail(user_id)

    ctx.success(result.data)
  })

  /**
   * 修改当前用户密码（需要认证）
   */
  changePassword = asyncHandler(async (ctx) => {
    const user_id = ctx.state.user_id
    const { old_password, new_password } = ctx.request.body

    if (!user_id) {
      throw new UnauthorizedError('未登录')
    }

    if (!old_password || !new_password) {
      throw new BadRequestError('旧密码和新密码不能为空')
    }

    const result = await userService.changePassword(user_id, old_password, new_password)

    ctx.success(null, result.message)
  })

  /**
   * 更新当前用户信息（需要认证）
   */
  updateCurrentUser = asyncHandler(async (ctx) => {
    const user_id = ctx.state.user_id
    const updates = ctx.request.body

    if (!user_id) {
      throw new UnauthorizedError('未登录')
    }

    // 不允许更新 user_name 和 password
    delete updates.user_name
    delete updates.password
    delete updates.password_hash

    // 清理 avatar 中的换行符和空格
    if (updates.avatar) {
      updates.avatar = updates.avatar.trim().replace(/[\r\n]/g, '')
      console.log('🔧 清理后的 avatar:', updates.avatar)
    }

    const result = await userService.updateUser(user_id, updates)

    ctx.success(result.data, result.message)
  })

  /**
   * 获取用户列表
   */
  listUsers = asyncHandler(async (ctx) => {
    const params = {
      page: parseInt(ctx.query.page) || 1,
      page_size: parseInt(ctx.query.page_size) || 10,
      status: ctx.query.status,
      keyword: ctx.query.keyword,
      phone: ctx.query.phonenumber,
      begin_time: ctx.query.begin_time,
      end_time: ctx.query.end_time,
    }

    const result = await userService.listUsers(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page, result.page_size)
  })

  /**
   * 获取用户详情
   */
  getUserDetail = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params

    if (!user_id) {
      throw new BadRequestError('缺少 user_id 参数')
    }

    const result = await userService.getUserDetail(user_id)

    ctx.success(result.data)
  })

  /**
   * 更新用户信息
   */
  updateUser = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params
    const updates = ctx.request.body

    if (!user_id) {
      throw new BadRequestError('缺少 user_id 参数')
    }

    // 超级管理员不允许修改（假设 admin 用户的 user_id 为 1）
    if (parseInt(user_id) === 1) {
      return ctx.forbidden('超级管理员不允许修改')
    }

    const result = await userService.updateUser(user_id, updates)

    ctx.success(result.data, result.message)
  })

  /**
   * 删除用户（软删除）
   */
  deleteUser = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params

    if (!user_id) {
      throw new BadRequestError('缺少 user_id 参数')
    }

    // 超级管理员不允许删除（假设 admin 用户的 user_id 为 1）
    if (parseInt(user_id) === 1) {
      return ctx.forbidden('超级管理员不允许删除')
    }

    // 不允许删除自己
    if (parseInt(user_id) === parseInt(ctx.state.user_id)) {
      throw new BadRequestError('不能删除自己的账号')
    }

    const result = await userService.deleteUser(user_id, ctx.state.user_name)

    ctx.success(null, result.message)
  })

  /**
   * 批量删除用户
   */
  batchDeleteUsers = asyncHandler(async (ctx) => {
    const { ids } = ctx.request.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('缺少用户 ID 列表')
    }

    // 不允许删除自己
    const current_user_id = parseInt(ctx.state.user_id)
    if (ids.map((id) => parseInt(id)).includes(current_user_id)) {
      throw new BadRequestError('不能删除自己的账号')
    }

    // 不允许删除 admin 用户（假设 ID 为 1）
    if (ids.map((id) => parseInt(id)).includes(1)) {
      throw new BadRequestError('不能删除管理员账号')
    }

    const result = await userService.batchDeleteUsers(ids, ctx.state.user_name)

    ctx.success(null, result.message)
  })

  /**
   * 更新用户状态（启用/禁用）
   */
  updateUserStatus = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params
    const { status } = ctx.request.body

    if (!user_id) {
      throw new BadRequestError('缺少 user_id 参数')
    }

    // 超级管理员不允许修改状态（假设 admin 用户的 user_id 为 1）
    if (parseInt(user_id) === 1) {
      return ctx.forbidden('超级管理员不允许修改状态')
    }

    if (!status) {
      throw new BadRequestError('缺少 status 参数')
    }

    // 不允许修改自己的状态
    if (parseInt(user_id) === parseInt(ctx.state.user_id)) {
      throw new BadRequestError('不能修改自己的账号状态')
    }

    const result = await userService.updateUserStatus(user_id, status)

    ctx.success(result.data, result.message)
  })

  /**
   * 为用户分配角色
   */
  assignRole = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params
    const { role_id } = ctx.request.body

    if (!user_id || !role_id) {
      throw new BadRequestError('缺少 user_id 或 role_id 参数')
    }

    const result = await userService.assignRole(user_id, role_id)

    ctx.success(null, result.message)
  })

  /**
   * 移除用户角色
   */
  removeRole = asyncHandler(async (ctx) => {
    const { user_id, role_id } = ctx.params

    if (!user_id || !role_id) {
      throw new BadRequestError('缺少 user_id 或 role_id 参数')
    }

    const result = await userService.removeRole(user_id, role_id)

    ctx.success(null, result.message)
  })

  /**
   * 重置用户密码
   */
  resetPassword = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params
    const { new_password } = ctx.request.body

    if (!user_id) {
      throw new BadRequestError('缺少 user_id 参数')
    }

    if (!new_password) {
      throw new BadRequestError('缺少 new_password 参数')
    }

    const result = await userService.resetPassword(user_id, new_password)

    ctx.success(null, result.message)
  })

  /**
   * 批量为用户分配角色
   */
  assignRoles = asyncHandler(async (ctx) => {
    const { user_id } = ctx.params
    const { role_ids } = ctx.request.body

    if (!user_id) {
      throw new BadRequestError('缺少 user_id 参数')
    }

    if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      throw new BadRequestError('缺少 role_ids 参数或参数格式错误')
    }

    const result = await userService.assignRoles(user_id, role_ids)

    ctx.success(null, result.message)
  })
}

module.exports = new UserController()
