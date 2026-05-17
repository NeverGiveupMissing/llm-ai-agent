// 说明：权限验证中间件 - 基于若依（RuoYi）风格 sys_menu 权限体系
// 完全使用整型主键（BIGSERIAL），废弃 UUID

const { pool } = require('../config/db')

/**
 * 获取用户的所有权限标识（从 sys_button 表）
 * 通过 sys_user -> sys_user_role -> sys_role -> sys_role_button -> sys_button 多表联查
 * @param {number} user_id - 用户 ID（整型）
 * @returns {Promise<string[]>} 权限标识数组
 */
async function getUserPerms(user_id) {
  const query = `
    SELECT DISTINCT b.perms 
    FROM sys_button b
    INNER JOIN sys_role_button rb ON b.button_id = rb.button_id
    INNER JOIN sys_user_role ur ON rb.role_id = ur.role_id
    INNER JOIN sys_role r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1::int 
      AND b.status = '0' 
      AND r.status = '0'
      AND b.perms IS NOT NULL 
      AND b.perms != ''
  `
  const result = await pool.query(query, [user_id])
  return result.rows.map((row) => row.perms)
}

/**
 * 获取用户拥有的所有接口权限路径（从 sys_role_interface 表）
 * 通过 sys_user -> sys_user_role -> sys_role -> sys_role_interface -> sys_interface 多表联查
 * @param {number} user_id - 用户 ID（整型）
 * @returns {Promise<string[]>} 接口路径数组
 */
async function getUserApiPaths(user_id) {
  const query = `
    SELECT DISTINCT i.interface_url
    FROM sys_role_interface ri
    INNER JOIN sys_user_role ur ON ri.role_id = ur.role_id
    INNER JOIN sys_role r ON ur.role_id = r.role_id
    INNER JOIN sys_interface i ON ri.interface_id = i.interface_id
    WHERE ur.user_id = $1::int
      AND r.status = '0'
      AND i.status = '0'
      AND i.interface_url IS NOT NULL
      AND i.interface_url != ''
  `
  const result = await pool.query(query, [user_id])
  return result.rows.map((row) => row.interface_url)
}

/**
 * 检查用户是否为超级管理员
 * 通过角色 key 判断（role_key = 'admin'）
 * @param {number} user_id - 用户 ID（整型）
 * @returns {Promise<boolean>} 是否为超级管理员
 */
async function isSuperAdmin(user_id) {
  const query = `
    SELECT COUNT(*) as count
    FROM sys_user_role ur
    INNER JOIN sys_role r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1::int 
      AND r.role_key = 'admin'
      AND r.status = '0'
  `
  const result = await pool.query(query, [user_id])
  return parseInt(result.rows[0].count) > 0
}

/**
 * 检查用户是否拥有指定角色
 * @param {number} user_id - 用户 ID（整型）
 * @param {string} roleKey - 角色标识（如 'admin', 'common'）
 * @returns {Promise<boolean>} 是否拥有该角色
 */
async function hasRole(user_id, roleKey) {
  const query = `
    SELECT COUNT(*) as count
    FROM sys_user_role ur
    INNER JOIN sys_role r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1::int 
      AND r.role_key = $2
      AND r.status = '0'
  `
  const result = await pool.query(query, [user_id, roleKey])
  return parseInt(result.rows[0].count) > 0
}

/**
 * 权限验证中间件工厂函数（基于若依 sys_menu/sys_button 权限体系）
 *
 * ✅ 重构：admin 角色直接从 Token 中判断，免查数据库
 *
 * @param {string|string[]} permissionCodes - 权限代码（单个字符串或数组），例如: 'system:menu:list'
 * @param {Object} options - 配置选项
 * @param {string} options.type - 验证类型：'single' | 'any' | 'all'
 * @returns {Function} Koa 中间件函数
 */
