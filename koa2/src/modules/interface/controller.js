/**
 * 接口管理控制器
 */

const interfaceService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')
const { exportToExcel } = require('../../utils/excel-exporter')

class InterfaceController {
  /**
   * 获取接口列表（分页）
   */
  list = asyncHandler(async (ctx) => {
    // 接收下划线命名参数（前后端统一使用下划线）
    const interface_name = ctx.query.interface_name
    const interface_url = ctx.query.interface_url
    const interface_method = ctx.query.interface_method
    const status = ctx.query.status
    const page_num = parseInt(ctx.query.page_num) || 1
    const page_size = parseInt(ctx.query.page_size) || 10

    const params = {
      interface_name,
      interface_url,
      interface_method,
      status,
      page: page_num,
      page_size,
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
    // 获取当前登录用户
    const createBy = ctx.state.user_name || 'admin'

    const result = await interfaceService.createInterface(interfaceData, createBy)
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
    // 获取当前登录用户
    const updateBy = ctx.state.user_name || 'admin'
    const result = await interfaceService.updateInterface(interface_id, updates, updateBy)
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

  /**
   * 导出接口数据为 Excel
   */
  exportInterfaces = asyncHandler(async (ctx) => {
    const params = {
      interface_name: ctx.query.interface_name,
      interface_url: ctx.query.interface_url,
      interface_method: ctx.query.interface_method,
      status: ctx.query.status,
      page: 1,
      page_size: 10000, // 导出所有数据
    }

    const result = await interfaceService.getInterfaceList(params)
    const interfaces = result.data || []

    // 定义表头
    const headers = [
      { header: '接口ID', key: 'interface_id', width: 10 },
      { header: '接口名称', key: 'interface_name', width: 25 },
      { header: '接口路径', key: 'interface_url', width: 30 },
      { header: '请求方法', key: 'interface_method', width: 12 },
      { header: '接口分类', key: 'interface_category', width: 15 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建人', key: 'create_by', width: 12 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '更新人', key: 'update_by', width: 12 },
      { header: '更新时间', key: 'update_time', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ]

    // 格式化数据
    const data = interfaces.map((api) => ({
      ...api,
      status: api.status === '0' ? '正常' : '停用',
      create_time: api.create_time
        ? new Date(api.create_time).toLocaleString('zh-CN')
        : '',
      update_time: api.update_time
        ? new Date(api.update_time).toLocaleString('zh-CN')
        : '',
    }))

    // 导出 Excel
    await exportToExcel(ctx, {
      filename: 'interface',
      sheetName: '接口列表',
      headers,
      data,
    })
  })
}

module.exports = new InterfaceController()
