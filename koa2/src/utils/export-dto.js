/**
 * 导出数据转换工具
 * 文件路径：src/utils/export-dto.js
 * 用途：将数据库原始数据转换为可读的导出格式
 */

/**
 * 状态值映射
 */
const STATUS_MAP = {
  0: '正常',
  1: '停用',
}

/**
 * 菜单类型映射
 */
const MENU_TYPE_MAP = {
  M: '目录',
  C: '菜单',
  F: '按钮',
}

/**
 * 性别映射
 */
const SEX_MAP = {
  0: '男',
  1: '女',
  2: '未知',
}

/**
 * 用户类型映射
 */
const USER_TYPE_MAP = {
  '00': '系统用户',
  '01': '注册用户',
}

/**
 * 请求方法映射
 */
const REQUEST_METHOD_MAP = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
}

/**
 * 是否映射
 */
const YES_NO_MAP = {
  0: '否',
  1: '是',
}

/**
 * 转换用户数据为导出格式
 * @param {Object} user - 用户原始数据
 * @returns {Object} 导出格式数据
 */
function transformUserExport(user) {
  return {
    user_id: user.user_id,
    user_name: user.user_name,
    nick_name: user.nick_name,
    email: user.email || '-',
    phonenumber: user.phonenumber || '-',
    sex: SEX_MAP[user.sex] || '未知',
    status: STATUS_MAP[user.status] || '未知',
    dept_name: user.dept_name || '-',
    role_names: user.role_names || '-',
    create_time: formatDateTime(user.create_time),
    update_time: formatDateTime(user.update_time),
    remark: user.remark || '-',
  }
}

/**
 * 转换角色数据为导出格式
 * @param {Object} role - 角色原始数据
 * @returns {Object} 导出格式数据
 */
function transformRoleExport(role) {
  return {
    role_id: role.role_id,
    role_name: role.role_name,
    role_key: role.role_key,
    role_sort: role.role_sort,
    status: STATUS_MAP[role.status] || '未知',
    data_scope: getDataScopeText(role.data_scope),
    create_time: formatDateTime(role.create_time),
    update_time: formatDateTime(role.update_time),
    remark: role.remark || '-',
  }
}

/**
 * 转换菜单数据为导出格式
 * @param {Object} menu - 菜单原始数据
 * @returns {Object} 导出格式数据
 */
function transformMenuExport(menu) {
  return {
    menu_id: menu.menu_id,
    menu_name: menu.menu_name,
    parent_name: menu.parent_name || '顶级菜单',
    order_num: menu.order_num,
    path: menu.path || '-',
    component: menu.component || '-',
    menu_type: MENU_TYPE_MAP[menu.menu_type] || '未知',
    icon: menu.icon || '-',
    is_frame: YES_NO_MAP[String(menu.is_frame)] || '否',
    is_cache: YES_NO_MAP[String(menu.is_cache)] || '否',
    visible: menu.visible === '0' ? '显示' : '隐藏',
    status: STATUS_MAP[menu.status] || '未知',
    create_time: formatDateTime(menu.create_time),
    remark: menu.remark || '-',
  }
}

/**
 * 转换接口数据为导出格式
 * @param {Object} api - 接口原始数据
 * @returns {Object} 导出格式数据
 */
function transformInterfaceExport(api) {
  return {
    interface_id: api.interface_id,
    interface_name: api.interface_name,
    interface_url: api.interface_url,
    interface_method: api.interface_method || 'GET',
    interface_category: api.interface_category || '-',
    status: STATUS_MAP[api.status] || '未知',
    create_time: formatDateTime(api.create_time),
    update_time: formatDateTime(api.update_time),
    remark: api.remark || '-',
  }
}

/**
 * 获取数据范围文本
 * @param {string} dataScope - 数据范围值
 * @returns {string} 数据范围文本
 */
function getDataScopeText(dataScope) {
  const scopeMap = {
    1: '全部数据权限',
    2: '自定数据权限',
    3: '本部门数据权限',
    4: '本部门及以下数据权限',
    5: '仅本人数据权限',
  }
  return scopeMap[dataScope] || '未知'
}

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDateTime(date) {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 导出 DTO 配置
 */
const ExportDTO = {
  // 用户导出配置
  user: {
    filename: '用户数据',
    sheetName: '用户列表',
    headers: [
      { header: '用户ID', key: 'user_id', width: 10 },
      { header: '用户名', key: 'user_name', width: 15 },
      { header: '昵称', key: 'nick_name', width: 15 },
      { header: '邮箱', key: 'email', width: 25 },
      { header: '手机号', key: 'phonenumber', width: 15 },
      { header: '性别', key: 'sex', width: 8 },
      { header: '状态', key: 'status', width: 8 },
      { header: '部门', key: 'dept_name', width: 20 },
      { header: '角色', key: 'role_names', width: 20 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '更新时间', key: 'update_time', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ],
    transform: transformUserExport,
  },

  // 角色导出配置
  role: {
    filename: '角色数据',
    sheetName: '角色列表',
    headers: [
      { header: '角色ID', key: 'role_id', width: 10 },
      { header: '角色名称', key: 'role_name', width: 15 },
      { header: '角色标识', key: 'role_key', width: 15 },
      { header: '显示顺序', key: 'role_sort', width: 12 },
      { header: '状态', key: 'status', width: 8 },
      { header: '数据权限', key: 'data_scope', width: 18 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '更新时间', key: 'update_time', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ],
    transform: transformRoleExport,
  },

  // 菜单导出配置
  menu: {
    filename: '菜单数据',
    sheetName: '菜单列表',
    headers: [
      { header: '菜单ID', key: 'menu_id', width: 10 },
      { header: '菜单名称', key: 'menu_name', width: 15 },
      { header: '父级菜单', key: 'parent_name', width: 15 },
      { header: '显示顺序', key: 'order_num', width: 12 },
      { header: '路由地址', key: 'path', width: 25 },
      { header: '组件路径', key: 'component', width: 25 },
      { header: '菜单类型', key: 'menu_type', width: 10 },
      { header: '菜单图标', key: 'icon', width: 12 },
      { header: '是否外链', key: 'is_frame', width: 10 },
      { header: '是否缓存', key: 'is_cache', width: 10 },
      { header: '显示状态', key: 'visible', width: 10 },
      { header: '菜单状态', key: 'status', width: 8 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ],
    transform: transformMenuExport,
  },

  // 接口导出配置
  interface: {
    filename: '接口数据',
    sheetName: '接口列表',
    headers: [
      { header: '接口ID', key: 'interface_id', width: 10 },
      { header: '接口名称', key: 'interface_name', width: 20 },
      { header: '接口路径', key: 'interface_url', width: 35 },
      { header: '请求方式', key: 'interface_method', width: 12 },
      { header: '所属模块', key: 'interface_category', width: 15 },
      { header: '状态', key: 'status', width: 8 },
      { header: '创建时间', key: 'create_time', width: 20 },
      { header: '更新时间', key: 'update_time', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ],
    transform: transformInterfaceExport,
  },
}

module.exports = {
  ExportDTO,
  STATUS_MAP,
  MENU_TYPE_MAP,
  SEX_MAP,
  USER_TYPE_MAP,
  REQUEST_METHOD_MAP,
  YES_NO_MAP,
  transformUserExport,
  transformRoleExport,
  transformMenuExport,
  transformInterfaceExport,
  formatDateTime,
}
