/**
 * 角色控制器
 * 位置：koa2/src/modules/role/controller.js
 */

const roleService = require('./service')
const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')
const { exportToExcel } = require('../../utils/excel-exporter')

class RoleController {
  /**
   * 获取角色列表
   */
  listRoles = asyncHandler(async (ctx) => {
    const params = {
      page_num: parseInt(ctx.query.page_num) || 1,
      page_size: parseInt(ctx.query.page_size) || 10,
      role_name: ctx.query.role_name,
      role_key: ctx.query.role_key,
      status: ctx.query.status,
    }

    const result = await roleService.listRoles(params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page_num, result.page_size)
  })

  /**
   * 获取角色详情
   */
  getRoleDetail = asyncHandler(async (ctx) => {
    const role_id = ctx.params.role_id

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRoleDetail(role_id)
    ctx.success(result.data)
  })

  /**
   * 创建角色
   */
  createRole = asyncHandler(async (ctx) => {
    const { role_name, role_key, role_sort, data_scope, status, remark } = ctx.request.body

    if (!role_name || !role_key) {
      throw new BadRequestError('角色名称和角色标识不能为空')
    }

    const result = await roleService.createRole({
      roleName: role_name,
      roleKey: role_key,
      roleSort: role_sort || 0,
      dataScope: data_scope || '1',
      status: status || '0',
      createBy: ctx.state.user_name || 'system',
      remark: remark || '',
    })

    ctx.success(result.data, result.message)
  })

  /**
   * 更新角色
   */
  updateRole = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { role_name, role_key, role_sort, data_scope, status, remark } = ctx.request.body

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    // 构建更新对象，只包含传入的字段
    const updates = {}
    if (role_name !== undefined) updates.role_name = role_name
    if (role_key !== undefined) updates.role_key = role_key
    if (role_sort !== undefined) updates.role_sort = role_sort
    if (data_scope !== undefined) updates.data_scope = data_scope
    if (status !== undefined) updates.status = status
    if (remark !== undefined) updates.remark = remark
    updates.update_by = ctx.state.user_name || 'system'