function checkPermission(permissionCodes, options = {}) {
  const { type = 'single' } = options

  // 统一转换为数组
  const codes = Array.isArray(permissionCodes) ? permissionCodes : [permissionCodes]

  return async (ctx, next) => {
    try {
      // 从上下文获取用户 ID（认证中间件已存储在 ctx.state.user_id）
      const user_id = ctx.state.user_id

      if (!user_id) {
        ctx.status = 401
        ctx.body = {
          code: 401,
          msg: '未登录或登录已过期',
        }
        return
      }

      // ✅ 核心优化：从 ctx.state.user（JWT Token 解析结果）中直接获取角色信息
      // Token payload 包含 roles 字段，例如: ['admin', 'common']
      const userRoles = ctx.state.user?.roles || []
      const isAdmin = userRoles.some((role) => {
        if (typeof role === 'string') {
          return role.toLowerCase().includes('admin')
        }
        if (role && typeof role === 'object') {
          const roleKey = role.roleKey || role.role_key || ''
          return roleKey.toLowerCase().includes('admin')
        }
        return false
      })

      // ✅ 管理员特权：直接放行，不查库，提升性能
      if (isAdmin) {
        console.log(`👑 [菜单权限验证] 管理员 ${user_id} 跳过菜单/按钮权限检查，路径: ${ctx.path}`)
        await next()
        return
      }

      // ✅ 普通用户降级校验：必须严格校验 sys_button 表
      console.log(` [菜单权限验证] 普通用户 ${user_id} 开始校验权限，路径: ${ctx.path}`)

      // 查询用户的所有权限标识（通过 sys_user_role -> sys_role_button -> sys_button）
      const userPerms = await getUserPerms(user_id)

      if (userPerms.length === 0) {
        console.warn(`⚠️ [菜单权限验证] 用户 ${user_id} 没有任何权限标识，请检查角色和菜单配置`)
      }

      // 若依风格：检查是否拥有全权限标识 *:*:*
      const hasAllPerms = userPerms.includes('*:*:*')

      if (hasAllPerms) {
        console.log(`✅ [菜单权限验证] 用户 ${user_id} 拥有全权限标识，直接放行`)
        await next()
        return
      }

      let hasPermission = false

      switch (type) {
        case 'single':
          // 单个权限验证：用户权限包含所需权限
          hasPermission = codes.some((code) => userPerms.includes(code))
          break

        case 'any':
          // 任一权限验证：用户权限包含任一所需权限
          hasPermission = codes.some((code) => userPerms.includes(code))
          break

        case 'all':
          // 所有权限验证：用户权限包含所有所需权限
          hasPermission = codes.every((code) => userPerms.includes(code))
          break

        default:
          throw new Error(`未知的权限验证类型: ${type}`)
      }

      if (!hasPermission) {
        console.warn(
          `⚠️ [菜单权限验证] 权限验证失败：用户 ${user_id} 缺少权限 ${codes.join(', ')}，路径: ${ctx.path}`,
        )
        ctx.status = 403
        ctx.body = {
          code: 403,
          msg: `对不起，您没有操作该功能的权限！(缺少: ${codes.join(' 或 ')})`,
        }
        return
      }

      console.log(`✅ [菜单权限验证] 权限验证通过：用户 ${user_id}，路径: ${ctx.path}`)
      // 权限验证通过，继续执行后续中间件
      await next()
    } catch (error) {
      //  调试：打印捕获到的错误详情
      console.error(`❌ [菜单权限验证-Catch] 捕获到错误:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200),
      })

      // ✅ 业务错误直接抛出，让全局错误处理中间件统一处理
      // 注意：AppError 及其子类（BadRequestError、ForbiddenError等）都应该直接抛出
      if (
        error.name === 'AppError' ||
        error.name === 'BadRequestError' ||
        error.name === 'ForbiddenError' ||
        error.name === 'NotFoundError' ||
        error.name === 'UnauthorizedError'
      ) {
        console.log(`🔄 [菜单权限验证-Catch] 业务错误，重新抛出: ${error.name}`)
        throw error
      }

      // ✅ 普通 Error 也应该直接抛出，不应该被当作权限错误处理
      // 这通常是控制器或 Service 层抛出的业务异常
      if (error instanceof Error && !error._isPermissionError) {
        console.log(` [菜单权限验证-Catch] 普通业务错误，重新抛出: ${error.name}`)
        throw error
      }

      // 只有真正的权限验证失败才返回 403
      console.warn(
        `⚠️ [菜单权限验证] 权限验证失败：用户 ${ctx.state.user_id} 缺少权限 ${codes.join(', ')}`,
      )
      ctx.status = 403
      ctx.body = {
        code: 403,
        message: `对不起，您没有操作该功能的权限！(缺少: ${codes.join(' 或 ')})`,
        data: null,
      }
      return // ✅ 提前返回，不再执行后续代码
    }
  }
}

/**
 * 便捷方法：单个权限验证
 */
function requirePermission(permissionCode) {
  return checkPermission(permissionCode, { type: 'single' })
}

/**
 * 便捷方法：任一权限验证
 */
function requireAnyPermission(permissionCodes) {
  return checkPermission(permissionCodes, { type: 'any' })
}

/**
 * 便捷方法：所有权限验证
 */
function requireAllPermissions(permissionCodes) {
  return checkPermission(permissionCodes, { type: 'all' })
}

/**
 * 角色验证中间件（重构版）
 *
 * ✅ 优化：admin 角色直接从 Token 中判断，免查数据库
 *
 * @param {string|string[]} roleKeys - 角色标识（单个字符串或数组）
 * @param {Object} options - 配置选项
 * @param {string} options.type - 验证类型：'single' | 'any' | 'all'
 * @returns {Function} Koa 中间件函数
 */
function requireRole(roleKeys, options = {}) {
  const { type = 'any' } = options
  const keys = Array.isArray(roleKeys) ? roleKeys : [roleKeys]

  return async (ctx, next) => {
    try {
      const user_id = ctx.state.user_id

      if (!user_id) {
        ctx.status = 401
        ctx.body = {
          code: 401,
          msg: '未登录或登录已过期',
        }
        return
      }

      // ✅ 核心优化：从 ctx.state.user（JWT Token 解析结果）中直接获取角色信息
      const userRoles = ctx.state.user?.roles || []
      const isAdmin = userRoles.some((role) => {
        if (typeof role === 'string') {
          return role.toLowerCase().includes('admin')
        }
        if (role && typeof role === 'object') {
          const roleKey = role.roleKey || role.role_key || ''
          return roleKey.toLowerCase().includes('admin')
        }
        return false
      })

      // ✅ 管理员特权：直接放行，不查库
      if (isAdmin) {
        console.log(`👑 [角色权限验证] 管理员 ${user_id} 跳过角色权限检查，路径: ${ctx.path}`)
        await next()
        return
      }

      // ✅ 普通用户：检查是否拥有指定角色
      console.log(` [角色权限验证] 普通用户 ${user_id} 开始校验角色权限，路径: ${ctx.path}`)

      let hasRolePermission = false

      switch (type) {
        case 'single':
        case 'any':
          // 检查是否拥有任一角色
          for (const key of keys) {
            if (await hasRole(user_id, key)) {
              hasRolePermission = true
              break
            }
          }
          break

        case 'all':
          // 检查是否拥有所有角色
          hasRolePermission = true
          for (const key of keys) {
            if (!(await hasRole(user_id, key))) {
              hasRolePermission = false
              break
            }
          }
          break

        default:
          throw new Error(`未知的角色验证类型: ${type}`)
      }

      if (!hasRolePermission) {
        console.warn(`⚠️ [角色权限验证] 角色权限验证失败：用户 ${user_id}，路径: ${ctx.path}`)
        ctx.status = 403
        ctx.body = {
          code: 403,
          msg: '没有该角色权限',
        }
        return
      }

      console.log(`✅ [角色权限验证] 角色权限验证通过：用户 ${user_id}，路径: ${ctx.path}`)
      await next()
    } catch (error) {
      // ✅ 业务错误直接抛出，让全局错误处理中间件统一处理
      if (
        error.name === 'BadRequestError' ||
        error.name === 'ForbiddenError' ||
        error.name === 'NotFoundError' ||
        error.name === 'UnauthorizedError'
      ) {
        throw error
      }

      console.warn(`️ [角色权限验证] 角色验证失败：用户 ${ctx.state.user_id}`)
      ctx.status = 403
      ctx.body = {
        code: 403,
        message: '没有该角色权限',
        data: null,
      }
    }
  }
}

/**
 * 便捷方法：单个角色验证
 */
function requireSingleRole(roleKey) {
  return requireRole(roleKey, { type: 'single' })
}

/**
 * 便捷方法：任一角色验证
 */
function requireAnyRole(roleKeys) {
  return requireRole(roleKeys, { type: 'any' })
}

/**
 * 便捷方法：所有角色验证
 */
function requireAllRoles(roleKeys) {
  return requireRole(roleKeys, { type: 'all' })
}

/**
 * 检查用户是否拥有指定接口路径的访问权限
 * 从 sys_role_interface 表校验当前用户的角色是否拥有该 API 路径的访问权限
 * @param {number} user_id - 用户 ID（整型）
 * @param {string} apiPath - 接口路径（如 /api/users）
 * @returns {Promise<boolean>} 是否拥有该接口权限
 */
async function checkApiPermission(user_id, apiPath) {
  // 检查是否为超级管理员
  const superAdmin = await isSuperAdmin(user_id)
  if (superAdmin) {
    return true
  }

  // 查询用户拥有的所有接口权限路径
  const userApiPaths = await getUserApiPaths(user_id)

  // 精确匹配
  if (userApiPaths.includes(apiPath)) {
    return true
  }

  // 通配符匹配（如 /api/users/* 匹配 /api/users/123）
  const wildcardMatch = userApiPaths.some((path) => {
    if (path.endsWith('/*')) {
      const prefix = path.slice(0, -2)
      return apiPath.startsWith(prefix)
    }
    return false
  })

  if (wildcardMatch) {
    return true
  }

  return false
}

/**
 * 接口权限验证中间件（重构版）
 * 校验当前用户是否拥有指定 API 路径的访问权限
 *
 * ✅ 优化：admin 角色直接从 Token 中判断，免查数据库
 *
 * @param {string|string[]} apiPaths - 接口路径（单个字符串或数组）
 * @returns {Function} Koa 中间件函数
 */
function requireApiPermission(apiPaths) {
  const paths = Array.isArray(apiPaths) ? apiPaths : [apiPaths]

  return async (ctx, next) => {
    try {
      const user_id = ctx.state.user_id

      if (!user_id) {
        ctx.status = 401
        ctx.body = {
          code: 401,
          msg: '未登录或登录已过期',
        }
        return
      }

      // ✅ 核心优化：从 ctx.state.user（JWT Token 解析结果）中直接获取角色信息
      // Token payload 包含 roles 字段，例如: ['admin', 'common']
      const userRoles = ctx.state.user?.roles || []
      const isAdmin = userRoles.some((role) => {
        if (typeof role === 'string') {
          return role.toLowerCase().includes('admin')
        }
        if (role && typeof role === 'object') {
          const roleKey = role.roleKey || role.role_key || ''
          return roleKey.toLowerCase().includes('admin')
        }
        return false
      })

      // ✅ 管理员特权：直接放行，不查库，提升性能
      if (isAdmin) {
        console.log(`👑 [API权限验证] 管理员 ${user_id} 跳过接口权限检查，路径: ${ctx.path}`)
        await next()
        return
      }

      // ✅ 普通用户：必须严格校验 sys_interface 和 sys_role_interface 表
      console.log(`🔐 [API权限验证] 普通用户 ${user_id} 开始校验接口权限，路径: ${ctx.path}`)

      // 查询用户拥有的所有接口权限路径（通过 sys_user_role -> sys_role_interface -> sys_interface）
      const userApiPaths = await getUserApiPaths(user_id)

      if (userApiPaths.length === 0) {
        console.warn(`⚠️ [API权限验证] 用户 ${user_id} 没有任何接口权限，请检查角色配置`)
      }

      // 检查是否拥有任一接口权限
      const hasPermission = paths.some((path) => {
        // 精确匹配
        if (userApiPaths.includes(path)) {
          return true
        }

        // 通配符匹配（如 /api/users/* 匹配 /api/users/123）
        return userApiPaths.some((userPath) => {
          if (userPath.endsWith('/*')) {
            const prefix = userPath.slice(0, -2)
            return path.startsWith(prefix)
          }
          return false
        })
      })

      if (!hasPermission) {
        console.warn(
          `⚠️ [API权限验证] 接口权限验证失败：用户 ${user_id} 缺少接口权限 ${paths.join(', ')}，路径: ${ctx.path}`,
        )
        ctx.status = 403
        ctx.body = {
          code: 403,
          msg: `对不起，您没有该后端接口 ${paths.join(' 或 ')} 的访问权限！`,
        }
        return
      }

      console.log(`✅ [API权限验证] 接口权限验证通过：用户 ${user_id}，路径: ${ctx.path}`)
      await next()
    } catch (error) {
      // 业务错误直接抛出
      if (
        error.name === 'AppError' ||
        error.name === 'BadRequestError' ||
        error.name === 'ForbiddenError'
      ) {
        throw error
      }

      console.error(`❌ [API权限验证] 接口权限验证异常:`, error)
      ctx.status = 403
      ctx.body = {
        code: 403,
        msg: '没有该接口访问权限',
      }
    }
  }
}

module.exports = {
  checkPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireSingleRole,
  requireAnyRole,
  requireAllRoles,
  checkApiPermission,
  requireApiPermission,
}
