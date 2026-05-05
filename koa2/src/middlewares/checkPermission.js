// 说明：权限验证中间件 - 基于若依（RuoYi）风格 sys_menu 权限体系
// 完全使用整型主键（BIGSERIAL），废弃 UUID

const { pool } = require('../config/db')

/**
 * 获取用户的所有权限标识（从 sys_menu 表）
 * 通过 sys_user -> sys_user_role -> sys_role -> sys_role_menu -> sys_menu 多表联查
 * @param {number} user_id - 用户 ID（整型）
 * @returns {Promise<string[]>} 权限标识数组
 */
async function getUserPerms(user_id) {
  const query = `
    SELECT DISTINCT m.perms 
    FROM sys_menu m
    INNER JOIN sys_role_menu rm ON m.menu_id = rm.menu_id
    INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
    INNER JOIN sys_role r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1 
      AND m.status = '0' 
      AND r.status = '0'
      AND m.perms IS NOT NULL 
      AND m.perms != ''
  `
  const result = await pool.query(query, [user_id])
  return result.rows.map((row) => row.perms)
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
    WHERE ur.user_id = $1 
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
    WHERE ur.user_id = $1 
      AND r.role_key = $2
      AND r.status = '0'
  `
  const result = await pool.query(query, [user_id, roleKey])
  return parseInt(result.rows[0].count) > 0
}

/**
 * 权限验证中间件工厂函数（基于若依 sys_menu 权限体系）
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

      // 检查是否为超级管理员（role_key = 'admin'）
      const superAdmin = await isSuperAdmin(user_id)

      if (superAdmin) {
        // 超级管理员直接放行
        await next()
        return
      }

      // 查询用户的所有权限标识
      const userPerms = await getUserPerms(user_id)

      if (userPerms.length === 0) {
        console.warn(`⚠️ 用户 ${user_id} 没有任何权限标识，请检查角色和菜单配置`)
      }

      // 若依风格：检查是否拥有全权限标识 *:*:*
      const hasAllPerms = userPerms.includes('*:*:*')

      if (hasAllPerms) {
        // 拥有全权限标识，直接放行
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
        console.warn(`⚠️ 权限验证失败：用户 ${user_id} 缺少权限 ${codes.join(', ')}`)
        ctx.status = 403
        ctx.body = {
          code: 403,
          msg: '没有该操作权限',
        }
        return
      }

      // 权限验证通过，继续执行后续中间件
      await next()
    } catch (error) {
      console.error('权限验证失败:', error.message)
      ctx.status = 500
      ctx.body = {
        code: 500,
        msg: '权限验证失败',
      }
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
 * 角色验证中间件
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

      // 超级管理员拥有所有角色权限
      const superAdmin = await isSuperAdmin(user_id)
      if (superAdmin) {
        await next()
        return
      }

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
        ctx.status = 403
        ctx.body = {
          code: 403,
          msg: '没有该角色权限',
        }
        return
      }

      await next()
    } catch (error) {
      console.error('角色验证失败:', error.message)
      ctx.status = 500
      ctx.body = {
        code: 500,
        msg: '角色验证失败',
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

module.exports = {
  checkPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireSingleRole,
  requireAnyRole,
  requireAllRoles,
}
