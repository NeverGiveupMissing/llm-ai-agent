/**
 * 接口管理控制器
 */

const interfaceService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')

class InterfaceController {
  /**
   * 获取接口列表（分页）
   */
  list = asyncHandler(async (ctx) => {
    const apiName = ctx.query.apiName
    const apiUrl = ctx.query.apiUrl
    const status = ctx.query.status
    const page = parseInt(ctx.query.page) || 1
    const page_size = parseInt(ctx.query.page_size) || 10

    const params = {
      api_name: apiName,
      api_url: apiUrl,
      status,
      page,
      page_size: page_size,
    }

    const result = await interfaceService.getInterfaceList(params)

    // 使用统一的分页响应方法（与用户管理保持一致）
    ctx.pageSuccess(result.data, result.total, result.page, result.limit)
  })

  /**
   * 获取接口详情
   */
  detail = asyncHandler(async (ctx) => {
    const { id } = ctx.params
    const interface_id = parseInt(id)

    if (!interface_id || isNaN(interface_id)) {
      throw new BadRequestError('接口ID无效')
    }

    const result = await interfaceService.getInterfaceDetail(interface_id)
    ctx.success(result.data)
  })

  /**
   * 创建接口
   */
  create = asyncHandler(async (ctx) => {
    const interfaceData = ctx.request.body

    const result = await interfaceService.createInterface(interfaceData)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新接口
   */
  update = asyncHandler(async (ctx) => {
    const { id } = ctx.params
    const interface_id = parseInt(id)

    if (!interface_id || isNaN(interface_id)) {
      throw new BadRequestError('接口ID无效')
    }

    const updates = ctx.request.body
    const result = await interfaceService.updateInterface(interface_id, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除接口
   */
  delete = asyncHandler(async (ctx) => {
    const { id } = ctx.params
    const interface_id = parseInt(id)

    if (!interface_id || isNaN(interface_id)) {
      throw new BadRequestError('接口ID无效')
    }

    const result = await interfaceService.deleteInterface(interface_id)
    ctx.success(null, result.message)
  })

  /**
   * 获取所有接口
   */
  all = asyncHandler(async (ctx) => {
    const result = await interfaceService.getAllInterfaces()
    ctx.success(result.data)
  })
}

module.exports = new InterfaceController()
