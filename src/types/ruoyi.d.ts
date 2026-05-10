/**
 * 若依（RuoYi）风格类型定义
 * 用于前端 TypeScript 类型检查和 IDE 智能提示
 */

/**
 * 用户信息 (SysUser)
 */
export interface SysUser {
  /** 用户ID */
  user_id: number
  /** 部门ID */
  deptId?: number
  /** 用户账号 */
  userName: string
  /** 用户昵称 */
  nickName: string
  /** 用户类型（00系统用户） */
  userType?: string
  /** 用户邮箱 */
  email?: string
  /** 手机号码 */
  phonenumber?: string
  /** 用户性别（0男 1女 2未知） */
  sex?: string
  /** 头像地址 */
  avatar?: string
  /** 账号状态（0正常 1停用） */
  status: string
  /** 删除标志（0代表存在 2代表删除） */
  delFlag?: string
  /** 最后登录IP */
  loginIp?: string
  /** 最后登录时间 */
  loginDate?: string
  /** 密码最后更新时间 */
  pwdUpdateDate?: string
  /** 创建者 */
  createBy?: string
  /** 创建时间 */
  createTime?: string
  /** 更新者 */
  updateBy?: string
  /** 更新时间 */
  updateTime?: string
  /** 备注 */
  remark?: string
  /** 角色列表（关联查询时） */
  roles?: SysRole[]
}

/**
 * 角色信息 (SysRole)
 */
export interface SysRole {
  /** 角色ID */
  role_id: number
  /** 角色名称 */
  roleName: string
  /** 角色权限字符串 */
  roleKey: string
  /** 显示顺序 */
  roleSort?: number
  /** 数据范围（1全部 2自定义 3本部门 4本部门及以下） */
  dataScope?: string
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly?: number
  /** 部门树选择项是否关联显示 */
  deptCheckStrictly?: number
  /** 角色状态（0正常 1停用） */
  status: string
  /** 删除标志（0代表存在 2代表删除） */
  delFlag?: string
  /** 创建者 */
  createBy?: string
  /** 创建时间 */
  createTime?: string
  /** 更新者 */
  updateBy?: string
  /** 更新时间 */
  updateTime?: string
  /** 备注 */
  remark?: string
  /** 菜单ID列表（分配权限时） */
  menu_ids?: number[]
  /** 用户ID列表（分配用户时） */
  user_ids?: number[]
}

/**
 * 菜单信息 (SysMenu)
 */
export interface SysMenu {
  /** 菜单ID */
  menu_id: number
  /** 菜单名称 */
  menuName: string
  /** 父菜单ID */
  parentId: number
  /** 显示顺序 */
  orderNum: number
  /** 路由地址 */
  path?: string
  /** 组件路径 */
  component?: string
  /** 路由参数 */
  query?: string
  /** 路由名称 */
  routeName?: string
  /** 是否为外链（0是 1否） */
  isFrame?: number
  /** 是否缓存（0缓存 1不缓存） */
  isCache?: number
  /** 菜单类型（M目录 C菜单 F按钮） */
  menuType: string
  /** 显示状态（0显示 1隐藏） */
  visible: string
  /** 菜单状态（0正常 1停用） */
  status: string
  /** 权限标识 */
  perms?: string
  /** 菜单图标 */
  icon?: string
  /** 创建者 */
  createBy?: string
  /** 创建时间 */
  createTime?: string
  /** 更新者 */
  updateBy?: string
  /** 更新时间 */
  updateTime?: string
  /** 备注 */
  remark?: string
  /** 子菜单列表（树形结构时使用） */
  children?: SysMenu[]
}

/**
 * 用户角色关联 (SysUserRole)
 */
export interface SysUserRole {
  /** 用户ID */
  user_id: number
  /** 角色ID */
  role_id: number
}

/**
 * 角色菜单关联 (SysRoleMenu)
 */
export interface SysRoleMenu {
  /** 角色ID */
  role_id: number
  /** 菜单ID */
  menu_id: number
}

/**
 * 权限验证响应
 */
export interface PermissionCheckResult {
  /** 是否拥有权限 */
  hasPermission: boolean
  /** 用户权限列表 */
  permissions: string[]
  /** 是否为超级管理员 */
  isSuperAdmin: boolean
}

/**
 * 登录用户信息（JWT Token 中的 payload）
 */
export interface LoginUser {
  /** 用户ID */
  user_id: number
  /** 用户名 */
  username: string
  /** 昵称 */
  nickName?: string
  /** 角色列表 */
  roles?: string[]
  /** 权限列表 */
  permissions?: string[]
  /** Token 签发时间 */
  iat?: number
  /** Token 过期时间 */
  exp?: number
}

/**
 * 树形结构通用接口
 */
export interface TreeNode {
  /** 节点ID */
  id: number
  /** 父节点ID */
  parentId: number
  /** 节点名称 */
  name: string
  /** 子节点列表 */
  children?: TreeNode[]
  /** 其他属性 */
  [key: string]: any
}

/**
 * 分页查询参数
 */
export interface PageQuery {
  /** 页码 */
  pageNum: number
  /** 每页数量 */
  page_size: number
  /** 排序字段 */
  orderByColumn?: string
  /** 排序方向（asc/desc） */
  isAsc?: string
}

/**
 * 分页响应
 */
export interface PageResult<T> {
  /** 数据列表 */
  rows: T[]
  /** 总记录数 */
  total: number
  /** 页码 */
  pageNum: number
  /** 每页数量 */
  page_size: number
}