    const result = await roleService.updateRole(role_id, updates)
    ctx.success(result.data, result.message)
  })

  /**
   * 更新角色状态
   */
  updateRoleStatus = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { status } = ctx.request.body

    if (isNaN(role_id) || !status) {
      throw new BadRequestError('缺少 role_id 或 status 参数')
    }

    const result = await roleService.updateRoleStatus(role_id, status)
    ctx.success(result.data, result.message)
  })

  /**
   * 删除角色
   */
  deleteRole = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    const result = await roleService.deleteRole(role_id)
    ctx.success(null, result.message)
  })

  /**
   * 批量删除角色
   */
  batchDeleteRoles = asyncHandler(async (ctx) => {
    const { role_ids } = ctx.request.body

    if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      throw new BadRequestError('缺少 role_ids 参数或参数格式错误')
    }

    const result = await roleService.batchDeleteRoles(role_ids)
    ctx.success(null, result.message)
  })

  /**
   * 为角色分配单个权限
   */
  assignPermission = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { permissionId } = ctx.request.body

    if (isNaN(role_id) || !permissionId) {
      throw new BadRequestError('缺少 role_id 或 permissionId 参数')
    }

    const result = await roleService.assignPermission(role_id, permissionId)
    ctx.success(result.data, result.message)
  })

  /**
   * 批量为角色分配权限
   */
  assignPermissions = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { permissionIds } = ctx.request.body

    if (isNaN(role_id) || !permissionIds) {
      throw new BadRequestError('缺少 role_id 或 permissionIds 参数')
    }

    const result = await roleService.assignPermissions(role_id, permissionIds)
    ctx.success(result.data, result.message)
  })

  /**
   * 移除角色权限
   */
  removePermission = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { permissionId } = ctx.params

    if (isNaN(role_id) || !permissionId) {
      throw new BadRequestError('缺少 role_id 或 permissionId 参数')
    }

    const result = await roleService.removePermission(role_id, permissionId)
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的所有权限
   */
  getRolePermissions = asyncHandler(async (ctx) => {
    const { role_id } = ctx.params

    if (!role_id) {
      throw new BadRequestError('缺少 role_id 参数')
    }

    const result = await roleService.getRolePermissions(role_id)
    ctx.success(result.data)
  })

  /**
   * 获取角色的所有用户
   */
  getRoleUsers = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const params = {
      page_num: parseInt(ctx.query.page_num) || 1,
      page_size: parseInt(ctx.query.page_size) || 10,
    }

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    const result = await roleService.getRoleUsers(role_id, params)

    // 使用统一的分页响应方法
    ctx.pageSuccess(result.data, result.total, result.page_num, result.page_size)
  })

  /**
   * 获取角色的菜单权限 ID 列表
   */
  getRolemenu_ids = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    const result = await roleService.getRolemenu_ids(role_id)
    ctx.success(result.data)
  })

  /**
   * 保存角色的菜单权限（覆盖更新）
   */
  saveRoleMenus = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { menu_ids } = ctx.request.body

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    if (!Array.isArray(menu_ids)) {
      throw new BadRequestError('menu_ids 必须为数组')
    }

    const result = await roleService.saveRoleMenus(role_id, menu_ids)
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的接口权限 ID 列表
   */
  getRoleApiPaths = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    const result = await roleService.getRoleApiPaths(role_id)
    ctx.success(result.data)
  })

  /**
   * 保存角色的接口权限（覆盖更新）
   */
  saveRoleApis = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { interface_ids } = ctx.request.body

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    if (!Array.isArray(interface_ids)) {
      throw new BadRequestError('interface_ids 必须为数组')
    }

    const result = await roleService.saveRoleApis(role_id, interface_ids)
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的按钮权限 ID 列表
   */
  getRoleButtonIds = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    const result = await roleService.getRoleButtonIds(role_id)
    ctx.success(result.data)
  })

  /**
   * 保存角色的按钮权限（覆盖更新）
   */
  saveRoleButtons = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)
    const { button_ids } = ctx.request.body

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    if (!Array.isArray(button_ids)) {
      throw new BadRequestError('button_ids 必须为数组')
    }

    const result = await roleService.saveRoleButtons(role_id, button_ids)
    ctx.success(null, result.message)
  })

  /**
   * 获取角色的所有权限（聚合查询）
   */
  getRoleAllPermissions = asyncHandler(async (ctx) => {
    const role_id = parseInt(ctx.params.role_id, 10)

    if (isNaN(role_id)) {
      throw new BadRequestError('role_id 必须是有效的数字')
    }

    const result = await roleService.getRoleAllPermissions(role_id)
    ctx.success(result.data)
  })

  /**
   * 导出角色数据为 Excel
   */
  exportRoles = asyncHandler(async (ctx) => {
    const params = {
      page_num: 1,
      page_size: 10000, // 导出所有数据
      role_name: ctx.query.role_name,
      role_key: ctx.query.role_key,
      status: ctx.query.status,
    }

    const result = await roleService.listRoles(params)
    const roles = result.data || []

    // 定义表头
    const headers = [
      { header: '角色ID', key: 'role_id', width: 10 },
      { header: '角色名称', key: 'role_name', width: 20 },
      { header: '角色标识', key: 'role_key', width: 20 },
      { header: '显示排序', key: 'role_sort', width: 12 },
      { header: '数据权限', key: 'data_scope', width: 15 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ]

    // 格式化数据
    const data = roles.map((role) => ({
      ...role,
      status: role.status === '0' ? '正常' : '停用',
      data_scope: this.getDataScopeText(role.data_scope),
      create_time: role.create_time
        ? new Date(role.create_time).toLocaleString('zh-CN')
        : '',
    }))

    // 导出 Excel
    await exportToExcel(ctx, {
      filename: 'role',
      sheetName: '角色列表',
      headers,
      data,
    })
  })

  /**
   * 获取数据权限范围文本
   */
  getDataScopeText(dataScope) {
    const scopeMap = {
      '1': '全部数据权限',
      '2': '自定数据权限',
      '3': '本部门数据权限',
      '4': '本部门及以下数据权限',
      '5': '仅本人数据权限',
    }
    return scopeMap[dataScope] || dataScope
  }
}

module.exports = new RoleController()
