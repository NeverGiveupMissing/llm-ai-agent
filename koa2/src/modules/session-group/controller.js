/**
 * 会话分组控制器
 * 处理分组相关的 HTTP 请求
 */

const SessionGroupModel = require('./model')
const sessionModel = require('../session/model')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError, NotFoundError } = require('../../utils/app-error')

class SessionGroupController {
  /**
   * 获取用户的所有分组
   */
  static getGroups = asyncHandler(async (ctx) => {
    const userId = ctx.request.body.userId || ctx.request.query.userId
    
    if (!userId) {
      throw new BadRequestError('userId 不能为空')
    }

    const groups = await SessionGroupModel.list(userId)
    
    // 为每个分组添加会话数量
    const groupWithCount = await Promise.all(
      groups.map(async (group) => {
        const count = await SessionGroupModel.countSessions(group.id)
        return {
          ...group,
          session_count: count,
        }
      })
    )

    ctx.body = {
      code: 200,
      message: '', // 静默成功，不显示提示
      data: groupWithCount,
    }
  })

  /**
   * 创建分组
   */
  static createGroup = asyncHandler(async (ctx) => {
    const { name, icon, user_id } = ctx.request.body

    if (!name || !user_id) {
      throw new BadRequestError('分组名称和用户ID不能为空')
    }

    const group = await SessionGroupModel.create({
      name: name.trim(),
      icon: icon || null,
      user_id,
    })

    ctx.body = {
      code: 200,
      message: '创建成功',
      data: group,
    }
  })

  /**
   * 更新分组
   */
  static updateGroup = asyncHandler(async (ctx) => {
    const { id } = ctx.params
    const { name, icon } = ctx.request.body

    if (!name) {
      throw new BadRequestError('分组名称不能为空')
    }

    const group = await SessionGroupModel.findById(id)
    if (!group) {
      throw new NotFoundError('分组不存在')
    }

    const updated = await SessionGroupModel.update(id, { name, icon })

    ctx.body = {
      code: 200,
      message: '更新成功',
      data: updated,
    }
  })

  /**
   * 删除分组
   */
  static deleteGroup = asyncHandler(async (ctx) => {
    const { id } = ctx.params

    const group = await SessionGroupModel.findById(id)
    if (!group) {
      throw new NotFoundError('分组不存在')
    }

    // 统计分组下的会话数量
    const sessionCount = await SessionGroupModel.countSessions(id)

    // 删除分组（级联设置会话的 group_id 为 NULL）
    await SessionGroupModel.delete(id)

    ctx.body = {
      code: 200,
      message: '删除成功',
      data: {
        session_count: sessionCount,
      },
    }
  })

  /**
   * 移动会话到分组
   */
  static moveSessionToGroup = asyncHandler(async (ctx) => {
    const { sessionId } = ctx.params
    const { group_id } = ctx.request.body

    console.log('📦 [移动分组] 收到请求:', { sessionId, group_id, body: ctx.request.body })

    // 验证会话是否存在
    const session = await sessionModel.getById(sessionId)
    if (!session) {
      console.error('❌ [移动分组] 会话不存在:', sessionId)
      throw new NotFoundError('会话不存在')
    }

    // 处理 group_id：空字符串转为 null
    const finalGroupId = group_id === '' || group_id === undefined ? null : group_id

    // 如果指定了 group_id，验证分组是否存在
    if (finalGroupId) {
      const group = await SessionGroupModel.findById(finalGroupId)
      if (!group) {
        console.error('❌ [移动分组] 分组不存在:', finalGroupId)
        throw new NotFoundError('分组不存在')
      }
    }

    console.log('📝 [移动分组] 准备更新会话:', { sessionId, group_id: finalGroupId })

    // 更新会话的 group_id
    const updated = await sessionModel.update(sessionId, { group_id: finalGroupId })

    console.log('✅ [移动分组] 更新成功:', updated)

    ctx.body = {
      code: 200,
      message: '移动成功',
      data: updated,
    }
  })

  /**
   * 置顶/取消置顶分组
   */
  static pinGroup = asyncHandler(async (ctx) => {
    const { id } = ctx.params
  
    const group = await SessionGroupModel.findById(id)
    if (!group) {
      throw new NotFoundError('分组不存在')
    }
  
    const updated = await SessionGroupModel.pin(id)
  
    ctx.body = {
      code: 200,
      message: '操作成功',
      data: updated,
    }
  })
}

module.exports = SessionGroupController
